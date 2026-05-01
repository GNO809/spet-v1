# ============================================================
# SPET — Commande : seed_responsables
# Cree les filieres et comptes Responsable de Filiere
# conformement aux affectations reelles :
#
#   Francois Kasseme Gomis  : L1 + L2
#   Moussa Dethie Sarr      : L3-GL + L3-RT
#   El Hadj Modou MBOUP     : M1 + M2
#
# Usage :
#   python manage.py seed_responsables
#   python manage.py seed_responsables --reset   (reinitialise les mdp)
# ============================================================

from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model

User = get_user_model()

UFR_DATA  = {'name': 'UFR Sciences, Environnement et Technologie', 'code': 'UFR-SET'}
DEPT_DATA = {'name': 'Département Informatique', 'code': 'INFO'}

# Chaque entree = un responsable + la liste des filieres qu'il gere
RESPONSABLES = [
    {
        'username':   'gomis_francois',
        'email':      'f.k.gomis@ufr-set.sn',
        'first_name': 'Francois Kasseme',
        'last_name':  'Gomis',
        'password':   'Spet@FKGomis_2025',
        'filieres': [
            {
                'code':        'LI-L1',
                'name':        'Licence Informatique L1',
                'niveau':      'L1',
                'description': 'Tronc commun Licence 1',
            },
            {
                'code':        'LI-L2',
                'name':        'Licence Informatique L2',
                'niveau':      'L2',
                'description': 'Tronc commun Licence 2',
            },
        ],
    },
    {
        'username':   'sarr_moussa',
        'email':      'm.d.sarr@ufr-set.sn',
        'first_name': 'Moussa Dethie',
        'last_name':  'Sarr',
        'password':   'Spet@MDSarr_2025',
        'filieres': [
            {
                'code':        'LI-L3GL',
                'name':        'Licence Informatique L3 Génie Logiciel',
                'niveau':      'L3-GL',
                'description': 'Licence 3 spécialité Génie Logiciel',
            },
            {
                'code':        'LI-L3RT',
                'name':        'Licence Informatique L3 Réseaux & Télécoms',
                'niveau':      'L3-RT',
                'description': 'Licence 3 spécialité Réseaux & Télécoms',
            },
        ],
    },
    {
        'username':   'mboup_elhadj',
        'email':      'elhadj.mboup@ufr-set.sn',
        'first_name': 'El Hadj Modou',
        'last_name':  'MBOUP',
        'password':   'Spet@EHMboup_2025',
        'filieres': [
            {
                'code':        'LI-M1',
                'name':        'Licence Informatique Master 1',
                'niveau':      'M1',
                'description': 'Master 1 Informatique',
            },
            {
                'code':        'LI-M2',
                'name':        'Licence Informatique Master 2',
                'niveau':      'M2',
                'description': 'Master 2 Informatique',
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Cree les 3 comptes Responsable de Filiere avec leurs filieres assignees."

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reinitialise les mots de passe des responsables existants.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        reset = options['reset']

        from academics.models import UFR, Department, Filiere

        # ── 1. Supprimer les anciens comptes generiques si present ──
        old_usernames = ['resp_l1', 'resp_l2', 'resp_l3gl', 'resp_l3rt']
        deleted = User.objects.filter(username__in=old_usernames).delete()
        if deleted[0]:
            self.stdout.write(f"  Anciens comptes supprimes : {deleted[0]}")

        # ── 2. UFR ─────────────────────────────────────────────────
        ufr, created = UFR.objects.get_or_create(
            code=UFR_DATA['code'],
            defaults={'name': UFR_DATA['name']},
        )
        self.stdout.write(f"  UFR : {ufr.code} ({'creee' if created else 'existante'})")

        # ── 3. Departement ─────────────────────────────────────────
        dept, created = Department.objects.get_or_create(
            code=DEPT_DATA['code'],
            ufr=ufr,
            defaults={'name': DEPT_DATA['name']},
        )
        self.stdout.write(f"  Dept: {dept.code} ({'cree' if created else 'existant'})")
        self.stdout.write("")

        created_count  = 0
        existing_count = 0

        for rd in RESPONSABLES:
            # ── 4. Compte utilisateur ─────────────────────────────
            user_qs = User.objects.filter(username=rd['username'])
            if user_qs.exists():
                resp = user_qs.first()
                existing_count += 1
                status = 'existant'
                if reset:
                    resp.set_password(rd['password'])
                    resp.save(update_fields=['password'])
                    status += ' (mdp reinitialise)'
            else:
                # Filiere primaire = la premiere de la liste
                primary_filiere, _ = Filiere.objects.get_or_create(
                    code=rd['filieres'][0]['code'],
                    department=dept,
                    defaults={
                        'name':      rd['filieres'][0]['name'],
                        'niveau':    rd['filieres'][0]['niveau'],
                        'description': rd['filieres'][0]['description'],
                        'is_active': True,
                    },
                )
                resp = User.objects.create_user(
                    username=rd['username'],
                    email=rd['email'],
                    password=rd['password'],
                    first_name=rd['first_name'],
                    last_name=rd['last_name'],
                    role='RESP_FIL',
                    filiere=primary_filiere,
                    profile_status='COMPLET',
                    is_active=True,
                )
                created_count += 1
                status = 'cree'

            # ── 5. Creer / mettre a jour toutes les filieres ──────
            niveaux_geres = []
            for fd in rd['filieres']:
                fil, _ = Filiere.objects.get_or_create(
                    code=fd['code'],
                    department=dept,
                    defaults={
                        'name':        fd['name'],
                        'niveau':      fd['niveau'],
                        'description': fd['description'],
                        'is_active':   True,
                    },
                )
                # S'assurer que le niveau est correct
                if fil.niveau != fd['niveau']:
                    fil.niveau = fd['niveau']
                    fil.save(update_fields=['niveau'])
                # Assigner ce responsable
                if fil.responsable_id != resp.pk:
                    fil.responsable = resp
                    fil.save(update_fields=['responsable'])
                niveaux_geres.append(fd['niveau'])

            # Ligne de sortie
            niv_str = ' + '.join(niveaux_geres)
            self.stdout.write(
                f"  [{niv_str}]"
            )
            self.stdout.write(
                f"    Nom          : {rd['first_name']} {rd['last_name']}"
            )
            self.stdout.write(
                f"    Username     : {rd['username']}  ({status})"
            )
            self.stdout.write(
                f"    Email        : {rd['email']}"
            )
            self.stdout.write(
                f"    Mot de passe : {rd['password']}"
            )
            self.stdout.write(
                f"    Filieres     : {', '.join(f['code'] for f in rd['filieres'])}"
            )
            self.stdout.write("")

        self.stdout.write(self.style.SUCCESS(
            f"OK - {created_count} compte(s) cree(s), {existing_count} existant(s)."
        ))
        self.stdout.write("")
        self.stdout.write("  Recapitulatif :")
        self.stdout.write("  " + "-" * 72)
        self.stdout.write(f"  {'Username':<20} {'Niveaux geres':<22} {'Mot de passe'}")
        self.stdout.write("  " + "-" * 72)
        for rd in RESPONSABLES:
            niv = ' + '.join(f['niveau'] for f in rd['filieres'])
            self.stdout.write(f"  {rd['username']:<20} {niv:<22} {rd['password']}")
        self.stdout.write("  " + "-" * 72)
