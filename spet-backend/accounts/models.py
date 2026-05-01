import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ADMIN = 'ADMIN', 'Administrateur'
    CHEF_DEPT = 'CHEF_DEPT', 'Chef de Département'
    RESP_FIL = 'RESP_FIL', 'Responsable de Filière'
    ENSEIGNANT = 'ENSEIGNANT', 'Enseignant'


class ProfileStatus(models.TextChoices):
    INCOMPLET = 'INCOMPLET', 'Incomplet'
    COMPLET = 'COMPLET', 'Complet'
    VALIDE = 'VALIDE', 'Validé'
    REJETE = 'REJETE', 'Rejeté'


class User(AbstractUser):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ENSEIGNANT,
        db_index=True,
    )

    phone = models.CharField(max_length=20, blank=True, null=True)

    grade = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='Ex: Professeur, Maître de Conférences, Assistant…',
    )

    profile_status = models.CharField(
        max_length=20,
        choices=ProfileStatus.choices,
        default=ProfileStatus.INCOMPLET,
    )

    department = models.ForeignKey(
        'academics.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members',
    )

    filiere = models.ForeignKey(
        'academics.Filiere',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='responsable_set',
    )

    specialite = models.CharField(max_length=100, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    cv = models.FileField(upload_to='cvs/', null=True, blank=True)
    niveaux_souhaites = models.JSONField(
        default=list,
        blank=True,
        help_text="Niveaux où l'enseignant souhaite enseigner (ex: ['L1','L2','M1'])",
    )

    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
    )

    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.get_full_name()} ({self.get_role_display()})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    # Hiérarchie des rôles : chaque rôle hérite des droits des rôles listés
    ROLE_HIERARCHY = {
        Role.ADMIN:      [Role.ADMIN, Role.CHEF_DEPT, Role.RESP_FIL, Role.ENSEIGNANT],
        Role.CHEF_DEPT:  [Role.CHEF_DEPT,  Role.ENSEIGNANT],
        Role.RESP_FIL:   [Role.RESP_FIL,   Role.ENSEIGNANT],
        Role.ENSEIGNANT: [Role.ENSEIGNANT],
    }

    @property
    def is_admin(self):
        return self.role == Role.ADMIN

    @property
    def is_chef_dept(self):
        return self.role == Role.CHEF_DEPT

    @property
    def is_resp_fil(self):
        return self.role == Role.RESP_FIL

    @property
    def is_enseignant(self):
        return self.has_role(Role.ENSEIGNANT)

    def has_role(self, *roles):
        inherited = self.ROLE_HIERARCHY.get(self.role, [self.role])
        return any(r in inherited for r in roles)