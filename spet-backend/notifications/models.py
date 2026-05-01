# ============================================================
# SPET — notifications/models.py
# ============================================================

from django.db import models
from django.conf import settings


class NotificationType(models.TextChoices):
    INFO    = 'INFO',    'Information'
    SUCCESS = 'SUCCESS', 'Succès'
    WARNING = 'WARNING', 'Avertissement'
    ERROR   = 'ERROR',   'Erreur'


class Notification(models.Model):
    """Notification système adressée à un utilisateur."""
    user    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    notif_type = models.CharField(
        max_length=10,
        choices=NotificationType.choices,
        default=NotificationType.INFO,
    )
    title   = models.CharField(max_length=200)
    message = models.TextField()
    read    = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    # Lien optionnel vers une ressource (ex : /chef/timetables/42)
    action_url = models.CharField(max_length=300, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering            = ['-created_at']
        indexes             = [
            models.Index(fields=['user', 'read']),
        ]

    def __str__(self):
        return f'[{self.notif_type}] {self.user} — {self.title}'
