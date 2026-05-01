# ============================================================
# SPET — accounts/serializers.py
# ============================================================

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Role, ProfileStatus


# ── JWT enrichi ──────────────────────────────────────────────
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT avec informations utilisateur intégrées au token."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role']       = user.role
        token['full_name']  = user.full_name
        token['email']      = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        request = self.context.get('request')
        data['user'] = UserDetailSerializer(user, context={'request': request}).data
        return data


# ── Serializer utilisateur (liste / lecture) ─────────────────
class UserListSerializer(serializers.ModelSerializer):
    full_name        = serializers.SerializerMethodField()
    role_display     = serializers.CharField(source='get_role_display', read_only=True)
    profile_status_display = serializers.CharField(
        source='get_profile_status_display', read_only=True
    )
    department_name  = serializers.CharField(
        source='department.name', read_only=True, default=None
    )
    filiere_name     = serializers.CharField(
        source='filiere.name', read_only=True, default=None
    )
    filiere_niveau   = serializers.CharField(
        source='filiere.niveau', read_only=True, default=None
    )
    managed_filiere_niveaux = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email',
            'first_name', 'last_name', 'full_name',
            'phone', 'grade', 'role', 'role_display',
            'profile_status', 'profile_status_display',
            'specialite', 'bio', 'cv', 'niveaux_souhaites',
            'department', 'department_name',
            'filiere', 'filiere_name', 'filiere_niveau',
            'managed_filiere_niveaux',
            'avatar', 'is_active',
            'date_joined', 'updated_at',
        ]

    def get_managed_filiere_niveaux(self, obj):
        """Liste des niveaux de toutes les filières dont cet utilisateur est le responsable."""
        from academics.models import Filiere
        return list(
            Filiere.objects.filter(responsable=obj, is_active=True)
            .values_list('niveau', flat=True)
        )
        read_only_fields = ['id', 'date_joined', 'updated_at']

    def get_full_name(self, obj):
        return obj.full_name


# ── Serializer détaillé (profil complet) ─────────────────────
class UserDetailSerializer(UserListSerializer):
    class Meta(UserListSerializer.Meta):
        fields = UserListSerializer.Meta.fields + ['is_staff', 'last_login']


# ── Serializer création utilisateur ──────────────────────────
class UserCreateSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email',
            'first_name', 'last_name',
            'phone', 'grade', 'role',
            'department', 'filiere',
            'password', 'password2',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({'password': 'Les mots de passe ne correspondent pas.'})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ── Validation MIME pour les uploads ─────────────────────────
_CV_MAGIC = [
    (b'\x25\x50\x44\x46', 'PDF'),           # %PDF
    (b'\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1', 'DOC'),  # OLE2 compound (old .doc)
    (b'\x50\x4B\x03\x04', 'DOCX'),          # ZIP-based (modern .docx)
]
_AVATAR_MAGIC = [
    (b'\xFF\xD8\xFF', 'JPEG'),
    (b'\x89\x50\x4E\x47\x0D\x0A\x1A\x0A', 'PNG'),
]
_MAX_CV_SIZE     = 5 * 1024 * 1024   # 5 MB
_MAX_AVATAR_SIZE = 2 * 1024 * 1024   # 2 MB


def _read_magic(f, n=12):
    header = f.read(n)
    f.seek(0)
    return header


def _is_webp(header):
    return header[:4] == b'\x52\x49\x46\x46' and header[8:12] == b'\x57\x45\x42\x50'


# ── Serializer mise à jour profil ─────────────────────────────
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'grade',
            'specialite', 'bio', 'cv', 'niveaux_souhaites',
            'department', 'filiere', 'avatar',
        ]

    def validate_cv(self, value):
        import os
        if value.size > _MAX_CV_SIZE:
            raise serializers.ValidationError('Le CV ne peut pas dépasser 5 Mo.')
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in {'.pdf', '.doc', '.docx'}:
            raise serializers.ValidationError('Format non autorisé. Utilisez PDF, DOC ou DOCX.')
        header = _read_magic(value)
        if not any(header[:len(sig)] == sig for sig, _ in _CV_MAGIC):
            raise serializers.ValidationError('Le contenu du fichier ne correspond pas à un format valide (PDF/DOC/DOCX).')
        return value

    def validate_avatar(self, value):
        import os
        if value.size > _MAX_AVATAR_SIZE:
            raise serializers.ValidationError('L\'avatar ne peut pas dépasser 2 Mo.')
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in {'.jpg', '.jpeg', '.png', '.webp'}:
            raise serializers.ValidationError('Format non autorisé. Utilisez JPEG, PNG ou WebP.')
        header = _read_magic(value)
        is_known = (
            any(header[:len(sig)] == sig for sig, _ in _AVATAR_MAGIC)
            or _is_webp(header)
        )
        if not is_known:
            raise serializers.ValidationError('Le contenu du fichier ne correspond pas à une image valide (JPEG/PNG/WebP).')
        return value

    def validate_niveaux_souhaites(self, value):
        import json
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except (ValueError, TypeError):
                value = []
        return value if isinstance(value, list) else []

    def validate(self, attrs):
        instance   = self.instance
        first_name = attrs.get('first_name', instance.first_name if instance else '')
        last_name  = attrs.get('last_name',  instance.last_name  if instance else '')
        phone      = attrs.get('phone',      instance.phone      if instance else '')
        specialite = attrs.get('specialite', instance.specialite if instance else '')
        niveaux    = attrs.get('niveaux_souhaites', instance.niveaux_souhaites if instance else [])

        if first_name and last_name and phone and specialite and niveaux:
            attrs['profile_status'] = ProfileStatus.COMPLET
        return attrs


# ── Changement de mot de passe ────────────────────────────────
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password': 'Les mots de passe ne correspondent pas.'})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Mot de passe actuel incorrect.')
        return value


# ── Validation du statut profil (RESP_FIL → enseignant) ──────
class ProfileValidationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['profile_status']

    def validate_profile_status(self, value):
        allowed = [ProfileStatus.VALIDE, ProfileStatus.REJETE]
        if value not in allowed:
            raise serializers.ValidationError(
                f"Le statut doit être parmi : {', '.join(allowed)}"
            )
        return value
