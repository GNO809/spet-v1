# ============================================================
# SPET — dashboard/views.py
# Statistiques adaptées au rôle de l'utilisateur connecté
# ============================================================

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role
from academics.models import Filiere, Department, Course
from planning.models import Room, Timetable, Session, TimetableStatus
from notifications.models import Notification

User = get_user_model()


def _recent_activity_item(user, action, time_ago, act_type):
    return {
        'user':   user.full_name if user else '—',
        'action': action,
        'time':   time_ago,
        'type':   act_type,
    }


class DashboardView(APIView):
    """
    GET /dashboard/
    Retourne les statistiques adaptées au rôle de l'utilisateur.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == Role.ADMIN:
            return Response(self._admin_stats(user))
        elif user.role == Role.CHEF_DEPT:
            return Response(self._chef_dept_stats(user))
        elif user.role == Role.RESP_FIL:
            return Response(self._resp_fil_stats(user))
        elif user.role == Role.ENSEIGNANT:
            return Response(self._enseignant_stats(user))
        return Response({})

    # ── ADMIN ─────────────────────────────────────────────────
    def _admin_stats(self, user):
        total_users    = User.objects.filter(is_active=True).count()
        active_users   = User.objects.filter(is_active=True, last_login__isnull=False).count()
        total_rooms    = Room.objects.count()
        available_rooms = Room.objects.filter(status='available').count()
        total_courses  = Course.objects.filter(is_active=True).count()
        total_edts     = Timetable.objects.count()
        published_edts = Timetable.objects.filter(status=TimetableStatus.PUBLIE).count()
        pending_edts   = Timetable.objects.filter(status=TimetableStatus.EN_ATTENTE_VALIDATION).count()

        # Activité récente (derniers EDT créés/modifiés)
        recent_timetables = Timetable.objects.select_related(
            'filiere', 'created_by'
        ).order_by('-updated_at')[:5]

        recent_activity = []
        for t in recent_timetables:
            action = f'a mis à jour l\'EDT de {t.filiere.name}'
            recent_activity.append({
                'user':   t.created_by.full_name if t.created_by else 'Système',
                'action': action,
                'time':   self._time_ago(t.updated_at),
                'type':   'timetable',
            })

        # Répartition par rôle
        roles_count = {
            role: User.objects.filter(role=role, is_active=True).count()
            for role in [Role.CHEF_DEPT, Role.RESP_FIL, Role.ENSEIGNANT]
        }

        return {
            'role':          'ADMIN',
            'totalUsers':    total_users,
            'activeUsers':   active_users,
            'totalRooms':    total_rooms,
            'availableRooms': available_rooms,
            'totalCourses':  total_courses,
            'totalEdts':     total_edts,
            'publishedEdts': published_edts,
            'pendingEdts':   pending_edts,
            'rolesCount':    roles_count,
            'recentActivity': recent_activity,
        }

    # ── CHEF DE DÉPARTEMENT ───────────────────────────────────
    def _chef_dept_stats(self, user):
        from datetime import timedelta
        dept = user.department
        filieres = Filiere.objects.filter(
            department=dept
        ) if dept else Filiere.objects.none()

        # Count all active teachers — many don't have department explicitly set
        enseignants = User.objects.filter(
            role__in=[Role.ENSEIGNANT, Role.RESP_FIL],
            is_active=True,
        )

        edts = Timetable.objects.filter(
            filiere__department=dept
        ) if dept else Timetable.objects.none()

        filieres_data = []
        for f in filieres:
            edt = f.timetables.order_by('-created_at').first()
            filieres_data.append({
                'id':          str(edt.id) if edt else None,
                'name':        f.name,
                'edtStatus':   edt.status if edt else 'AUCUN',
                'enseignants': enseignants.count(),
            })

        # Pending EDT detail list
        pending_edts_qs = edts.filter(
            status__in=[TimetableStatus.EN_ATTENTE_VALIDATION, TimetableStatus.EN_ATTENTE]
        ).select_related('filiere', 'filiere__responsable').order_by('-updated_at')[:10]
        pending_edts_detail = [
            {
                'id':          str(e.id),
                'filiere':     e.filiere.name,
                'semester':    e.semestre,
                'status':      e.status,
                'quality':     e.quality_score,
                'responsable': e.filiere.responsable.get_full_name() if e.filiere.responsable else '—',
            }
            for e in pending_edts_qs
        ]

        # Submissions per month — last 6 months (only non-BROUILLON = actually submitted)
        submitted_edts = edts.exclude(status=TimetableStatus.BROUILLON)
        now = timezone.now()
        submissions_per_month = []
        for i in range(5, -1, -1):
            raw_month = now.month - i - 1  # 0-based offset
            month = raw_month % 12 + 1
            year  = now.year + raw_month // 12
            count = submitted_edts.filter(created_at__year=year, created_at__month=month).count()
            submissions_per_month.append(count)

        return {
            'role':               'CHEF_DEPT',
            'departmentName':     dept.name if dept else '',
            'totalFilieres':      filieres.count(),
            'totalEnseignants':   enseignants.count(),
            'publishedEdts':      edts.filter(status=TimetableStatus.PUBLIE).count(),
            'pendingEdts':        edts.filter(status__in=[
                TimetableStatus.EN_ATTENTE_VALIDATION, TimetableStatus.EN_ATTENTE
            ]).count(),
            'brouillons':         edts.filter(status=TimetableStatus.BROUILLON).count(),
            'valides':            edts.filter(status=TimetableStatus.VALIDE).count(),
            'archives':           edts.filter(status=TimetableStatus.ARCHIVE).count(),
            'totalCourses':       Session.objects.filter(
                timetable__filiere__department=dept,
                timetable__status=TimetableStatus.PUBLIE,
            ).values('course').distinct().count() if dept else 0,
            'filieres':           filieres_data,
            'pendingEdtsDetail':  pending_edts_detail,
            'submissionsPerMonth': submissions_per_month,
        }

    # ── RESPONSABLE DE FILIÈRE ────────────────────────────────
    def _resp_fil_stats(self, user):
        from planning.models import Conflict
        filiere  = user.filiere
        teachers = User.objects.filter(
            role=Role.ENSEIGNANT,
            department=filiere.department if filiere else None,
            is_active=True,
        )
        edts = Timetable.objects.filter(filiere=filiere) if filiere else Timetable.objects.none()
        pending_profiles = teachers.filter(profile_status='COMPLET').count()

        # Conflits non résolus sur les EDT de cette filière
        conflicts_count = Conflict.objects.filter(
            timetable__filiere=filiere,
            resolved=False,
        ).count() if filiere else 0

        # EDT validés non encore publiés
        ready_to_publish = edts.filter(status=TimetableStatus.VALIDE).count()

        recent_edts = []
        for edt in edts.order_by('-updated_at')[:5]:
            recent_edts.append({
                'id':       str(edt.id),
                'filiere':  edt.filiere.name,
                'semestre': edt.semestre,
                'status':   edt.status,
                'quality':  edt.quality_score,
            })

        return {
            'role':             'RESP_FIL',
            'myEdts':           edts.count(),
            'publishedEdts':    edts.filter(status=TimetableStatus.PUBLIE).count(),
            'readyToPublish':   ready_to_publish,
            'conflicts':        conflicts_count,
            'totalEnseignants': teachers.count(),
            'pendingProfiles':  pending_profiles,
            'recentEdts':       recent_edts,
        }

    # ── ENSEIGNANT ────────────────────────────────────────────
    def _enseignant_stats(self, user):
        my_sessions = Session.objects.filter(
            teacher=user,
            timetable__status=TimetableStatus.PUBLIE,
        ).select_related('course', 'room', 'group')

        # Volume horaire total
        total_minutes = sum(s.duration_minutes for s in my_sessions)
        total_hours   = round(total_minutes / 60, 1)

        # Séances du jour
        today_day = timezone.now().strftime('%A').capitalize()
        # Mapper en français
        day_map = {
            'Monday': 'Lundi', 'Tuesday': 'Mardi', 'Wednesday': 'Mercredi',
            'Thursday': 'Jeudi', 'Friday': 'Vendredi', 'Saturday': 'Samedi', 'Sunday': 'Dimanche',
        }
        today_fr = day_map.get(timezone.now().strftime('%A'), today_day)
        today_sessions = [
            {
                'course': s.course.name,
                'type':   s.session_type,
                'room':   s.room.name if s.room else '—',
                'group':  s.group.label if s.group else '—',
                'start':  s.start_time.strftime('%H:%M'),
                'end':    s.end_time.strftime('%H:%M'),
            }
            for s in my_sessions.filter(day=today_fr).order_by('start_time')
        ]

        unread_notifs = Notification.objects.filter(user=user, read=False).count()

        # Cours distincts
        courses = list(set(s.course.name for s in my_sessions))

        return {
            'role':           'ENSEIGNANT',
            'totalSessions':  my_sessions.count(),
            'totalHours':     total_hours,
            'todaySessions':  today_sessions,
            'unreadNotifs':   unread_notifs,
            'courses':        courses,
            'profileStatus':  user.profile_status,
        }

    @staticmethod
    def _time_ago(dt) -> str:
        now   = timezone.now()
        delta = now - dt
        if delta.days > 0:
            return f'Il y a {delta.days}j'
        hours = delta.seconds // 3600
        if hours > 0:
            return f'Il y a {hours}h'
        minutes = delta.seconds // 60
        return f'Il y a {minutes}min'
