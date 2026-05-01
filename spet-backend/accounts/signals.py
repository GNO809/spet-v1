"""
SPET — accounts/signals.py
Actions post-sauvegarde sur les utilisateurs.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='accounts.User')
def on_user_created(sender, instance, created, **kwargs):
    """Création d'une notification de bienvenue à l'inscription."""
    if created and not instance.is_superuser:
        # Import local pour éviter les imports circulaires
        try:
            from notifications.services import create_notification
            create_notification(
                user=instance,
                notif_type='INFO',
                title='Bienvenue sur SPET',
                message=(
                    f'Bonjour {instance.first_name}, votre compte SPET a été créé. '
                    'Complétez votre profil pour commencer.'
                ),
            )
        except Exception:
            pass  # Signal non bloquant
