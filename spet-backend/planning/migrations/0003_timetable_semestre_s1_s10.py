from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('planning', '0002_add_building_and_level_models'),
    ]

    operations = [
        migrations.AlterField(
            model_name='timetable',
            name='semestre',
            field=models.CharField(
                max_length=3,
                choices=[
                    ('S1',  'Semestre 1'),
                    ('S2',  'Semestre 2'),
                    ('S3',  'Semestre 3'),
                    ('S4',  'Semestre 4'),
                    ('S5',  'Semestre 5'),
                    ('S6',  'Semestre 6'),
                    ('S7',  'Semestre 7'),
                    ('S8',  'Semestre 8'),
                    ('S9',  'Semestre 9'),
                    ('S10', 'Semestre 10'),
                ],
                default='S1',
            ),
        ),
    ]
