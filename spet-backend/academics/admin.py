from django.contrib import admin
from .models import UFR, Department, Filiere, AcademicYear, Course, StudentGroup


@admin.register(UFR)
class UFRAdmin(admin.ModelAdmin):
    list_display  = ['code', 'name']
    search_fields = ['code', 'name']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display  = ['code', 'name', 'ufr', 'head']
    list_filter   = ['ufr']
    search_fields = ['code', 'name']


@admin.register(Filiere)
class FiliereAdmin(admin.ModelAdmin):
    list_display  = ['code', 'name', 'niveau', 'department', 'responsable', 'is_active']
    list_filter   = ['niveau', 'department', 'is_active']
    search_fields = ['code', 'name']


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ['label', 'start_date', 'end_date', 'is_current']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display  = ['code', 'name', 'filiere', 'teacher', 'credits', 'is_active']
    list_filter   = ['filiere', 'is_active']
    search_fields = ['code', 'name']


@admin.register(StudentGroup)
class StudentGroupAdmin(admin.ModelAdmin):
    list_display  = ['name', 'label', 'filiere', 'max_size']
    list_filter   = ['filiere']
