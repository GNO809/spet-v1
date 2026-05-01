# ============================================================
# SPET — audit/signals.py
# Auth uniquement — tout le reste est loggé directement dans les views
# ============================================================

from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver

from .services import log


@receiver(user_logged_in)
def on_login(sender, request, user, **kwargs):
    log(
        action='LOGIN', module='AUTH', severity='INFO',
        detail=f'Connexion réussie — {user.get_full_name() or user.username} ({user.get_role_display()})',
        target=f'User #{str(user.pk)[:8]}',
        request=request,
    )


@receiver(user_logged_out)
def on_logout(sender, request, user, **kwargs):
    if user:
        log(
            action='LOGOUT', module='AUTH', severity='INFO',
            detail=f'Déconnexion — {user.get_full_name() or user.username}',
            target=f'User #{str(user.pk)[:8]}',
            request=request,
        )


@receiver(user_login_failed)
def on_login_failed(sender, credentials, request, **kwargs):
    email = credentials.get('email') or credentials.get('username', '—')
    log(
        action='ERROR', module='AUTH', severity='ERROR',
        detail=f'Échec authentification — identifiant : {email}',
        target='Auth',
        request=request,
    )
