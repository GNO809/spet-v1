# ============================================================
# SPET — exports/views.py
# ============================================================

from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from planning.models import Timetable, Session
from accounts.permissions import IsAdminOrChefOrResp
from audit.services import log
from .services import (
    generate_timetable_pdf,
    generate_timetable_excel,
    generate_teacher_timetable_pdf,
)


class ExportTimetablePdfView(APIView):
    """
    GET /exports/timetable/{timetable_id}/pdf/
    Télécharge l'emploi du temps en PDF.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, timetable_id):
        try:
            timetable = Timetable.objects.select_related(
                'filiere', 'academic_year'
            ).prefetch_related(
                'sessions__course', 'sessions__teacher',
                'sessions__room', 'sessions__group',
            ).get(pk=timetable_id)
        except Timetable.DoesNotExist:
            return Response({'detail': 'EDT introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        # Permission : enseignant ne peut exporter que les EDT le concernant
        user = request.user
        if user.role == 'ENSEIGNANT':
            if not timetable.sessions.filter(teacher=user).exists():
                return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            pdf_bytes = generate_timetable_pdf(timetable)
        except ImportError as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        filename = f'EDT_{timetable.filiere.code}_{timetable.semestre}.pdf'
        log(action='EXPORT', module='TIMETABLE', severity='INFO',
            detail=f'Export PDF — {timetable.filiere} S{timetable.semestre}',
            target=f'EDT #{timetable.pk}', request=request)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class ExportTimetableExcelView(APIView):
    """
    GET /exports/timetable/{timetable_id}/excel/
    Télécharge l'emploi du temps en Excel.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, timetable_id):
        try:
            timetable = Timetable.objects.select_related(
                'filiere', 'academic_year'
            ).prefetch_related(
                'sessions__course', 'sessions__teacher',
                'sessions__room', 'sessions__group',
            ).get(pk=timetable_id)
        except Timetable.DoesNotExist:
            return Response({'detail': 'EDT introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            xlsx_bytes = generate_timetable_excel(timetable)
        except ImportError as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        filename = f'EDT_{timetable.filiere.code}_{timetable.semestre}.xlsx'
        log(action='EXPORT', module='TIMETABLE', severity='INFO',
            detail=f'Export Excel — {timetable.filiere} S{timetable.semestre}',
            target=f'EDT #{timetable.pk}', request=request)
        response = HttpResponse(
            xlsx_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class ExportTeacherPdfView(APIView):
    """
    GET /exports/teacher/{teacher_id}/pdf/
    PDF personnel d'un enseignant.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, teacher_id):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            teacher = User.objects.get(id=teacher_id, role='ENSEIGNANT')
        except User.DoesNotExist:
            return Response({'detail': 'Enseignant introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        # Un enseignant ne peut télécharger que son propre EDT
        if request.user.role == 'ENSEIGNANT' and request.user != teacher:
            return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        sessions = Session.objects.filter(
            teacher=teacher,
            timetable__status='PUBLIE',
        ).select_related('course', 'room', 'group').order_by('day', 'start_time')

        try:
            pdf_bytes = generate_teacher_timetable_pdf(teacher, sessions)
        except ImportError as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        filename = f'EDT_{teacher.last_name}_{teacher.first_name}.pdf'
        log(action='EXPORT', module='TIMETABLE', severity='INFO',
            detail=f'Export PDF enseignant — {teacher.get_full_name()}',
            target=f'User #{str(teacher.pk)[:8]}', request=request)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
