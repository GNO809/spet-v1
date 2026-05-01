from django.urls import path
from .views import (
    ExportTimetablePdfView,
    ExportTimetableExcelView,
    ExportTeacherPdfView,
)

urlpatterns = [
    path('timetable/<int:timetable_id>/pdf/',   ExportTimetablePdfView.as_view(),   name='export-timetable-pdf'),
    path('timetable/<int:timetable_id>/excel/', ExportTimetableExcelView.as_view(), name='export-timetable-excel'),
    path('teacher/<uuid:teacher_id>/pdf/',      ExportTeacherPdfView.as_view(),     name='export-teacher-pdf'),
]
