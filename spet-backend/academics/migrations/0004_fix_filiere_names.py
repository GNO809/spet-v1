from django.db import migrations

FILIERE_FIXES = {
    'L3-RT':   'Licence 3 Réseaux & Télécoms',
    'L3-GL':   'Licence 3 Génie Logiciel',
    'LI-L3RT': 'Licence Informatique L3 Réseaux & Télécoms',
    'LI-L3GL': 'Licence Informatique L3 Génie Logiciel',
}

# Corrections de casse sur les noms existants
FILIERE_NAME_FIXES = {
    'Master 1 informatique': 'Master 1 Informatique',
}

ROOM_FIXES = {
    'Labo Reseau': 'Labo Réseau',
}

DEPT_FIXES = {
    'Departement Informatique': 'Département Informatique',
}


def fix_names(apps, schema_editor):
    Filiere    = apps.get_model('academics', 'Filiere')
    Department = apps.get_model('academics', 'Department')

    for code, correct_name in FILIERE_FIXES.items():
        Filiere.objects.filter(code=code).exclude(name=correct_name).update(name=correct_name)

    for wrong_name, correct_name in FILIERE_NAME_FIXES.items():
        Filiere.objects.filter(name=wrong_name).update(name=correct_name)

    for wrong, correct in DEPT_FIXES.items():
        Department.objects.filter(name=wrong).update(name=correct)

    try:
        Room = apps.get_model('planning', 'Room')
        for wrong, correct in ROOM_FIXES.items():
            Room.objects.filter(name=wrong).update(name=correct)
    except LookupError:
        pass


def reverse_fix(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0003_semestre_s1_to_s10'),
    ]

    operations = [
        migrations.RunPython(fix_names, reverse_fix),
    ]
