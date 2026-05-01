from django.contrib import admin
from .models import Building, BuildingLevel, Room, TimeSlot, TeacherAvailability, RoomAvailability, Timetable, Session, Conflict


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display  = ['name', 'code', 'description']
    search_fields = ['name', 'code']


@admin.register(BuildingLevel)
class BuildingLevelAdmin(admin.ModelAdmin):
    list_display  = ['name', 'building', 'order']
    list_filter   = ['building']
    search_fields = ['name']


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display  = ['name', 'capacity', 'room_type', 'building', 'status']
    list_filter   = ['room_type', 'status', 'building']
    search_fields = ['name']


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ['label', 'start_time', 'end_time', 'order']


@admin.register(TeacherAvailability)
class TeacherAvailabilityAdmin(admin.ModelAdmin):
    list_display  = ['teacher', 'day', 'start_time', 'end_time']
    list_filter   = ['day']
    search_fields = ['teacher__first_name', 'teacher__last_name']


@admin.register(RoomAvailability)
class RoomAvailabilityAdmin(admin.ModelAdmin):
    list_display = ['room', 'day', 'start_time', 'end_time']
    list_filter  = ['day', 'room']


@admin.register(Timetable)
class TimetableAdmin(admin.ModelAdmin):
    list_display  = ['filiere', 'semestre', 'academic_year', 'status', 'quality_score', 'created_at']
    list_filter   = ['status', 'semestre']
    search_fields = ['filiere__name']


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display  = ['course', 'session_type', 'teacher', 'room', 'day', 'start_time', 'end_time']
    list_filter   = ['session_type', 'day']
    search_fields = ['course__name']


@admin.register(Conflict)
class ConflictAdmin(admin.ModelAdmin):
    list_display = ['timetable', 'conflict_type', 'resolved', 'created_at']
    list_filter  = ['conflict_type', 'resolved']
