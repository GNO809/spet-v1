# ============================================================
# SPET — notifications/services.py
# Service de création de notifications (utilisé partout)
# ============================================================

from .models import Notification, NotificationType


def create_notification(
    user,
    title: str,
    message: str,
    notif_type: str = NotificationType.INFO,
    action_url: str = '',
) -> Notification:
    """
    Crée et sauvegarde une notification pour un utilisateur.
    Appelé depuis accounts, planning, exports, etc.
    """
    return Notification.objects.create(
        user       = user,
        notif_type = notif_type,
        title      = title,
        message    = message,
        action_url = action_url,
    )


def mark_all_read(user) -> int:
    """Marque toutes les notifications non lues d'un utilisateur comme lues."""
    from django.utils import timezone
    count = Notification.objects.filter(user=user, read=False).update(
        read=True, read_at=timezone.now()
    )
    return count


def get_unread_count(user) -> int:
    return Notification.objects.filter(user=user, read=False).count()
