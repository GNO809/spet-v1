# ============================================================
# SPET — URLs principale
# ============================================================

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

API_V1 = 'api/v1/'

urlpatterns = [
    # Admin Django
    path('admin/', admin.site.urls),

    # ── API v1 ──────────────────────────────────────────────
    path(API_V1 + 'auth/',          include('accounts.urls.auth')),
    path(API_V1 + 'users/',         include('accounts.urls.users')),
    path(API_V1 + 'academics/',     include('academics.urls')),
    path(API_V1 + 'planning/',      include('planning.urls')),
    path(API_V1 + 'notifications/', include('notifications.urls')),
    path(API_V1 + 'exports/',       include('exports.urls')),
    path(API_V1 + 'dashboard/',     include('dashboard.urls')),
    path(API_V1 + 'audit/',         include('audit.urls')),
]

# Fichiers médias en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,  document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
