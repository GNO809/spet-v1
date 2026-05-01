# ============================================================
# SPET — planning/serializers.py
# ============================================================

from rest_framework import serializers
from academics.serializers import CourseMinimalSerializer, FiliereMinimalSerializer
from accounts.serializers import UserListSerializer
from .models import (
    Building, BuildingLevel,
    Room, TimeSlot, TeacherAvailability, RoomAvailability,
    Timetable, Session, Conflict,
)

NIVEAU_SEMESTRES = {
    'L1':    ['S1', 'S2'],
    'L2':    ['S3', 'S4'],
    'L3-RT': ['S5', 'S6'],
    'L3-GL': ['S5', 'S6'],
    'M1':    ['S7', 'S8'],
    'M2':    ['S9', 'S10'],
}


# ── Bâtiment ─────────────────────────────────────────────────
class BuildingLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BuildingLevel
        fields = ['id', 'building', 'name', 'order', 'created_at']
        read_only_fields = ['id', 'created_at']


class BuildingSerializer(serializers.ModelSerializer):
    levels_count = serializers.SerializerMethodField()

    class Meta:
        model  = Building
        fields = ['id', 'name', 'code', 'description', 'levels_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_levels_count(self, obj):
        return obj.levels.count()


# ── Salle ────────────────────────────────────────────────────
class RoomSerializer(serializers.ModelSerializer):
    room_type_display = serializers.CharField(source='get_room_type_display', read_only=True)
    status_display    = serializers.CharField(source='get_status_display',    read_only=True)

    class Meta:
        model  = Room
        fields = [
            'id', 'name', 'capacity', 'room_type', 'room_type_display',
            'building', 'floor', 'equipment', 'status', 'status_display',
            'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RoomMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Room
        fields = ['id', 'name', 'capacity', 'room_type', 'building', 'status']


# ── Créneau ─────────────────────────────────────────────────
class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TimeSlot
        fields = ['id', 'label', 'start_time', 'end_time', 'order']
        read_only_fields = ['id']


# ── Disponibilité enseignant ──────────────────────────────────
class TeacherAvailabilitySerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)

    class Meta:
        model  = TeacherAvailability
        fields = ['id', 'teacher', 'teacher_name', 'day', 'start_time', 'end_time', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        if attrs['start_time'] >= attrs['end_time']:
            raise serializers.ValidationError('L\'heure de début doit être antérieure à la fin.')
        return attrs


class TeacherAvailabilityBulkSerializer(serializers.Serializer):
    """Mise à jour groupée des disponibilités d'un enseignant."""
    slots = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=True,
    )

    def validate_slots(self, slots):
        for slot in slots:
            if 'day' not in slot or 'start_time' not in slot or 'end_time' not in slot:
                raise serializers.ValidationError(
                    'Chaque créneau doit contenir : day, start_time, end_time.'
                )
        return slots


# ── Disponibilité salle ───────────────────────────────────────
class RoomAvailabilitySerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='room.name', read_only=True)

    class Meta:
        model  = RoomAvailability
        fields = ['id', 'room', 'room_name', 'day', 'start_time', 'end_time', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


# ── Séance ───────────────────────────────────────────────────
class SessionSerializer(serializers.ModelSerializer):
    course_name      = serializers.CharField(source='course.name',      read_only=True)
    teacher_name     = serializers.CharField(source='teacher.full_name', read_only=True, default=None)
    room_name        = serializers.CharField(source='room.name',         read_only=True, default=None)
    group_label      = serializers.CharField(source='group.label',       read_only=True, default=None)
    session_type_display = serializers.CharField(source='get_session_type_display', read_only=True)
    duration_minutes     = serializers.IntegerField(read_only=True)
    timetable_semestre   = serializers.CharField(source='timetable.semestre', read_only=True)

    class Meta:
        model  = Session
        fields = [
            'id', 'timetable', 'timetable_semestre',
            'course', 'course_name',
            'teacher', 'teacher_name',
            'room', 'room_name',
            'group', 'group_label',
            'session_type', 'session_type_display',
            'day', 'start_time', 'end_time', 'duration_minutes',
            'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'duration_minutes', 'created_at', 'updated_at']

    def validate(self, attrs):
        if attrs.get('start_time') and attrs.get('end_time'):
            if attrs['start_time'] >= attrs['end_time']:
                raise serializers.ValidationError('L\'heure de début doit être antérieure à la fin.')
        return attrs


# ── Emploi du temps ───────────────────────────────────────────
class TimetableSerializer(serializers.ModelSerializer):
    filiere_name    = serializers.CharField(source='filiere.name',          read_only=True)
    filiere_niveau  = serializers.CharField(source='filiere.niveau',        read_only=True)
    year_label      = serializers.CharField(source='academic_year.label',   read_only=True, default=None)
    created_by_name = serializers.CharField(source='created_by.full_name',  read_only=True, default=None)
    status_display  = serializers.CharField(source='get_status_display',    read_only=True)
    sessions_count  = serializers.IntegerField(source='sessions.count',     read_only=True)
    conflicts_count = serializers.SerializerMethodField()

    class Meta:
        model  = Timetable
        fields = [
            'id', 'filiere', 'filiere_name', 'filiere_niveau',
            'academic_year', 'year_label',
            'semestre', 'status', 'status_display',
            'quality_score', 'sessions_count', 'conflicts_count',
            'created_by', 'created_by_name',
            'validated_by', 'published_by',
            'rejection_reason', 'notes',
            'created_at', 'updated_at', 'published_at',
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'published_at',
            'sessions_count', 'conflicts_count',
        ]

    def get_conflicts_count(self, obj):
        return obj.conflicts.filter(resolved=False).count()

    def validate(self, data):
        filiere  = data.get('filiere') or (self.instance.filiere if self.instance else None)
        semestre = data.get('semestre') or (self.instance.semestre if self.instance else None)
        if filiere and semestre:
            niveau = filiere.niveau
            allowed = NIVEAU_SEMESTRES.get(niveau, [])
            if semestre not in allowed:
                raise serializers.ValidationError({
                    'semestre': (
                        f"Le semestre {semestre} n'est pas valide pour le niveau {niveau}. "
                        f"Semestres autorisés : {', '.join(allowed)}."
                    )
                })
        return data


class TimetableDetailSerializer(TimetableSerializer):
    """EDT avec toutes ses séances."""
    sessions = SessionSerializer(many=True, read_only=True)

    class Meta(TimetableSerializer.Meta):
        fields = TimetableSerializer.Meta.fields + ['sessions']


# ── Conflit ──────────────────────────────────────────────────
class ConflictSerializer(serializers.ModelSerializer):
    conflict_type_display = serializers.CharField(source='get_conflict_type_display', read_only=True)
    session_a_info = serializers.SerializerMethodField()
    session_b_info = serializers.SerializerMethodField()

    class Meta:
        model  = Conflict
        fields = [
            'id', 'timetable', 'session_a', 'session_b',
            'session_a_info', 'session_b_info',
            'conflict_type', 'conflict_type_display',
            'description', 'resolved', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_session_a_info(self, obj):
        s = obj.session_a
        return f'{s.course.name} — {s.day} {s.start_time}'

    def get_session_b_info(self, obj):
        s = obj.session_b
        return f'{s.course.name} — {s.day} {s.start_time}'


# ── Validation workflow ───────────────────────────────────────
class TimetableStatusUpdateSerializer(serializers.Serializer):
    """Pour les actions de workflow : soumettre, valider, rejeter, publier, archiver."""
    action = serializers.ChoiceField(choices=[
        'submit', 'validate', 'reject', 'publish', 'archive', 'restore',
    ])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    notes            = serializers.CharField(required=False, allow_blank=True)
