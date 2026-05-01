# ============================================================
# SPET — core/exceptions.py
# Handler d'exceptions DRF personnalisé
# ============================================================

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Gère les exceptions DRF et retourne des réponses JSON normalisées.
    Format : { "status": "error", "code": 400, "detail": "..." }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'status': 'error',
            'code':   response.status_code,
        }

        # Extraire le message principal
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                error_data['detail'] = str(response.data['detail'])
            else:
                error_data['detail'] = 'Erreur de validation.'
                error_data['errors'] = response.data
        elif isinstance(response.data, list):
            error_data['detail'] = 'Erreur de validation.'
            error_data['errors'] = response.data
        else:
            error_data['detail'] = str(response.data)

        response.data = error_data

    return response
