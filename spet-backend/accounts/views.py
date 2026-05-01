# ============================================================
# SPET — accounts/views.py
# ============================================================

import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

logger = logging.getLogger(__name__)
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Role, ProfileStatus
from .permissions import IsAdmin, IsAdminOrChefOrResp, IsOwnerOrAdmin, LoginThrottle, PasswordResetThrottle
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserListSerializer,
    UserDetailSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    ProfileValidationSerializer,
)
from notifications.services import create_notification
from audit.services import log

User = get_user_model()


# ── Auth : Login JWT ─────────────────────────────────────────
class LoginView(TokenObtainPairView):
    """POST /auth/login/ — Obtenir un access + refresh token."""
    serializer_class   = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]
    throttle_classes   = [LoginThrottle]


# ── Auth : Logout (blacklist refresh token) ───────────────────
class LogoutView(APIView):
    """POST /auth/logout/ — Invalider le refresh token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'detail': 'refresh token requis.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            log(
                action='LOGOUT', module='AUTH', severity='INFO',
                detail=f'Déconnexion API — {request.user.get_full_name() or request.user.username}',
                target=f'User #{str(request.user.pk)[:8]}',
                request=request,
            )
            return Response({'detail': 'Déconnexion réussie.'}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({'detail': 'Token invalide.'}, status=status.HTTP_400_BAD_REQUEST)


# ── Auth : Utilisateur courant ────────────────────────────────
class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /auth/me/ — Profil de l'utilisateur connecté."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserDetailSerializer

    def get_object(self):
        return self.request.user

    def partial_update(self, request, *args, **kwargs):
        instance   = self.get_object()
        serializer = UserUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log(
            action='UPDATE', module='SETTINGS', severity='INFO',
            detail=f'Profil mis à jour — {request.user.get_full_name()}',
            target=f'User #{str(request.user.pk)[:8]}',
            request=request,
        )
        # Return full detail serializer so the frontend gets all fields + absolute media URLs
        return Response(UserDetailSerializer(instance, context={'request': request}).data)


# ── Auth : Changement de mot de passe ─────────────────────────
class ChangePasswordView(APIView):
    """POST /auth/change-password/ — Changer le mot de passe."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request},
        )
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            log(
                action='UPDATE', module='SETTINGS', severity='SUCCESS',
                detail=f'Mot de passe changé — {request.user.get_full_name()}',
                target=f'User #{str(request.user.pk)[:8]}',
                request=request,
            )
            return Response({'detail': 'Mot de passe modifié avec succès.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Users : liste et création (admin) ────────────────────────
class UserListCreateView(generics.ListCreateAPIView):
    """
    GET  /users/        — Liste des utilisateurs (admin)
    POST /users/        — Créer un utilisateur (admin)
    """
    queryset = User.objects.select_related('department', 'filiere').all()
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active', 'profile_status', 'department']
    search_fields    = ['first_name', 'last_name', 'email', 'username']
    ordering_fields  = ['date_joined', 'last_name', 'role']
    ordering         = ['-date_joined']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAdminOrChefOrResp()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserListSerializer

    def create(self, request, *args, **kwargs):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        create_notification(
            user=user,
            notif_type='SUCCESS',
            title='Bienvenue sur SPET',
            message=f'Votre compte a été créé. Rôle : {user.get_role_display()}.',
        )
        log(
            action='CREATE', module='USERS', severity='SUCCESS',
            detail=f'Nouveau compte — {user.get_full_name()} ({user.get_role_display()})',
            target=f'User #{str(user.pk)[:8]}',
            request=request,
        )
        return Response(UserListSerializer(user).data, status=status.HTTP_201_CREATED)


# ── Users : détail, modification, suppression ─────────────────
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /users/{id}/ — Détail d'un utilisateur
    PATCH  /users/{id}/ — Modifier un utilisateur
    DELETE /users/{id}/ — Supprimer (désactiver) un utilisateur
    """
    queryset     = User.objects.select_related('department', 'filiere').all()
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsAdmin()]
        if self.request.method in ('PUT', 'PATCH'):
            return [IsOwnerOrAdmin()]
        return [IsAdminOrChefOrResp()]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserDetailSerializer

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
        log(
            action='DELETE', module='USERS', severity='WARNING',
            detail=f'Compte désactivé — {instance.get_full_name()} ({instance.get_role_display()})',
            target=f'User #{str(instance.pk)[:8]}',
            request=self.request,
        )

    def partial_update(self, request, *args, **kwargs):
        instance   = self.get_object()
        serializer = UserUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log(
            action='UPDATE', module='USERS', severity='SUCCESS',
            detail=f'Utilisateur modifié — {instance.get_full_name()}',
            target=f'User #{str(instance.pk)[:8]}',
            request=request,
        )
        return Response(UserListSerializer(instance).data)


# ── Users : activer / désactiver un utilisateur (admin) ──────
class ToggleActiveView(APIView):
    """POST /users/{id}/toggle-active/"""
    permission_classes = [IsAdmin]

    def post(self, request, id):
        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            return Response({'detail': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        user.is_active = not user.is_active
        user.save()
        action_label = 'activé' if user.is_active else 'désactivé'
        log(
            action='UPDATE', module='USERS',
            severity='SUCCESS' if user.is_active else 'WARNING',
            detail=f'Compte {action_label} — {user.get_full_name()} ({user.get_role_display()})',
            target=f'User #{str(user.pk)[:8]}',
            request=request,
        )
        return Response(UserListSerializer(user).data)


# ── Users : enseignants d'une filière ────────────────────────
class TeachersListView(generics.ListAPIView):
    """GET /users/teachers/ — Liste des enseignants."""
    serializer_class   = UserListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['department', 'profile_status']
    search_fields      = ['first_name', 'last_name', 'email']

    def get_queryset(self):
        qs    = User.objects.filter(
            role__in=[Role.ENSEIGNANT, Role.CHEF_DEPT, Role.RESP_FIL],
            is_active=True,
        )
        req   = self.request
        niveau = req.query_params.get('niveau')
        if niveau:
            # JSONField contains filter — works on PostgreSQL
            qs = qs.filter(niveaux_souhaites__contains=[niveau])
        return qs.select_related('department')


# ── Users : validation du profil enseignant ───────────────────
class ValidateProfileView(APIView):
    """PATCH /users/{id}/validate-profile/"""
    permission_classes = [IsAdminOrChefOrResp]

    def patch(self, request, id):
        try:
            user = User.objects.get(id=id, role=Role.ENSEIGNANT)
        except User.DoesNotExist:
            return Response({'detail': 'Enseignant introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProfileValidationSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            is_validated  = user.profile_status == ProfileStatus.VALIDE
            status_label  = 'validé' if is_validated else 'rejeté'
            create_notification(
                user=user,
                notif_type='SUCCESS' if is_validated else 'ERROR',
                title=f'Profil {status_label}',
                message=f'Votre profil a été {status_label} par le responsable.',
            )
            log(
                action='VALIDATE' if is_validated else 'REJECT',
                module='USERS',
                severity='SUCCESS' if is_validated else 'WARNING',
                detail=f'Profil enseignant {status_label} — {user.get_full_name()}',
                target=f'User #{str(user.pk)[:8]}',
                request=request,
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Auth : Mot de passe oublié ────────────────────────────────
class PasswordResetRequestView(APIView):
    """POST /auth/password-reset/ — Envoyer un lien de réinitialisation par email."""
    permission_classes = [AllowAny]
    throttle_classes   = [PasswordResetThrottle]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response(
                {'detail': 'Adresse email requise.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(email__iexact=email, is_active=True)
            uid          = urlsafe_base64_encode(force_bytes(user.pk))
            token        = default_token_generator.make_token(user)
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            reset_link   = f"{frontend_url}/reset-password?uid={uid}&token={token}"
            try:
                send_mail(
                    subject='Réinitialisation de votre mot de passe SPET',
                    message=(
                        f"Bonjour {user.get_full_name() or user.username},\n\n"
                        f"Vous avez demandé la réinitialisation de votre mot de passe SPET.\n"
                        f"Cliquez sur le lien ci-dessous (valide 1 heure) :\n\n"
                        f"{reset_link}\n\n"
                        f"Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.\n\n"
                        f"Cordialement,\nL'équipe SPET — UFR Sciences et Technologies"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as mail_err:
                logger.error('SPET password-reset send_mail failed: %s', mail_err)
        except User.DoesNotExist:
            pass  # Ne pas révéler si l'email existe

        return Response({
            'detail': (
                "Si un compte correspond à cette adresse, "
                "un lien de réinitialisation a été envoyé."
            )
        })


class PasswordResetConfirmView(APIView):
    """POST /auth/password-reset/confirm/ — Appliquer le nouveau mot de passe."""
    permission_classes = [AllowAny]
    throttle_classes   = [PasswordResetThrottle]

    def post(self, request):
        uid       = request.data.get('uid',           '').strip()
        token     = request.data.get('token',         '').strip()
        password  = request.data.get('new_password',  '')
        password2 = request.data.get('new_password2', '')

        if not all([uid, token, password, password2]):
            return Response(
                {'detail': 'Tous les champs sont requis.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if password != password2:
            return Response(
                {'detail': 'Les mots de passe ne correspondent pas.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(password) < 8:
            return Response(
                {'detail': 'Le mot de passe doit contenir au moins 8 caractères.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pk   = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'detail': 'Lien de réinitialisation invalide.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {'detail': 'Lien expiré ou invalide. Veuillez refaire une demande.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(password)
        user.save()
        log(
            action='UPDATE', module='AUTH', severity='SUCCESS',
            detail=f'Mot de passe réinitialisé — {user.get_full_name() or user.email}',
            target=f'User #{str(user.pk)[:8]}',
            request=request,
        )
        return Response({
            'detail': 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
        })
