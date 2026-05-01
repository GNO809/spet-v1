from django.core.management.base import BaseCommand
from academics.models import Filiere, StudentGroup


GROUPES = [
    {'name': 'Groupe 1', 'max_size': 35},
    {'name': 'Groupe 2', 'max_size': 35},
]


class Command(BaseCommand):
    help = 'Crée Groupe 1 et Groupe 2 pour chaque filière active.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Supprime tous les groupes existants avant de recréer.',
        )

    def handle(self, *args, **options):
        if options['reset']:
            count = StudentGroup.objects.count()
            StudentGroup.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'{count} groupe(s) supprimé(s).'))

        filieres = Filiere.objects.filter(is_active=True)
        if not filieres.exists():
            self.stdout.write(self.style.ERROR('Aucune filière active trouvée.'))
            return

        created = 0
        skipped = 0
        for filiere in filieres:
            for g in GROUPES:
                label = f'{filiere.name} — {g["name"]}'
                obj, is_new = StudentGroup.objects.get_or_create(
                    filiere=filiere,
                    name=g['name'],
                    defaults={'label': label, 'max_size': g['max_size']},
                )
                if is_new:
                    created += 1
                    self.stdout.write(f'  + {label}')
                else:
                    skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f'{created} groupe(s) cree(s), {skipped} deja existant(s).'
        ))
