# ============================================================
# SPET — academics/views.py
# ============================================================

from rest_framework import viewsets, filters
from rest_framework.response import Response
from rest_framework import status as drf_status
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import IsAdmin, IsAdminOrChefOrResp, IsAuthenticatedReadOnly
from audit.services import log
from .models import UFR, Department, Filiere, AcademicYear, Course, StudentGroup
from .serializers import (
    UFRSerializer, DepartmentSerializer, FiliereSerializer,
    AcademicYearSerializer, CourseSerializer, StudentGroupSerializer,
)


class UFRViewSet(viewsets.ModelViewSet):
    queryset         = UFR.objects.all()
    serializer_class = UFRSerializer
    filter_backends  = [filters.SearchFilter]
    search_fields    = ['name', 'code']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticatedReadOnly()]

    def perform_create(self, serializer):
        obj = serializer.save()
        log(action='CREATE', module='MAQUETTE', severity='SUCCESS',
            detail=f'UFR créée — {obj.name}', target=f'UFR #{obj.pk}', request=self.request)

    def perform_update(self, serializer):
        obj = serializer.save()
        log(action='UPDATE', module='MAQUETTE', severity='INFO',
            detail=f'UFR modifiée — {obj.name}', target=f'UFR #{obj.pk}', request=self.request)

    def perform_destroy(self, instance):
        log(action='DELETE', module='MAQUETTE', severity='WARNING',
            detail=f'UFR supprimée — {instance.name}', target=f'UFR #{instance.pk}', request=self.request)
        instance.delete()


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset         = Department.objects.select_related('ufr', 'head').all()
    serializer_class = DepartmentSerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['ufr']
    search_fields    = ['name', 'code']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticatedReadOnly()]

    def perform_create(self, serializer):
        obj = serializer.save()
        log(action='CREATE', module='MAQUETTE', severity='SUCCESS',
            detail=f'Département créé — {obj.name}', target=f'Dept #{obj.pk}', request=self.request)

    def perform_update(self, serializer):
        obj = serializer.save()
        log(action='UPDATE', module='MAQUETTE', severity='INFO',
            detail=f'Département modifié — {obj.name}', target=f'Dept #{obj.pk}', request=self.request)

    def perform_destroy(self, instance):
        log(action='DELETE', module='MAQUETTE', severity='WARNING',
            detail=f'Département supprimé — {instance.name}', target=f'Dept #{instance.pk}', request=self.request)
        instance.delete()


class FiliereViewSet(viewsets.ModelViewSet):
    queryset = Filiere.objects.select_related(
        'department', 'responsable'
    ).prefetch_related('courses').filter(is_active=True)
    serializer_class = FiliereSerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'niveau', 'responsable']
    search_fields    = ['name', 'code']
    ordering_fields  = ['name', 'niveau']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrChefOrResp()]
        return [IsAuthenticatedReadOnly()]

    def get_queryset(self):
        qs   = super().get_queryset()
        user = self.request.user
        # ?all_niveaux=1 → retourne toutes les filières sans filtre de rôle
        # (utilisé pour la page profil pour afficher tous les niveaux disponibles)
        if self.request.query_params.get('all_niveaux') == '1':
            return qs
        if user.role == 'RESP_FIL' and user.filiere:
            qs = qs.filter(pk=user.filiere.pk)
        return qs

    def perform_create(self, serializer):
        obj = serializer.save()
        log(action='CREATE', module='MAQUETTE', severity='SUCCESS',
            detail=f'Filière créée — {obj.name} ({obj.niveau})', target=f'Filière #{obj.code}', request=self.request)

    def perform_update(self, serializer):
        obj = serializer.save()
        log(action='UPDATE', module='MAQUETTE', severity='INFO',
            detail=f'Filière modifiée — {obj.name}', target=f'Filière #{obj.code}', request=self.request)

    def perform_destroy(self, instance):
        log(action='DELETE', module='MAQUETTE', severity='WARNING',
            detail=f'Filière supprimée — {instance.name}', target=f'Filière #{instance.code}', request=self.request)
        instance.delete()


class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset         = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticatedReadOnly()]

    def perform_create(self, serializer):
        obj = serializer.save()
        log(action='CREATE', module='SYSTEM', severity='INFO',
            detail=f'Année académique créée — {obj}', target=f'AnnéeAcad #{obj.pk}', request=self.request)


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.select_related('filiere', 'teacher').filter(is_active=True)
    serializer_class = CourseSerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['filiere', 'teacher', 'credits', 'semestre', 'filiere__niveau']
    search_fields    = ['name', 'code', 'ue']
    ordering_fields  = ['name', 'code', 'credits', 'semestre']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrChefOrResp()]
        return [IsAuthenticatedReadOnly()]

    def get_queryset(self):
        qs   = super().get_queryset()
        user = self.request.user
        if user.role == 'ENSEIGNANT':
            qs = qs.filter(teacher=user)
        elif user.role == 'RESP_FIL' and user.filiere:
            qs = qs.filter(filiere=user.filiere)
        return qs

    def perform_create(self, serializer):
        obj = serializer.save()
        log(action='CREATE', module='MAQUETTE', severity='SUCCESS',
            detail=f'Cours créé — {obj.code} : {obj.name}',
            target=f'Cours #{obj.code}', request=self.request)

    def perform_update(self, serializer):
        obj = serializer.save()
        log(action='UPDATE', module='MAQUETTE', severity='INFO',
            detail=f'Cours modifié — {obj.code} : {obj.name}',
            target=f'Cours #{obj.code}', request=self.request)

    def perform_destroy(self, instance):
        log(action='DELETE', module='MAQUETTE', severity='WARNING',
            detail=f'Cours supprimé — {instance.code} : {instance.name}',
            target=f'Cours #{instance.code}', request=self.request)
        instance.delete()


class StudentGroupViewSet(viewsets.ModelViewSet):
    queryset         = StudentGroup.objects.select_related('filiere').all()
    serializer_class = StudentGroupSerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_fields = ['filiere']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrChefOrResp()]
        return [IsAuthenticatedReadOnly()]

    def perform_create(self, serializer):
        obj = serializer.save()
        log(action='CREATE', module='MAQUETTE', severity='INFO',
            detail=f'Groupe créé — {obj.name}', target=f'Groupe #{obj.pk}', request=self.request)

    def perform_destroy(self, instance):
        log(action='DELETE', module='MAQUETTE', severity='WARNING',
            detail=f'Groupe supprimé — {instance.name}', target=f'Groupe #{instance.pk}', request=self.request)
        instance.delete()
