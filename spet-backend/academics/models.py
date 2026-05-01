# ============================================================
# SPET — academics/models.py
# Structure académique : UFR → Département → Filière → Niveau → Cours
# ============================================================

from django.db import models
from django.conf import settings


class UFR(models.Model):
    """Unité de Formation et de Recherche."""
    name        = models.CharField(max_length=200, unique=True)
    code        = models.CharField(max_length=20,  unique=True)
    description = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'UFR'
        verbose_name_plural = 'UFRs'
        ordering            = ['name']

    def __str__(self):
        return f'{self.code} — {self.name}'


class Department(models.Model):
    """Département scientifique au sein d'une UFR."""
    ufr         = models.ForeignKey(UFR, on_delete=models.CASCADE, related_name='departments')
    name        = models.CharField(max_length=200)
    code        = models.CharField(max_length=20)
    head        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='headed_departments',
    )
    description = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Département'
        verbose_name_plural = 'Départements'
        ordering            = ['name']
        unique_together     = [['ufr', 'code']]

    def __str__(self):
        return f'{self.code} — {self.name}'


class Niveau(models.TextChoices):
    """Niveaux d'études SPET."""
    L1    = 'L1',    'Licence 1'
    L2    = 'L2',    'Licence 2'
    L3_RT = 'L3-RT', 'L3 Réseaux & Télécom'
    L3_GL = 'L3-GL', 'L3 Génie Logiciel'
    M1    = 'M1',    'Master 1'
    M2    = 'M2',    'Master 2'


class Filiere(models.Model):
    """Filière d'enseignement (spécialité)."""
    department  = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='filieres')
    name        = models.CharField(max_length=200)
    code        = models.CharField(max_length=20)
    niveau      = models.CharField(max_length=10, choices=Niveau.choices, default=Niveau.L1)
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='managed_filieres',
        limit_choices_to={'role': 'RESP_FIL'},
    )
    description  = models.TextField(blank=True)
    is_active    = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Filière'
        verbose_name_plural = 'Filières'
        ordering            = ['name']
        unique_together     = [['department', 'code']]

    def __str__(self):
        return f'{self.code} — {self.name} ({self.get_niveau_display()})'


class AcademicYear(models.Model):
    """Année académique (ex: 2024-2025)."""
    label      = models.CharField(max_length=20, unique=True)  # ex: 2024-2025
    start_date = models.DateField()
    end_date   = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        verbose_name        = 'Année académique'
        verbose_name_plural = 'Années académiques'
        ordering            = ['-start_date']

    def __str__(self):
        return self.label

    def save(self, *args, **kwargs):
        # Un seul courant
        if self.is_current:
            AcademicYear.objects.exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)


class Semestre(models.TextChoices):
    S1  = 'S1',  'Semestre 1'
    S2  = 'S2',  'Semestre 2'
    S3  = 'S3',  'Semestre 3'
    S4  = 'S4',  'Semestre 4'
    S5  = 'S5',  'Semestre 5'
    S6  = 'S6',  'Semestre 6'
    S7  = 'S7',  'Semestre 7'
    S8  = 'S8',  'Semestre 8'
    S9  = 'S9',  'Semestre 9'
    S10 = 'S10', 'Semestre 10'


class SessionType(models.TextChoices):
    CM = 'CM', 'Cours Magistral'
    TD = 'TD', 'Travaux Dirigés'
    TP = 'TP', 'Travaux Pratiques'


class Course(models.Model):
    """
    Module / Matière enseigné dans une filière.
    Contient les volumes horaires CM, TD, TP.
    """
    filiere     = models.ForeignKey(Filiere, on_delete=models.CASCADE, related_name='courses')
    code        = models.CharField(max_length=20)
    name        = models.CharField(max_length=200)
    ue          = models.CharField(max_length=200, blank=True, default='')
    semestre    = models.CharField(max_length=3, choices=Semestre.choices, default=Semestre.S1)
    credits     = models.PositiveSmallIntegerField(default=3)
    coefficient = models.PositiveSmallIntegerField(default=1)

    # Volumes horaires (en heures)
    volume_cm   = models.PositiveSmallIntegerField(default=0)
    volume_td   = models.PositiveSmallIntegerField(default=0)
    volume_tp   = models.PositiveSmallIntegerField(default=0)

    # Enseignant référent (peut être surchargé par séance)
    teacher     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_courses',
        limit_choices_to={'role__in': ['ENSEIGNANT', 'CHEF_DEPT', 'RESP_FIL']},
    )

    description = models.TextField(blank=True)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Cours'
        verbose_name_plural = 'Cours'
        ordering            = ['filiere', 'code']
        unique_together     = [['filiere', 'code']]

    def __str__(self):
        return f'{self.code} — {self.name}'

    @property
    def total_hours(self):
        return self.volume_cm + self.volume_td + self.volume_tp


class StudentGroup(models.Model):
    """Groupe d'étudiants (TD, TP)."""
    filiere    = models.ForeignKey(Filiere, on_delete=models.CASCADE, related_name='groups')
    name       = models.CharField(max_length=100)  # ex: Groupe A, Groupe B
    label      = models.CharField(max_length=200, blank=True)  # ex: L3 INFO — Groupe A
    max_size   = models.PositiveSmallIntegerField(default=30)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Groupe étudiant'
        verbose_name_plural = 'Groupes étudiants'
        ordering            = ['filiere', 'name']
        unique_together     = [['filiere', 'name']]

    def __str__(self):
        return self.label or f'{self.filiere} — {self.name}'

    def save(self, *args, **kwargs):
        if not self.label:
            self.label = f'{self.filiere.name} — {self.name}'
        super().save(*args, **kwargs)
