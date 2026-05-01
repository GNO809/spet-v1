# ============================================================
# SPET — audit/models.py
# Journal d'audit — trace toutes les actions de l'application
# ============================================================

from django.db import models


class AuditLog(models.Model):

    ACTION_CHOICES = [
        ('LOGIN',    'Connexion'),
        ('LOGOUT',   'Déconnexion'),
        ('CREATE',   'Création'),
        ('UPDATE',   'Modification'),
        ('DELETE',   'Suppression'),
        ('VIEW',     'Consultation'),
        ('EXPORT',   'Export'),
        ('PUBLISH',  'Publication'),
        ('VALIDATE', 'Validation'),
        ('REJECT',   'Rejet'),
        ('ERROR',    'Erreur'),
        ('WARNING',  'Avertissement'),
    ]

    MODULE_CHOICES = [
        ('AUTH',      'Authentification'),
        ('USERS',     'Utilisateurs'),
        ('MAQUETTE',  'Maquette'),
        ('ROOMS',     'Salles'),
        ('TIMETABLE', 'Emploi du temps'),
        ('SETTINGS',  'Paramètres'),
        ('SYSTEM',    'Système'),
    ]

    SEVERITY_CHOICES = [
        ('INFO',    'Information'),
        ('SUCCESS', 'Succès'),
        ('WARNING', 'Avertissement'),
        ('ERROR',   'Erreur'),
    ]

    action       = models.CharField(max_length=20,  choices=ACTION_CHOICES)
    module       = models.CharField(max_length=20,  choices=MODULE_CHOICES,   default='SYSTEM')
    severity     = models.CharField(max_length=10,  choices=SEVERITY_CHOICES, default='INFO')
    user_display = models.CharField(max_length=150, blank=True, default='Système')
    ip_address   = models.GenericIPAddressField(null=True, blank=True)
    detail       = models.TextField()
    target       = models.CharField(max_length=200, blank=True)
    timestamp    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering            = ['-timestamp']
        verbose_name        = "Entrée journal"
        verbose_name_plural = "Journal d'audit"
        indexes             = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['module']),
            models.Index(fields=['severity']),
        ]

    def __str__(self):
        return f'[{self.severity}] {self.action} — {self.user_display} — {self.detail[:60]}'
