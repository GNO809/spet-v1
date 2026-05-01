# ============================================================
# SPET — planning/services.py
# Services métier pour la planification
# ============================================================

from django.utils import timezone
from .models import (
    Timetable, Session, Conflict,
    TimetableStatus, ConflictType,
)
from notifications.services import create_notification


# ── Calcul du score de qualité ────────────────────────────────
def compute_quality_score(timetable: Timetable) -> int:
    """
    Calcule un score de qualité (0-100) basé sur :
    - Nombre de conflits non résolus
    - Complétude des séances vs volume horaire prévu
    - Présence de salles assignées
    """
    sessions = timetable.sessions.all()
    if not sessions.exists():
        return 0

    score = 100

    # Pénalité pour conflits non résolus (-10 par conflit, max -40)
    conflicts_count = timetable.conflicts.filter(resolved=False).count()
    score -= min(conflicts_count * 10, 40)

    # Pénalité si séances sans salle (-5 par séance sans salle, max -20)
    without_room = sessions.filter(room__isnull=True).count()
    score -= min(without_room * 5, 20)

    # Pénalité si séances sans enseignant (-5 par séance sans prof, max -20)
    without_teacher = sessions.filter(teacher__isnull=True).count()
    score -= min(without_teacher * 5, 20)

    return max(0, score)


# ── Détection de conflits ─────────────────────────────────────
def detect_conflicts(timetable: Timetable):
    """
    Détecte et sauvegarde les conflits dans un emploi du temps.
    Vérifie : chevauchement enseignant, salle et groupe.
    """
    sessions = list(timetable.sessions.select_related('teacher', 'room', 'group').all())
    # Réinitialiser les anciens conflits non résolus
    timetable.conflicts.filter(resolved=False).delete()

    conflicts_found = []

    for i, s1 in enumerate(sessions):
        for s2 in sessions[i + 1:]:
            if s1.day != s2.day:
                continue

            # Vérifier chevauchement temporel
            overlap = (
                s1.start_time < s2.end_time and
                s2.start_time < s1.end_time
            )
            if not overlap:
                continue

            # Conflit enseignant
            if s1.teacher and s2.teacher and s1.teacher == s2.teacher:
                conflicts_found.append(Conflict(
                    timetable=timetable,
                    session_a=s1, session_b=s2,
                    conflict_type=ConflictType.TEACHER_OVERLAP,
                    description=f'{s1.teacher} est assigné aux deux séances.',
                ))

            # Conflit salle
            if s1.room and s2.room and s1.room == s2.room:
                conflicts_found.append(Conflict(
                    timetable=timetable,
                    session_a=s1, session_b=s2,
                    conflict_type=ConflictType.ROOM_OVERLAP,
                    description=f'La salle {s1.room} est réservée deux fois.',
                ))

            # Conflit groupe
            if s1.group and s2.group and s1.group == s2.group:
                conflicts_found.append(Conflict(
                    timetable=timetable,
                    session_a=s1, session_b=s2,
                    conflict_type=ConflictType.GROUP_OVERLAP,
                    description=f'Le groupe {s1.group} a deux séances simultanées.',
                ))

    if conflicts_found:
        Conflict.objects.bulk_create(conflicts_found)

    return conflicts_found


# ── Workflow de statut ────────────────────────────────────────
def submit_timetable(timetable: Timetable, user) -> Timetable:
    """Soumettre un EDT pour validation (BROUILLON → EN_ATTENTE_VALIDATION)."""
    if timetable.status not in [TimetableStatus.BROUILLON, TimetableStatus.REJETE]:
        raise ValueError('Seul un brouillon ou un EDT rejeté peut être soumis.')

    # Détecter les conflits avant soumission
    detect_conflicts(timetable)

    timetable.status       = TimetableStatus.EN_ATTENTE_VALIDATION
    timetable.quality_score = compute_quality_score(timetable)
    timetable.save()

    # Notifier le chef de département
    _notify_supervisors(
        timetable=timetable,
        title='Nouvel EDT soumis pour validation',
        message=f'L\'EDT de {timetable.filiere} ({timetable.semestre}) a été soumis par {user.full_name}.',
        notif_type='INFO',
    )
    return timetable


def validate_timetable(timetable: Timetable, user, notes: str = '') -> Timetable:
    """Valider un EDT (EN_ATTENTE / EN_ATTENTE_VALIDATION → VALIDE)."""
    if timetable.status not in (TimetableStatus.EN_ATTENTE, TimetableStatus.EN_ATTENTE_VALIDATION):
        raise ValueError('Seul un EDT en attente peut être validé.')

    timetable.status       = TimetableStatus.VALIDE
    timetable.validated_by = user
    timetable.notes        = notes
    timetable.save()

    # Notifier le responsable
    if timetable.filiere.responsable:
        create_notification(
            user=timetable.filiere.responsable,
            notif_type='SUCCESS',
            title='EDT validé',
            message=f'L\'EDT de {timetable.filiere} ({timetable.semestre}) a été validé.',
        )
    return timetable


def reject_timetable(timetable: Timetable, user, reason: str = '') -> Timetable:
    """Rejeter un EDT (EN_ATTENTE / EN_ATTENTE_VALIDATION → REJETE)."""
    if timetable.status not in (TimetableStatus.EN_ATTENTE, TimetableStatus.EN_ATTENTE_VALIDATION):
        raise ValueError('Seul un EDT en attente peut être rejeté.')

    timetable.status           = TimetableStatus.REJETE
    timetable.validated_by     = user
    timetable.rejection_reason = reason
    timetable.save()

    if timetable.filiere.responsable:
        create_notification(
            user=timetable.filiere.responsable,
            notif_type='ERROR',
            title='EDT rejeté',
            message=f'L\'EDT de {timetable.filiere} a été rejeté. Raison : {reason}',
        )
    return timetable


def publish_timetable(timetable: Timetable, user) -> Timetable:
    """Publier un EDT (VALIDE → PUBLIE)."""
    if timetable.status != TimetableStatus.VALIDE:
        raise ValueError('Seul un EDT validé peut être publié.')

    timetable.status       = TimetableStatus.PUBLIE
    timetable.published_by = user
    timetable.published_at = timezone.now()
    timetable.save()

    # Notifier tous les enseignants de la filière
    teachers = timetable.sessions.values_list('teacher', flat=True).distinct()
    from django.contrib.auth import get_user_model
    User = get_user_model()
    for teacher in User.objects.filter(id__in=teachers):
        create_notification(
            user=teacher,
            notif_type='SUCCESS',
            title='Emploi du temps publié',
            message=f'L\'EDT de {timetable.filiere} ({timetable.semestre}) est maintenant disponible.',
        )
    return timetable


def archive_timetable(timetable: Timetable) -> Timetable:
    """Archiver un EDT publié."""
    timetable.status = TimetableStatus.ARCHIVE
    timetable.save()
    return timetable


# ── Helpers internes ─────────────────────────────────────────
def _notify_supervisors(timetable, title, message, notif_type='INFO'):
    """Notifier les chefs de département sur un événement EDT."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    supervisors = User.objects.filter(
        role__in=['CHEF_DEPT', 'ADMIN'],
        is_active=True,
    )
    for supervisor in supervisors:
        create_notification(user=supervisor, notif_type=notif_type, title=title, message=message)
