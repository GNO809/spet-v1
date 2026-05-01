# ============================================================
# SPET — accounts/permissions.py
# Permissions DRF basées sur les rôles
# ============================================================

from rest_framework.permissions import BasePermission
from rest_framework.throttling import AnonRateThrottle
from .models import Role


class LoginThrottle(AnonRateThrottle):
    """10 tentatives de connexion par minute par IP."""
    scope = 'login'


class PasswordResetThrottle(AnonRateThrottle):
    """5 demandes de réinitialisation par heure par IP."""
    scope = 'password_reset'


class IsAdmin(BasePermission):
    """Accès réservé aux administrateurs."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role == Role.ADMIN)


class IsChefDept(BasePermission):
    """Accès réservé aux chefs de département."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role == Role.CHEF_DEPT)


class IsRespFil(BasePermission):
    """Accès réservé aux responsables de filière."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role == Role.RESP_FIL)


class IsEnseignant(BasePermission):
    """Accès enseignant : ENSEIGNANT, RESP_FIL et CHEF_DEPT (héritage de rôle)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.has_role(Role.ENSEIGNANT))


class IsAdminOrChefDept(BasePermission):
    """Admin ou Chef de département."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in [Role.ADMIN, Role.CHEF_DEPT])


class IsAdminOrRespFil(BasePermission):
    """Admin ou Responsable de filière."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in [Role.ADMIN, Role.RESP_FIL])


class IsAdminOrChefOrResp(BasePermission):
    """Admin, Chef de département ou Responsable de filière."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in [Role.ADMIN, Role.CHEF_DEPT, Role.RESP_FIL])


class IsOwnerOrAdmin(BasePermission):
    """Le propriétaire de la ressource ou un administrateur."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == Role.ADMIN:
            return True
        # Suppose que l'objet a un champ 'user' ou 'teacher' ou est l'utilisateur lui-même
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'teacher'):
            return obj.teacher == request.user
        return obj == request.user


class IsAuthenticatedReadOnly(BasePermission):
    """Lecture pour tout utilisateur authentifié, écriture pour admins."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.role == Role.ADMIN
