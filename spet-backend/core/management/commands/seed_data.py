# ============================================================
# SPET — Commande Django : seed_data
# Initialise la base de donnees avec des donnees de demonstration
# Usage : python manage.py seed_data
# ============================================================

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Initialise la base de donnees SPET avec des donnees de demonstration.'

    def handle(self, *args, **kwargs):
        User = get_user_model()

        self.stdout.write('=== SPET - Initialisation des donnees ===')

        # ── UFR ──────────────────────────────────────────────
        from academics.models import UFR, Department, Filiere, AcademicYear, Course, StudentGroup, Niveau
        ufr, _ = UFR.objects.get_or_create(
            code='UFR-SET',
            defaults={
                'name': 'Sciences et Technologies',
                'description': 'Universite Iba Der Thiam de Thies',
            }
        )
        self.stdout.write(f'  OK UFR : {ufr}')

        # ── Departement ───────────────────────────────────────
        dept, _ = Department.objects.get_or_create(
            code='INFO',
            ufr=ufr,
            defaults={'name': 'Informatique'},
        )
        self.stdout.write(f'  OK Departement : {dept}')

        # ── Annee academique ──────────────────────────────────
        ay, _ = AcademicYear.objects.get_or_create(
            label='2024-2025',
            defaults={
                'start_date': '2024-09-01',
                'end_date':   '2025-07-31',
                'is_current': True,
            }
        )

        # ── Filieres ──────────────────────────────────────────
        filieres_data = [
            {'code': 'L1-INFO',  'name': 'Licence 1 Informatique',          'niveau': Niveau.L1},
            {'code': 'L2-INFO',  'name': 'Licence 2 Informatique',          'niveau': Niveau.L2},
            {'code': 'L3-RT',    'name': 'Licence 3 Réseaux & Télécoms',    'niveau': Niveau.L3_RT},
            {'code': 'L3-GL',    'name': 'Licence 3 Génie Logiciel',        'niveau': Niveau.L3_GL},
            {'code': 'M1-INFO',  'name': 'Master 1 Informatique',           'niveau': Niveau.M1},
            {'code': 'M2-INFO',  'name': 'Master 2 Informatique',           'niveau': Niveau.M2},
        ]
        filieres = {}
        for fd in filieres_data:
            f, _ = Filiere.objects.get_or_create(
                code=fd['code'], department=dept,
                defaults={'name': fd['name'], 'niveau': fd['niveau']},
            )
            filieres[fd['code']] = f
        self.stdout.write(f'  OK {len(filieres)} filieres creees')

        # ── Salles ────────────────────────────────────────────
        from planning.models import Room, TimeSlot, RoomType
        rooms_data = [
            {'name': 'Amphi A',    'capacity': 200, 'room_type': 'AMPHI', 'building': 'Bat. Principal', 'floor': 0, 'equipment': ['Vidéoprojecteur', 'Microphone', 'AC']},
            {'name': 'Amphi B',    'capacity': 150, 'room_type': 'AMPHI', 'building': 'Bat. Principal', 'floor': 0, 'equipment': ['Vidéoprojecteur', 'Microphone']},
            {'name': 'Salle 101',  'capacity': 40,  'room_type': 'TD',    'building': 'Bat. A', 'floor': 1, 'equipment': ['Tableau blanc', 'Vidéoprojecteur']},
            {'name': 'Salle 102',  'capacity': 40,  'room_type': 'TD',    'building': 'Bat. A', 'floor': 1, 'equipment': ['Tableau blanc']},
            {'name': 'Salle 103',  'capacity': 35,  'room_type': 'TD',    'building': 'Bat. A', 'floor': 1, 'equipment': ['Tableau blanc', 'Vidéoprojecteur']},
            {'name': 'Labo Réseau','capacity': 25,  'room_type': 'TP',    'building': 'Bat. B', 'floor': 0, 'equipment': ['PCs', 'Switch réseau', 'Câblage']},
            {'name': 'Labo Info 1','capacity': 30,  'room_type': 'TP',    'building': 'Bat. B', 'floor': 0, 'equipment': ['PCs', 'Logiciels', 'Vidéoprojecteur']},
            {'name': 'Labo Info 2','capacity': 30,  'room_type': 'TP',    'building': 'Bat. B', 'floor': 1, 'equipment': ['PCs', 'Logiciels']},
        ]
        for rd in rooms_data:
            Room.objects.get_or_create(name=rd['name'], defaults=rd)
        self.stdout.write(f'  OK {len(rooms_data)} salles creees')

        # ── Creneaux horaires ─────────────────────────────────
        slots_data = [
            {'label': '08h00 - 09h00', 'start_time': '08:00', 'end_time': '09:00', 'order': 1},
            {'label': '09h00 - 10h00', 'start_time': '09:00', 'end_time': '10:00', 'order': 2},
            {'label': '10h00 - 11h00', 'start_time': '10:00', 'end_time': '11:00', 'order': 3},
            {'label': '11h00 - 12h00', 'start_time': '11:00', 'end_time': '12:00', 'order': 4},
            {'label': '15h00 - 16h00', 'start_time': '15:00', 'end_time': '16:00', 'order': 5},
            {'label': '16h00 - 17h00', 'start_time': '16:00', 'end_time': '17:00', 'order': 6},
            {'label': '17h00 - 18h00', 'start_time': '17:00', 'end_time': '18:00', 'order': 7},
            {'label': '18h00 - 19h00', 'start_time': '18:00', 'end_time': '19:00', 'order': 8},
        ]
        for sd in slots_data:
            TimeSlot.objects.get_or_create(label=sd['label'], defaults=sd)
        self.stdout.write(f'  OK {len(slots_data)} creneaux horaires crees')

        # ── Utilisateurs ──────────────────────────────────────
        # _filieres : liste de codes filiere dont cet utilisateur est responsable
        users_data = [
            # ── Admin ─────────────────────────────────────────
            {
                'username': 'admin', 'email': 'admin@ufr-set.sn',
                'first_name': 'Admin', 'last_name': 'SPET',
                'role': 'ADMIN', 'is_staff': True, 'is_superuser': True,
                'password': 'admin1234',
            },
            # ── Chef de Departement ───────────────────────────
            {
                'username': 'amadou.diallo', 'email': 'amadou.diallo@ufr-set.sn',
                'first_name': 'Amadou', 'last_name': 'Diallo',
                'role': 'CHEF_DEPT', 'grade': 'Maître de Conférences',
                'password': 'spet1234',
            },
            # ── Responsables de Filiere (comptes reels) ───────
            {
                'username': 'gomis_francois', 'email': 'f.k.gomis@ufr-set.sn',
                'first_name': 'Francois Kasseme', 'last_name': 'Gomis',
                'role': 'RESP_FIL', 'grade': 'Maître de Conférences',
                'profile_status': 'COMPLET',
                'password': 'Spet@FKGomis_2025',
                '_filieres': ['L1-INFO', 'L2-INFO'],
            },
            {
                'username': 'sarr_moussa', 'email': 'm.d.sarr@ufr-set.sn',
                'first_name': 'Moussa Dethie', 'last_name': 'Sarr',
                'role': 'RESP_FIL', 'grade': 'Maître-Assistant',
                'profile_status': 'COMPLET',
                'password': 'Spet@MDSarr_2025',
                '_filieres': ['L3-GL', 'L3-RT'],
            },
            {
                'username': 'mboup_elhadj', 'email': 'elhadj.mboup@ufr-set.sn',
                'first_name': 'El Hadj Modou', 'last_name': 'MBOUP',
                'role': 'RESP_FIL', 'grade': 'Professeur',
                'profile_status': 'COMPLET',
                'password': 'Spet@EHMboup_2025',
                '_filieres': ['M1-INFO', 'M2-INFO'],
            },
            # ── Enseignants ───────────────────────────────────
            {
                'username': 'moussa.sow', 'email': 'moussa.sow@ufr-set.sn',
                'first_name': 'Moussa', 'last_name': 'Sow',
                'role': 'ENSEIGNANT', 'grade': 'Professeur',
                'password': 'spet1234', 'profile_status': 'VALIDE',
            },
            {
                'username': 'ousmane.fall', 'email': 'ousmane.fall@ufr-set.sn',
                'first_name': 'Ousmane', 'last_name': 'Fall',
                'role': 'ENSEIGNANT', 'grade': 'Maître de Conférences',
                'password': 'spet1234', 'profile_status': 'VALIDE',
            },
        ]

        created_users = {}
        for ud in users_data:
            password      = ud.pop('password')
            user_filieres = ud.pop('_filieres', [])

            u, created = User.objects.get_or_create(
                username=ud['username'],
                defaults={**ud, 'department': dept},
            )
            if created:
                u.set_password(password)
                # Filiere primaire = la premiere de la liste
                if user_filieres and filieres.get(user_filieres[0]):
                    u.filiere = filieres[user_filieres[0]]
                u.save()

            # Assigner ce responsable a toutes ses filieres
            for code in user_filieres:
                fil = filieres.get(code)
                if fil and fil.responsable_id != u.pk:
                    fil.responsable = u
                    fil.save(update_fields=['responsable'])

            created_users[ud['username']] = u

        self.stdout.write(f'  OK {len(users_data)} utilisateurs traites')

        # ── Recapitulatif ─────────────────────────────────────
        self.stdout.write(self.style.SUCCESS('\nBase de donnees initialisee avec succes!'))
        self.stdout.write('')
        self.stdout.write('  ============================================================')
        self.stdout.write('   IDENTIFIANTS DE CONNEXION — SPET DEMO')
        self.stdout.write('  ============================================================')
        self.stdout.write('')
        self.stdout.write('  ADMINISTRATEUR')
        self.stdout.write('    Email        : admin@ufr-set.sn')
        self.stdout.write('    Mot de passe : admin1234')
        self.stdout.write('')
        self.stdout.write('  CHEF DE DEPARTEMENT')
        self.stdout.write('    Email        : amadou.diallo@ufr-set.sn')
        self.stdout.write('    Mot de passe : spet1234')
        self.stdout.write('')
        self.stdout.write('  RESPONSABLES DE FILIERE')
        self.stdout.write('    Francois Kasseme Gomis  (L1 + L2)')
        self.stdout.write('    Email        : f.k.gomis@ufr-set.sn')
        self.stdout.write('    Mot de passe : Spet@FKGomis_2025')
        self.stdout.write('')
        self.stdout.write('    Moussa Dethie Sarr  (L3-GL + L3-RT)')
        self.stdout.write('    Email        : m.d.sarr@ufr-set.sn')
        self.stdout.write('    Mot de passe : Spet@MDSarr_2025')
        self.stdout.write('')
        self.stdout.write('    El Hadj Modou MBOUP  (M1 + M2)')
        self.stdout.write('    Email        : elhadj.mboup@ufr-set.sn')
        self.stdout.write('    Mot de passe : Spet@EHMboup_2025')
        self.stdout.write('')
        self.stdout.write('  ENSEIGNANTS')
        self.stdout.write('    Email        : moussa.sow@ufr-set.sn      / spet1234')
        self.stdout.write('    Email        : ousmane.fall@ufr-set.sn    / spet1234')
        self.stdout.write('  ============================================================')
