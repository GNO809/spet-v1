# ============================================================
# SPET — academics/urls.py
# ============================================================

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UFRViewSet, DepartmentViewSet, FiliereViewSet,
    AcademicYearViewSet, CourseViewSet, StudentGroupViewSet,
)

router = DefaultRouter()
router.register('ufr',            UFRViewSet,          basename='ufr')
router.register('departments',    DepartmentViewSet,   basename='department')
router.register('filieres',       FiliereViewSet,      basename='filiere')
router.register('academic-years', AcademicYearViewSet, basename='academic-year')
router.register('courses',        CourseViewSet,       basename='course')
router.register('groups',         StudentGroupViewSet, basename='student-group')

urlpatterns = [path('', include(router.urls))]
