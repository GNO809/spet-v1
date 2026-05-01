# ============================================================
# SPET — audit/views.py
# Lecture du journal d'audit (admin uniquement)
# ============================================================

from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import AuditLog
from .serializers import AuditLogSerializer
from accounts.permissions import IsAdmin
from core.pagination import StandardPagination


class AuditLogListView(generics.ListAPIView):
    """
    GET /api/v1/audit/logs/
    Paramètres : action, module, severity, search, page, page_size
    Accès réservé aux administrateurs.
    """
    serializer_class   = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class   = StandardPagination
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['action', 'module', 'severity']
    search_fields      = ['detail', 'user_display', 'ip_address', 'target']
    ordering_fields    = ['timestamp']
    ordering           = ['-timestamp']

    def get_queryset(self):
        qs = AuditLog.objects.all()
        page_size = self.request.query_params.get('page_size')
        if page_size:
            self.pagination_class.page_size = int(page_size)
        return qs
