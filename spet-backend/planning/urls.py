from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BuildingViewSet, BuildingLevelViewSet,
    RoomViewSet, TimeSlotViewSet,
    TeacherAvailabilityViewSet, RoomAvailabilityViewSet,
    TimetableViewSet, SessionViewSet, ConflictViewSet,
)

router = DefaultRouter()
router.register('buildings',          BuildingViewSet,             basename='building')
router.register('levels',             BuildingLevelViewSet,        basename='building-level')
router.register('rooms',              RoomViewSet,                 basename='room')
router.register('timeslots',          TimeSlotViewSet,             basename='timeslot')
router.register('availabilities',     TeacherAvailabilityViewSet,  basename='teacher-avail')
router.register('room-availabilities',RoomAvailabilityViewSet,     basename='room-avail')
router.register('timetables',         TimetableViewSet,            basename='timetable')
router.register('sessions',           SessionViewSet,              basename='session')
router.register('conflicts',          ConflictViewSet,             basename='conflict')

urlpatterns = [path('', include(router.urls))]
