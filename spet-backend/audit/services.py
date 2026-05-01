# ============================================================
# SPET — audit/services.py
# Fonction utilitaire pour écrire dans le journal
# ============================================================


def get_client_ip(request):
    """Récupère l'IP réelle du client (proxy-aware)."""
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log(action, module, detail, severity='INFO', user=None, request=None, target=''):
    """
    Enregistre une entrée dans le journal d'audit.

    Paramètres
    ----------
    action   : str  — LOGIN / CREATE / UPDATE / DELETE / EXPORT / PUBLISH / VALIDATE / REJECT / ERROR / WARNING
    module   : str  — AUTH / USERS / MAQUETTE / ROOMS / TIMETABLE / SETTINGS / SYSTEM
    detail   : str  — Description humaine de l'événement
    severity : str  — INFO / SUCCESS / WARNING / ERROR  (défaut : INFO)
    user     : User — instance utilisateur (optionnel)
    request  : Request — requête HTTP (pour IP + user courant)
    target   : str  — Ressource cible (ex : "User #42", "Salle B12")
    """
    from .models import AuditLog  # import local pour éviter les circulaires

    ip           = None
    user_display = 'Système'

    if request:
        ip = get_client_ip(request)
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_display = request.user.get_full_name() or request.user.username

    if user:
        user_display = user.get_full_name() or user.username

    try:
        AuditLog.objects.create(
            action=action,
            module=module,
            severity=severity,
            user_display=user_display,
            ip_address=ip,
            detail=detail,
            target=target,
        )
    except Exception:
        pass  # Le journal ne doit jamais bloquer l'application
