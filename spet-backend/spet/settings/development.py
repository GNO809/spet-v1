# ============================================================
# SPET — Settings : Développement
# ============================================================

from .base import *

DEBUG = True

ALLOWED_HOSTS = ['*']

# Logs SQL en dev
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'accounts': {
            'handlers': ['console'],
            'level': 'ERROR',
        },
    },
}

# DRF browsable API en dev
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
]
