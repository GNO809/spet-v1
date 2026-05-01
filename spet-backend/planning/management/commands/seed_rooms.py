from django.core.management.base import BaseCommand
from planning.models import Room


ROOMS_DATA = [
    # ── 20 Salles TD ──────────────────────────────────────────
    *[{
        'name':      f'Salle {i}',
        'capacity':  40,
        'room_type': 'TD',
        'status':    'available',
    } for i in range(1, 21)],

    # ── 3 Labos TP ────────────────────────────────────────────
    {
        'name':      'Labo Info 1',
        'capacity':  30,
        'room_type': 'TP',
        'status':    'available',
    },
    {
        'name':      'Labo Info 2',
        'capacity':  30,
        'room_type': 'TP',
        'status':    'available',
    },
    {
        'name':      'Labo Reseaux',
        'capacity':  24,
        'room_type': 'TP',
        'status':    'available',
    },

    # ── Amphitheatres ─────────────────────────────────────────
    {
        'name':      'Amphi A',
        'capacity':  300,
        'room_type': 'AMPHI',
        'status':    'available',
    },
    {
        'name':      'Amphi B',
        'capacity':  200,
        'room_type': 'AMPHI',
        'status':    'available',
    },
]


class Command(BaseCommand):
    help = 'Peuple la base de donnees avec les salles de la DIT.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Supprime toutes les salles existantes avant de recreer.',
        )

    def handle(self, *args, **options):
        if options['reset']:
            count = Room.objects.count()
            Room.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'{count} salle(s) supprimee(s).'))

        created = 0
        skipped = 0
        for r in ROOMS_DATA:
            obj, is_new = Room.objects.get_or_create(
                name=r['name'],
                defaults={
                    'capacity':  r['capacity'],
                    'room_type': r['room_type'],
                    'building':  '',
                    'floor':     0,
                    'equipment': r.get('equipment', []),
                    'status':    r.get('status', 'available'),
                },
            )
            if is_new:
                created += 1
            else:
                skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f'{created} salle(s) creee(s), {skipped} deja existante(s).'
        ))
