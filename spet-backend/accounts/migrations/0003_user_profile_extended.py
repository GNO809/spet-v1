from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_department_filiere'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='specialite',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='user',
            name='bio',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='user',
            name='cv',
            field=models.FileField(blank=True, null=True, upload_to='cvs/'),
        ),
        migrations.AddField(
            model_name='user',
            name='niveaux_souhaites',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="Niveaux où l'enseignant souhaite enseigner (ex: ['L1','L2','M1'])",
            ),
        ),
    ]
