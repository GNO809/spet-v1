# ============================================================
# SPET — academics/serializers.py
# ============================================================

from rest_framework import serializers
from .models import UFR, Department, Filiere, AcademicYear, Course, StudentGroup, Niveau


class UFRSerializer(serializers.ModelSerializer):
    departments_count = serializers.IntegerField(source='departments.count', read_only=True)

    class Meta:
        model  = UFR
        fields = ['id', 'name', 'code', 'description', 'departments_count', 'created_at']
        read_only_fields = ['id', 'created_at']


class DepartmentSerializer(serializers.ModelSerializer):
    ufr_name       = serializers.CharField(source='ufr.name',  read_only=True)
    head_name      = serializers.CharField(source='head.full_name', read_only=True, default=None)
    filieres_count = serializers.IntegerField(source='filieres.count', read_only=True)

    class Meta:
        model  = Department
        fields = [
            'id', 'ufr', 'ufr_name', 'name', 'code',
            'head', 'head_name', 'description',
            'filieres_count', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class FiliereSerializer(serializers.ModelSerializer):
    department_name  = serializers.CharField(source='department.name', read_only=True)
    responsable_name = serializers.CharField(source='responsable.full_name', read_only=True, default=None)
    niveau_display   = serializers.CharField(source='get_niveau_display', read_only=True)
    courses_count    = serializers.IntegerField(source='courses.count', read_only=True)

    class Meta:
        model  = Filiere
        fields = [
            'id', 'department', 'department_name',
            'name', 'code', 'niveau', 'niveau_display',
            'responsable', 'responsable_name',
            'description', 'is_active', 'courses_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AcademicYear
        fields = ['id', 'label', 'start_date', 'end_date', 'is_current']
        read_only_fields = ['id']


class CourseSerializer(serializers.ModelSerializer):
    filiere_name   = serializers.CharField(source='filiere.name',          read_only=True)
    filiere_niveau = serializers.CharField(source='filiere.niveau',        read_only=True)
    teacher_name   = serializers.CharField(source='teacher.full_name',     read_only=True, default=None)
    total_hours    = serializers.IntegerField(read_only=True)

    class Meta:
        model  = Course
        fields = [
            'id', 'filiere', 'filiere_name', 'filiere_niveau',
            'code', 'name', 'ue', 'semestre', 'credits', 'coefficient',
            'volume_cm', 'volume_td', 'volume_tp', 'total_hours',
            'teacher', 'teacher_name',
            'description', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'total_hours', 'created_at', 'updated_at']

    def validate_teacher(self, value):
        if value is None:
            return value
        from accounts.models import ProfileStatus
        if value.profile_status != ProfileStatus.VALIDE:
            raise serializers.ValidationError(
                f"Le profil de {value.get_full_name()} n'est pas encore validé. "
                "Un responsable de filière doit valider ce profil avant toute affectation."
            )
        return value


class StudentGroupSerializer(serializers.ModelSerializer):
    filiere_name = serializers.CharField(source='filiere.name', read_only=True)

    class Meta:
        model  = StudentGroup
        fields = ['id', 'filiere', 'filiere_name', 'name', 'label', 'max_size', 'created_at']
        read_only_fields = ['id', 'created_at']


# ── Serializer léger (pour nested) ───────────────────────────
class FiliereMinimalSerializer(serializers.ModelSerializer):
    niveau_display = serializers.CharField(source='get_niveau_display', read_only=True)

    class Meta:
        model  = Filiere
        fields = ['id', 'name', 'code', 'niveau', 'niveau_display']


class CourseMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Course
        fields = ['id', 'code', 'name', 'ue', 'semestre', 'credits', 'coefficient', 'volume_cm', 'volume_td', 'volume_tp']
