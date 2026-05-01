# ============================================================
# SPET — planning/views.py
# ============================================================

from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import (
    IsAdmin, IsAdminOrChefOrResp, IsAdminOrChefDept,
    IsAdminOrRespFil, IsOwnerOrAdmin,
)
from .models import (
    Building, BuildingLevel,
    Room, TimeSlot, TeacherAvailability, RoomAvailability,
    Timetable, Session, Conflict,
)
from .serializers import (
    BuildingSerializer, BuildingLevelSerializer,
    RoomSerializer, TimeSlotSerializer,
    TeacherAvailabilitySerializer, TeacherAvailabilityBulkSerializer,
    RoomAvailabilitySerializer,
    TimetableSerializer, TimetableDetailSerializer,
    SessionSerializer, ConflictSerializer,
    TimetableStatusUpdateSerializer,
)
from .services import (
    submit_timetable, validate_timetable,
    reject_timetable, publish_timetable, archive_timetable,
    detect_conflicts, compute_quality_score,
)
from notifications.services import create_notification
from audit.services import log

User = get_user_model()


# ── Bâtiments & Niveaux ──────────────────────────────────────
class BuildingViewSet(viewsets.ModelViewSet):
    """CRUD Bâtiments — admin uniquement."""
    queryset         = Building.objects.prefetch_related('levels').all()
    serializer_class = BuildingSerializer
    filter_backends  = [filters.SearchFilter]
    search_fields    = ['name', 'code']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        obj = serializer.save()
        log(action='CREATE', module='ROOMS', severity='SUCCESS',
            detail=f'Bâtiment créé — {obj.name}', target=f'Bâtiment #{obj.pk}', request=self.request)

    def perform_update(self, serializer):
        obj = serializer.save()
        log(action='UPDATE', module='ROOMS', severity='INFO',
            detail=f'Bâtiment modifié — {obj.name}', target=f'Bâtiment #{obj.pk}', request=self.request)

    def perform_destroy(self, instance):
        log(action='DELETE', module='ROOMS', severity='WARNING',
            detail=f'Bâtiment supprimé — {instance.name}', target=f'Bâtiment #{instance.pk}', request=self.request)
        instance.delete()


class BuildingLevelViewSet(viewsets.ModelViewSet):
    """CRUD Niveaux de bâtiment — admin uniquement."""
    queryset         = BuildingLevel.objects.select_related('building').all()
    serializer_class = BuildingLevelSerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_fields = ['building']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        obj = serializer.save()
        log(action='CREATE', module='ROOMS', severity='INFO',
            detail=f'Niveau créé — {obj}', target=f'Niveau #{obj.pk}', request=self.request)

    def perform_destroy(self, instance):
        log(action='DELETE', module='ROOMS', severity='WARNING',
            detail=f'Niveau supprimé — {instance}', target=f'Niveau #{instance.pk}', request=self.request)
        instance.delete()


# ── Salles ───────────────────────────────────────────────────
class RoomViewSet(viewsets.ModelViewSet):
    """
    GET    /planning/rooms/          — Liste des salles
    POST   /planning/rooms/          — Créer une salle (admin)
    GET    /planning/rooms/{id}/     — Détail
    PATCH  /planning/rooms/{id}/     — Modifier
    DELETE /planning/rooms/{id}/     — Supprimer
    GET    /planning/rooms/available/ — Salles disponibles uniquement
    """
    queryset = Room.objects.prefetch_related('availabilities').all()
    serializer_class = RoomSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['room_type', 'status', 'building']
    search_fields    = ['name', 'building']
    ordering_fields  = ['name', 'capacity']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'], url_path='available')
    def available(self, request):
        """Retourne uniquement les salles disponibles."""
        rooms = self.get_queryset().filter(status='available')
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        room = serializer.save()
        log(action='CREATE', module='ROOMS', severity='SUCCESS',
            detail=f'Salle créée — {room.name} ({room.capacity} places, {room.room_type})',
            target=f'Salle #{room.pk}', request=self.request)
        # Notifier les responsables de filière
        resp_fils = User.objects.filter(role='RESP_FIL', is_active=True)
        for user in resp_fils:
            create_notification(
                user=user,
                notif_type='INFO',
                title='Nouvelle salle disponible',
                message=f'La salle {room.name} ({room.capacity} places) a été ajoutée.',
            )

    def perform_update(self, serializer):
        room = serializer.save()
        log(action='UPDATE', module='ROOMS', severity='INFO',
            detail=f'Salle modifiée — {room.name}', target=f'Salle #{room.pk}', request=self.request)

    def perform_destroy(self, instance):
        log(action='DELETE', module='ROOMS', severity='WARNING',
            detail=f'Salle supprimée — {instance.name}', target=f'Salle #{instance.pk}', request=self.request)
        instance.delete()


# ── Créneaux horaires ─────────────────────────────────────────
class TimeSlotViewSet(viewsets.ModelViewSet):
    queryset         = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticated()]


# ── Disponibilités enseignants ────────────────────────────────
class TeacherAvailabilityViewSet(viewsets.ModelViewSet):
    """
    GET  /planning/availabilities/          — Liste (filtrable par teacher)
    POST /planning/availabilities/          — Créer un créneau dispo
    POST /planning/availabilities/bulk/     — Mise à jour groupée
    GET  /planning/availabilities/my/       — Mes disponibilités
    """
    serializer_class = TeacherAvailabilitySerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_fields = ['teacher', 'day']

    def get_queryset(self):
        user = self.request.user
        qs   = TeacherAvailability.objects.select_related('teacher').all()
        if user.role == 'ENSEIGNANT':
            qs = qs.filter(teacher=user)
        return qs

    def get_permissions(self):
        if self.action in ('destroy',):
            return [IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        # Un enseignant ne peut créer que ses propres disponibilités
        if user.role == 'ENSEIGNANT':
            serializer.save(teacher=user)
        else:
            serializer.save()

    @action(detail=False, methods=['get'], url_path='my')
    def my_availability(self, request):
        """Disponibilités de l'utilisateur connecté."""
        slots = TeacherAvailability.objects.filter(teacher=request.user).order_by('day', 'start_time')
        serializer = TeacherAvailabilitySerializer(slots, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk_update(self, request):
        """
        Remplace toutes les disponibilités de l'enseignant connecté
        par la liste fournie.
        """
        user = request.user
        if user.role not in ('ENSEIGNANT',):
            return Response({'detail': 'Réservé aux enseignants.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TeacherAvailabilityBulkSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Supprimer les anciennes disponibilités
        TeacherAvailability.objects.filter(teacher=user).delete()

        # Créer les nouvelles
        slots_data = serializer.validated_data['slots']
        new_slots  = []
        for slot in slots_data:
            new_slots.append(TeacherAvailability(
                teacher    = user,
                day        = slot['day'],
                start_time = slot['start_time'],
                end_time   = slot['end_time'],
            ))
        TeacherAvailability.objects.bulk_create(new_slots)

        # Notifier le responsable
        resp_fils = User.objects.filter(role='RESP_FIL', is_active=True)
        for resp in resp_fils:
            if not resp.filiere or not user.department:
                continue
            if resp.filiere.department == user.department:
                create_notification(
                    user=resp,
                    notif_type='INFO',
                    title='Disponibilités mises à jour',
                    message=f'{user.full_name} a mis à jour ses disponibilités.',
                )

        log(action='UPDATE', module='TIMETABLE', severity='INFO',
            detail=f'Disponibilités mises à jour — {user.get_full_name()} ({len(new_slots)} créneaux)',
            target=f'User #{str(user.pk)[:8]}', request=request)

        result = TeacherAvailabilitySerializer(
            TeacherAvailability.objects.filter(teacher=user),
            many=True,
        )
        return Response(result.data, status=status.HTTP_201_CREATED)


# ── Disponibilités salles ─────────────────────────────────────
class RoomAvailabilityViewSet(viewsets.ModelViewSet):
    queryset         = RoomAvailability.objects.select_related('room').all()
    serializer_class = RoomAvailabilitySerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_fields = ['room', 'day']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAuthenticated()]


# ── Emplois du temps ──────────────────────────────────────────
class TimetableViewSet(viewsets.ModelViewSet):
    """
    Gestion complète des emplois du temps avec workflow de statut.
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['filiere', 'semestre', 'status', 'academic_year']
    search_fields    = ['filiere__name']
    ordering_fields  = ['created_at', 'quality_score']

    def get_queryset(self):
        user = self.request.user
        qs   = Timetable.objects.select_related(
            'filiere', 'academic_year', 'created_by', 'validated_by'
        ).prefetch_related('sessions', 'conflicts')

        if user.role == 'ENSEIGNANT':
            qs = qs.filter(
                status='PUBLIE',
                sessions__teacher=user,
            ).distinct()
        elif user.role == 'RESP_FIL':
            if user.filiere:
                qs = qs.filter(filiere=user.filiere)
        # CHEF_DEPT et ADMIN voient tous les EDT
        return qs.all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TimetableDetailSerializer
        return TimetableSerializer

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdminOrChefDept()]
        if self.action in ('create', 'update', 'partial_update'):
            return [IsAdminOrRespFil()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        obj = serializer.save(created_by=self.request.user)
        log(action='CREATE', module='TIMETABLE', severity='INFO',
            detail=f'EDT créé — {obj.filiere} S{obj.semestre}',
            target=f'EDT #{obj.pk}', request=self.request)

    def perform_destroy(self, instance):
        log(action='DELETE', module='TIMETABLE', severity='WARNING',
            detail=f'EDT supprimé — {instance.filiere} S{instance.semestre}',
            target=f'EDT #{instance.pk}', request=self.request)
        instance.delete()

    # ── Actions workflow ─────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='action')
    def workflow_action(self, request, pk=None):
        """
        POST /planning/timetables/{id}/action/
        body: { "action": "submit|validate|reject|publish|archive", "rejection_reason": "…" }
        """
        timetable  = self.get_object()
        serializer = TimetableStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        act    = serializer.validated_data['action']
        reason = serializer.validated_data.get('rejection_reason', '')
        notes  = serializer.validated_data.get('notes', '')
        user   = request.user

        try:
            if act == 'submit':
                if user.role not in ('RESP_FIL', 'ADMIN'):
                    return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
                timetable = submit_timetable(timetable, user)
                log(action='VALIDATE', module='TIMETABLE', severity='INFO',
                    detail=f'EDT soumis — {timetable.filiere} S{timetable.semestre}',
                    target=f'EDT #{timetable.pk}', request=request)

            elif act == 'validate':
                if user.role not in ('CHEF_DEPT', 'ADMIN'):
                    return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
                timetable = validate_timetable(timetable, user, notes)
                log(action='VALIDATE', module='TIMETABLE', severity='SUCCESS',
                    detail=f'EDT validé — {timetable.filiere} S{timetable.semestre}',
                    target=f'EDT #{timetable.pk}', request=request)

            elif act == 'reject':
                if user.role not in ('CHEF_DEPT', 'ADMIN'):
                    return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
                timetable = reject_timetable(timetable, user, reason)
                log(action='REJECT', module='TIMETABLE', severity='WARNING',
                    detail=f'EDT rejeté — {timetable.filiere} S{timetable.semestre}. Raison : {reason}',
                    target=f'EDT #{timetable.pk}', request=request)

            elif act == 'publish':
                if user.role not in ('RESP_FIL', 'ADMIN'):
                    return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
                timetable = publish_timetable(timetable, user)
                log(action='PUBLISH', module='TIMETABLE', severity='SUCCESS',
                    detail=f'EDT publié — {timetable.filiere} S{timetable.semestre}',
                    target=f'EDT #{timetable.pk}', request=request)

            elif act == 'archive':
                if user.role not in ('ADMIN', 'CHEF_DEPT'):
                    return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
                timetable = archive_timetable(timetable)
                log(action='EXPORT', module='TIMETABLE', severity='INFO',
                    detail=f'EDT archivé — {timetable.filiere} S{timetable.semestre}',
                    target=f'EDT #{timetable.pk}', request=request)

        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(TimetableSerializer(timetable).data)

    @action(detail=True, methods=['post'], url_path='detect-conflicts')
    def run_conflict_detection(self, request, pk=None):
        """Lancer la détection de conflits sur l'EDT."""
        timetable  = self.get_object()
        conflicts  = detect_conflicts(timetable)
        score      = compute_quality_score(timetable)
        timetable.quality_score = score
        timetable.save()
        return Response({
            'conflicts_found': len(conflicts),
            'quality_score':   score,
        })

    @action(detail=True, methods=['post'], url_path='generate')
    def generate_sessions(self, request, pk=None):
        """
        POST /planning/timetables/{id}/generate/
        Génère 1 séance hebdomadaire par cours/type/groupe.
        Créneaux alignés sur la grille frontend : 08-10, 10-12, 15-17, 17-19.
        Répartition équilibrée via heuristique least-loaded-day.
        """
        from datetime import time as dtime
        from collections import defaultdict
        from academics.models import Course, StudentGroup
        from .models import DayOfWeek, SessionType

        timetable = self.get_object()

        if timetable.status not in ('BROUILLON', 'REJETE'):
            return Response(
                {'detail': 'Seul un brouillon peut être (re)généré automatiquement.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 1. Nettoyage ─────────────────────────────────────
        timetable.sessions.all().delete()

        # ── 2. Cours du semestre de l'EDT uniquement ─────────
        courses = list(
            Course.objects.filter(
                filiere=timetable.filiere,
                semestre=timetable.semestre,
                is_active=True,
            ).select_related('teacher')
        )
        if not courses:
            return Response(
                {'detail': f'Aucun cours actif pour ce semestre ({timetable.semestre}) dans cette filière. Vérifiez la maquette pédagogique.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 3. Salles disponibles ────────────────────────────
        all_rooms = list(Room.objects.filter(status='available').order_by('capacity'))
        if not all_rooms:
            return Response(
                {'detail': 'Aucune salle disponible.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 4. Groupes de la filière ─────────────────────────
        filiere_groups = list(StudentGroup.objects.filter(filiere=timetable.filiere))

        # ── 5. Créneaux — alignés sur la grille frontend ─────
        DAYS = [
            DayOfWeek.LUNDI, DayOfWeek.MARDI, DayOfWeek.MERCREDI,
            DayOfWeek.JEUDI, DayOfWeek.VENDREDI,
        ]
        # 5 créneaux alignés sur la grille frontend (incluant le soir)
        ALL_SLOTS = [
            (dtime(8,  0), dtime(10, 0)),
            (dtime(10, 0), dtime(12, 0)),
            (dtime(15, 0), dtime(17, 0)),
            (dtime(17, 0), dtime(19, 0)),
            (dtime(19, 0), dtime(21, 0)),
        ]
        LUNCH_START = dtime(12, 0)
        LUNCH_END   = dtime(15, 0)

        def overlaps_lunch(s, e):
            return s < LUNCH_END and e > LUNCH_START

        # ── 6. Disponibilités enseignants (filière uniquement) ───
        teacher_ids = {c.teacher_id for c in courses if c.teacher_id}
        teacher_avail: dict = defaultdict(set)
        for av in TeacherAvailability.objects.filter(teacher_id__in=teacher_ids):
            teacher_avail[av.teacher_id].add((av.day, av.start_time, av.end_time))

        def teacher_free(tid, day, start, end):
            slots = teacher_avail.get(tid)
            if not slots:
                return True
            for (d, ws, we) in slots:
                if d == day and ws <= start and we >= end:
                    return True
            return False

        # ── 7. Disponibilités salles ─────────────────────────
        room_avail: dict = defaultdict(set)
        for av in RoomAvailability.objects.all():
            room_avail[av.room_id].add((av.day, av.start_time, av.end_time))

        def room_free(rid, day, start, end):
            slots = room_avail.get(rid)
            if not slots:
                return True
            for (d, ws, we) in slots:
                if d == day and ws <= start and we >= end:
                    return True
            return False

        # ── 8. Occupation globale — TOUS les autres EDT actifs ──
        # Inclut brouillons d'autres filières pour éviter les conflits
        # entre responsables qui génèrent en parallèle.
        global_rooms:    dict = defaultdict(set)
        global_teachers: dict = defaultdict(set)
        global_groups:   dict = defaultdict(set)

        for sess in (
            Session.objects
            .exclude(timetable=timetable)
            .exclude(timetable__filiere=timetable.filiere)  # même filière → pas de conflit inter-semestre
            .filter(timetable__status__in=['BROUILLON', 'EN_ATTENTE_VALIDATION', 'VALIDE', 'PUBLIE'])
            .values('day', 'start_time', 'end_time', 'room_id', 'teacher_id', 'group_id')
        ):
            k = (sess['day'], sess['start_time'], sess['end_time'])
            if sess['room_id']:    global_rooms[k].add(sess['room_id'])
            if sess['teacher_id']: global_teachers[k].add(sess['teacher_id'])
            if sess['group_id']:   global_groups[k].add(sess['group_id'])

        # Occupation locale en cours de construction
        local_rooms:    dict = defaultdict(set)
        local_teachers: dict = defaultdict(set)
        local_groups:   dict = defaultdict(set)

        # Charge par (jour, créneau) — clé de l'équilibrage
        slot_load: dict = defaultdict(int)

        # Indices stables pour le tri déterministe
        DAY_INDEX  = {d: i for i, d in enumerate(DAYS)}
        SLOT_INDEX = {s: i for i, (s, _e) in enumerate(ALL_SLOTS)}

        def is_slot_free(day, start, end, room, teacher_id, group_id):
            if overlaps_lunch(start, end):
                return False
            k = (day, start, end)
            if teacher_id:
                if not teacher_free(teacher_id, day, start, end):
                    return False
                if teacher_id in global_teachers[k] or teacher_id in local_teachers[k]:
                    return False
            if room:
                if not room_free(room.id, day, start, end):
                    return False
                if room.id in global_rooms[k] or room.id in local_rooms[k]:
                    return False
            if group_id:
                if group_id in global_groups[k] or group_id in local_groups[k]:
                    return False
            return True

        def mark_slot(day, start, end, room, teacher_id, group_id):
            k = (day, start, end)
            if teacher_id: local_teachers[k].add(teacher_id)
            if room:       local_rooms[k].add(room.id)
            if group_id:   local_groups[k].add(group_id)
            slot_load[(day, start)] += 1

        def find_slot(teacher_id, room_candidates, group_id=None):
            """
            Trie toutes les combinaisons (jour × créneau) par :
              1. slot_load[(jour, créneau)] — préfère les cases les moins remplies
              2. SLOT_INDEX  — à charge égale, alterne entre créneaux (matin/après-midi)
              3. DAY_INDEX   — à créneau égal, répartit sur les jours
            Garantit que chaque créneau (08h, 10h, 15h, 17h) est utilisé
            équitablement sur tous les jours avant de revenir au même endroit.
            """
            options = sorted(
                [(day, start, end) for day in DAYS for start, end in ALL_SLOTS],
                key=lambda x: (slot_load[(x[0], x[1])], SLOT_INDEX[x[1]], DAY_INDEX[x[0]])
            )
            for day, start, end in options:
                for room in room_candidates:
                    if is_slot_free(day, start, end, room, teacher_id, group_id):
                        return day, start, end, room
            return None

        def rooms_for_type(pref_type):
            preferred = [r for r in all_rooms if r.room_type == pref_type]
            others    = [r for r in all_rooms if r.room_type != pref_type]
            return preferred + others

        # ── 9. Construction : 1 séance/semaine par cours/type/groupe ─
        # L'enseignant utilisé est uniquement celui affecté au cours
        # via la page d'affectation (course.teacher), en respectant
        # ses disponibilités déclarées (TeacherAvailability).
        sessions_to_create = []
        unplaced = 0

        # CM en priorité (plus difficiles à caser en amphi)
        courses_sorted = sorted(courses, key=lambda c: (0 if c.volume_cm > 0 else 1))

        for course in courses_sorted:
            # Enseignant affecté au cours (peut être None si pas encore affecté)
            tid = course.teacher_id if course.teacher else None

            needed = []  # list of (session_type, room_candidates, group_obj_or_None)

            if course.volume_cm > 0:
                needed.append((SessionType.CM, rooms_for_type('AMPHI'), None))

            if course.volume_td > 0:
                for grp in (filiere_groups if filiere_groups else [None]):
                    needed.append((SessionType.TD, rooms_for_type('TD'), grp))

            if course.volume_tp > 0:
                for grp in (filiere_groups if filiere_groups else [None]):
                    needed.append((SessionType.TP, rooms_for_type('TP'), grp))

            for stype, room_candidates, grp in needed:
                gid    = grp.id if grp else None
                result = find_slot(tid, room_candidates, gid)
                if result is None:
                    unplaced += 1
                    continue
                day, start, end, room = result
                mark_slot(day, start, end, room, tid, gid)
                sessions_to_create.append(Session(
                    timetable=timetable,
                    course=course,
                    teacher=course.teacher,   # l'enseignant du cours, ou None
                    room=room,
                    group=grp,
                    session_type=stype,
                    day=day,
                    start_time=start,
                    end_time=end,
                ))

        Session.objects.bulk_create(sessions_to_create)

        # ── 10. Score qualité & conflits ─────────────────────
        conflicts = detect_conflicts(timetable)
        score     = compute_quality_score(timetable)
        timetable.quality_score = score
        timetable.save(update_fields=['quality_score'])

        log(action='CREATE', module='TIMETABLE', severity='SUCCESS',
            detail=(
                f'Génération contrainte — {len(sessions_to_create)} séances, '
                f'{unplaced} non placées, {len(conflicts)} conflits, score={score} — '
                f'{timetable.filiere} S{timetable.semestre}'
            ),
            target=f'EDT #{timetable.pk}', request=request)

        return Response({
            'sessions_created': len(sessions_to_create),
            'sessions_unplaced': unplaced,
            'conflicts':        len(conflicts),
            'quality_score':    score,
            'detail': (
                f'{len(sessions_to_create)} séances générées'
                + (f', {unplaced} non placées (contraintes trop restrictives)' if unplaced else '')
                + f'. Score qualité : {score}/100.'
            ),
        })


# ── Séances ───────────────────────────────────────────────────
class SessionViewSet(viewsets.ModelViewSet):
    """Séances d'un emploi du temps."""
    serializer_class = SessionSerializer
    filter_backends  = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['timetable', 'teacher', 'room', 'session_type', 'day', 'course']
    ordering_fields  = ['day', 'start_time']

    def get_queryset(self):
        user = self.request.user
        qs   = Session.objects.select_related(
            'timetable', 'course', 'teacher', 'room', 'group'
        ).all()
        if user.role == 'ADMIN':
            return qs
        # For all other roles, when no specific timetable is requested (MyTimetable view),
        # show only the sessions where this user is the assigned teacher.
        if 'timetable' not in self.request.query_params:
            return qs.filter(teacher=user, timetable__status='PUBLIE')
        return qs

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrRespFil()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        obj = serializer.save()
        log(action='CREATE', module='TIMETABLE', severity='INFO',
            detail=f'Séance créée — {obj.course} ({obj.session_type}) {obj.day} {obj.start_time}',
            target=f'Séance #{obj.pk}', request=self.request)

    def perform_update(self, serializer):
        obj = serializer.save()
        log(action='UPDATE', module='TIMETABLE', severity='INFO',
            detail=f'Séance modifiée — {obj.course} ({obj.session_type}) {obj.day} {obj.start_time}',
            target=f'Séance #{obj.pk}', request=self.request)

    def perform_destroy(self, instance):
        log(action='DELETE', module='TIMETABLE', severity='WARNING',
            detail=f'Séance supprimée — {instance.course} ({instance.session_type}) {instance.day} {instance.start_time}',
            target=f'Séance #{instance.pk}', request=self.request)
        instance.delete()


# ── Conflits ─────────────────────────────────────────────────
class ConflictViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ConflictSerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_fields = ['timetable', 'conflict_type', 'resolved']

    def get_queryset(self):
        return Conflict.objects.select_related(
            'timetable', 'session_a', 'session_b'
        ).all()

    @action(detail=True, methods=['patch'], url_path='resolve')
    def resolve(self, request, pk=None):
        """Marquer un conflit comme résolu."""
        conflict          = self.get_object()
        conflict.resolved = True
        conflict.save()
        return Response({'detail': 'Conflit résolu.'})
