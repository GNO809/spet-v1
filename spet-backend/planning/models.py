# ============================================================
# SPET — planning/models.py
# Salles, disponibilités, séances, emplois du temps
# ============================================================

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


# ─────────────────────────────────────────────────────────────
# BÂTIMENTS & NIVEAUX
# ─────────────────────────────────────────────────────────────

class Building(models.Model):
    """Bâtiment physique (géré par l'administrateur)."""
    name        = models.CharField(max_length=100, unique=True)
    code        = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Bâtiment'
        verbose_name_plural = 'Bâtiments'
        ordering            = ['name']

    def __str__(self):
        return f'{self.code} — {self.name}'


class BuildingLevel(models.Model):
    """Niveau / étage d'un bâtiment."""
    building   = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='levels')
    name       = models.CharField(max_length=100)  # ex: Rez-de-chaussée, 1er étage
    order      = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Niveau bâtiment'
        verbose_name_plural = 'Niveaux bâtiments'
        ordering            = ['building', 'order', 'name']
        unique_together     = [['building', 'name']]

    def __str__(self):
        return f'{self.building.name} — {self.name}'


# ─────────────────────────────────────────────────────────────
# SALLES
# ─────────────────────────────────────────────────────────────

class RoomType(models.TextChoices):
    AMPHI    = 'AMPHI',   'Amphithéâtre'
    SALLE_TD = 'TD',      'Salle TD'
    LABO_TP  = 'TP',      'Labo TP'
    REUNION  = 'REUNION', 'Salle de réunion'


class RoomStatus(models.TextChoices):
    AVAILABLE   = 'available',   'Disponible'
    MAINTENANCE = 'maintenance', 'En maintenance'
    OCCUPIED    = 'occupied',    'Occupée'


class Room(models.Model):
    """Salle physique (créée et gérée par l'administrateur)."""
    name      = models.CharField(max_length=100, unique=True)
    capacity  = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(2000)]
    )
    room_type = models.CharField(max_length=20, choices=RoomType.choices, default=RoomType.SALLE_TD)
    building  = models.CharField(max_length=100, blank=True)
    floor     = models.SmallIntegerField(default=0)
    equipment = models.JSONField(default=list, blank=True)  # ['Vidéoprojecteur', 'AC', …]
    status    = models.CharField(max_length=20, choices=RoomStatus.choices, default=RoomStatus.AVAILABLE)
    notes     = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Salle'
        verbose_name_plural = 'Salles'
        ordering            = ['building', 'name']

    def __str__(self):
        return f'{self.name} ({self.capacity} places)'


# ─────────────────────────────────────────────────────────────
# CRÉNEAUX
# ─────────────────────────────────────────────────────────────

class DayOfWeek(models.TextChoices):
    LUNDI    = 'Lundi',    'Lundi'
    MARDI    = 'Mardi',    'Mardi'
    MERCREDI = 'Mercredi', 'Mercredi'
    JEUDI    = 'Jeudi',    'Jeudi'
    VENDREDI = 'Vendredi', 'Vendredi'
    SAMEDI   = 'Samedi',   'Samedi'


class TimeSlot(models.Model):
    """Créneau horaire prédéfini."""
    label      = models.CharField(max_length=50)
    start_time = models.TimeField()
    end_time   = models.TimeField()
    order      = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name        = 'Créneau horaire'
        verbose_name_plural = 'Créneaux horaires'
        ordering            = ['order', 'start_time']

    def __str__(self):
        return f'{self.label} ({self.start_time}–{self.end_time})'


# ─────────────────────────────────────────────────────────────
# DISPONIBILITÉS
# ─────────────────────────────────────────────────────────────

class TeacherAvailability(models.Model):
    """
    Disponibilité d'un enseignant sur un créneau donné.
    Chaque enregistrement = un créneau dispo pour un enseignant.
    """
    teacher    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='availabilities',
        limit_choices_to={'role': 'ENSEIGNANT'},
    )
    day        = models.CharField(max_length=20, choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time   = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Disponibilité enseignant'
        verbose_name_plural = 'Disponibilités enseignants'
        ordering            = ['teacher', 'day', 'start_time']
        unique_together     = [['teacher', 'day', 'start_time', 'end_time']]

    def __str__(self):
        return f'{self.teacher} — {self.day} {self.start_time}–{self.end_time}'


class RoomAvailability(models.Model):
    """Créneau où une salle est disponible (géré par l'admin)."""
    room       = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='availabilities')
    day        = models.CharField(max_length=20, choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time   = models.TimeField()
    notes      = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Disponibilité salle'
        verbose_name_plural = 'Disponibilités salles'
        ordering            = ['room', 'day', 'start_time']
        unique_together     = [['room', 'day', 'start_time', 'end_time']]

    def __str__(self):
        return f'{self.room} — {self.day} {self.start_time}–{self.end_time}'


# ─────────────────────────────────────────────────────────────
# EMPLOIS DU TEMPS
# ─────────────────────────────────────────────────────────────

class TimetableStatus(models.TextChoices):
    BROUILLON             = 'BROUILLON',             'Brouillon'
    EN_ATTENTE            = 'EN_ATTENTE',             'En attente'
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',  'En attente de validation'
    VALIDE                = 'VALIDE',                 'Validé'
    PUBLIE                = 'PUBLIE',                 'Publié'
    REJETE                = 'REJETE',                 'Rejeté'
    ARCHIVE               = 'ARCHIVE',                'Archivé'


class Timetable(models.Model):
    """Emploi du temps d'une filière pour un semestre donné."""
    filiere      = models.ForeignKey(
        'academics.Filiere',
        on_delete=models.CASCADE,
        related_name='timetables',
    )
    academic_year = models.ForeignKey(
        'academics.AcademicYear',
        on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    semestre     = models.CharField(
        max_length=3,
        choices=[
            ('S1','Semestre 1'), ('S2','Semestre 2'),
            ('S3','Semestre 3'), ('S4','Semestre 4'),
            ('S5','Semestre 5'), ('S6','Semestre 6'),
            ('S7','Semestre 7'), ('S8','Semestre 8'),
            ('S9','Semestre 9'), ('S10','Semestre 10'),
        ],
        default='S1',
    )
    status       = models.CharField(max_length=30, choices=TimetableStatus.choices, default=TimetableStatus.BROUILLON)

    # Score de qualité (0-100)
    quality_score = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    # Traçabilité
    created_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_timetables',
    )
    validated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='validated_timetables',
    )
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='published_timetables',
    )
    rejection_reason = models.TextField(blank=True)
    notes            = models.TextField(blank=True)

    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name        = 'Emploi du temps'
        verbose_name_plural = 'Emplois du temps'
        ordering            = ['-created_at']
        unique_together     = [['filiere', 'semestre', 'academic_year']]

    def __str__(self):
        return f'EDT {self.filiere} — {self.semestre} {self.academic_year}'


# ─────────────────────────────────────────────────────────────
# SÉANCES
# ─────────────────────────────────────────────────────────────

class SessionType(models.TextChoices):
    CM = 'CM', 'Cours Magistral'
    TD = 'TD', 'Travaux Dirigés'
    TP = 'TP', 'Travaux Pratiques'


class Session(models.Model):
    """
    Séance planifiée dans un emploi du temps.
    Représente un cours à une heure/lieu/groupe/enseignant donnés.
    """
    timetable  = models.ForeignKey(Timetable, on_delete=models.CASCADE, related_name='sessions')
    course     = models.ForeignKey(
        'academics.Course',
        on_delete=models.CASCADE,
        related_name='sessions',
    )
    teacher    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='teaching_sessions',
        limit_choices_to={'role': 'ENSEIGNANT'},
    )
    room       = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='sessions')
    group      = models.ForeignKey(
        'academics.StudentGroup',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='sessions',
    )
    session_type = models.CharField(max_length=5, choices=SessionType.choices, default=SessionType.CM)
    day          = models.CharField(max_length=20, choices=DayOfWeek.choices)
    start_time   = models.TimeField()
    end_time     = models.TimeField()
    notes        = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Séance'
        verbose_name_plural = 'Séances'
        ordering            = ['timetable', 'day', 'start_time']

    def __str__(self):
        return f'{self.course} — {self.session_type} {self.day} {self.start_time}'

    @property
    def duration_minutes(self):
        """Durée de la séance en minutes."""
        start = self.start_time.hour * 60 + self.start_time.minute
        end   = self.end_time.hour   * 60 + self.end_time.minute
        return end - start


# ─────────────────────────────────────────────────────────────
# CONFLITS
# ─────────────────────────────────────────────────────────────

class ConflictType(models.TextChoices):
    TEACHER_OVERLAP = 'TEACHER_OVERLAP', 'Enseignant double réservation'
    ROOM_OVERLAP    = 'ROOM_OVERLAP',    'Salle double réservation'
    GROUP_OVERLAP   = 'GROUP_OVERLAP',   'Groupe double réservation'


class Conflict(models.Model):
    """Conflit détecté entre deux séances."""
    timetable    = models.ForeignKey(Timetable, on_delete=models.CASCADE, related_name='conflicts')
    session_a    = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='conflicts_a')
    session_b    = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='conflicts_b')
    conflict_type = models.CharField(max_length=30, choices=ConflictType.choices)
    description  = models.TextField(blank=True)
    resolved     = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Conflit'
        verbose_name_plural = 'Conflits'
        ordering            = ['-created_at']

    def __str__(self):
        return f'Conflit {self.conflict_type} — {self.timetable}'
