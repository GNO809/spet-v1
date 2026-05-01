from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['email', 'full_name', 'role', 'profile_status', 'is_active', 'date_joined']
    list_filter   = ['role', 'profile_status', 'is_active', 'is_staff']
    search_fields = ['email', 'first_name', 'last_name']
    ordering      = ['-date_joined']

    # Champs affichés sur la page de détail
    fieldsets = (
        (None, {
            'fields': ('email', 'password'),
        }),
        (_('Informations personnelles'), {
            'fields': ('first_name', 'last_name', 'phone', 'avatar'),
        }),
        (_('SPET — Rôle académique'), {
            'fields': ('role', 'grade', 'profile_status', 'department', 'filiere'),
        }),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Dates'), {
            'fields': ('last_login', 'date_joined'),
        }),
    )

    # Champs affichés lors de la création d'un utilisateur
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'role'),
        }),
    )
