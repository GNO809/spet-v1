from django.core.management.base import BaseCommand
from planning.models import Timetable


class Command(BaseCommand):
    help = 'Supprime tous les emplois du temps, séances et conflits.'

    def handle(self, *args, **options):
        count = Timetable.objects.count()
        Timetable.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(
            f'{count} emploi(s) du temps supprimé(s) (séances et conflits inclus).'
        ))
