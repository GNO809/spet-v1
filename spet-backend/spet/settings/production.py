# ============================================================
# SPET — Settings : Production
# ============================================================

from .base import *

DEBUG = False

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

# Render.com utilise un reverse-proxy HTTPS — Django doit faire confiance au header
SECURE_PROXY_SSL_HEADER    = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT         = False  # Render gère la redirection HTTPS
SESSION_COOKIE_SECURE       = True
CSRF_COOKIE_SECURE          = True
SECURE_HSTS_SECONDS         = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD         = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Email production
EMAIL_BACKEND  = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST     = config('EMAIL_HOST',     default='smtp.gmail.com')
EMAIL_PORT     = config('EMAIL_PORT',     default=587, cast=int)
EMAIL_USE_TLS  = config('EMAIL_USE_TLS',  default=True, cast=bool)
EMAIL_HOST_USER     = config('EMAIL_HOST_USER',     default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

# Logs vers la console (Render n'a pas de disque persistant)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
}
