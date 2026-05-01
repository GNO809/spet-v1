# ============================================================
# SPET — notifications/views.py
# ============================================================

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import viewsets

from .models import Notification
from .serializers import NotificationSerializer
from .services import mark_all_read, get_unread_count


class NotificationViewSet(viewsets.ModelViewSet):
    """
    GET    /notifications/        — Mes notifications (paginées)
    GET    /notifications/?read=false — Non lues uniquement
    PATCH  /notifications/{id}/   — Marquer comme lue
    POST   /notifications/mark-all-read/ — Tout marquer lu
    GET    /notifications/unread-count/  — Compteur non lues
    DELETE /notifications/{id}/   — Supprimer
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs   = Notification.objects.filter(user=self.request.user)
        read = self.request.query_params.get('read')
        if read == 'false':
            qs = qs.filter(read=False)
        elif read == 'true':
            qs = qs.filter(read=True)
        return qs

    def partial_update(self, request, *args, **kwargs):
        notif = self.get_object()
        notif.read    = True
        notif.read_at = timezone.now()
        notif.save()
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all(self, request):
        count = mark_all_read(request.user)
        return Response({'marked_read': count})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        return Response({'unread_count': get_unread_count(request.user)})
