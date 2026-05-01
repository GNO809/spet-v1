import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('academics', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='department',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='members',
                to='academics.department',
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='filiere',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='responsable_set',
                to='academics.filiere',
            ),
        ),
    ]
