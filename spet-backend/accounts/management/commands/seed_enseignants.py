# ============================================================
# SPET — Commande : seed_enseignants
# Insère les enseignants et leurs niveaux sans dupliquer
# les utilisateurs déjà en base (chefs, responsables, etc.)
#
# Logique :
#   - Cherche chaque enseignant par nom (normalisé, sans titre)
#   - Si trouvé → met à jour niveaux_souhaites (ajout sans écrasement)
#   - Si absent → crée le compte ENSEIGNANT
#
# Usage :
#   python manage.py seed_enseignants
#   python manage.py seed_enseignants --dry-run   (simule sans écrire)
# ============================================================

import re
import unicodedata
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

User = get_user_model()

# ── Hiérarchie des niveaux ────────────────────────────────────
# L3 se décline en L3-RT et L3-GL dans le modèle
NIVEAU_ORDER = ['L1', 'L2', 'L3', 'M1', 'M2']
NIVEAU_EXPAND = {
    'L1': ['L1'],
    'L2': ['L2'],
    'L3': ['L3-RT', 'L3-GL'],
    'M1': ['M1'],
    'M2': ['M2'],
}


def expand_niveaux(range_str):
    """'L1 – M1' → ['L1', 'L2', 'L3-RT', 'L3-GL', 'M1']"""
    parts = [p.strip() for p in re.split(r'\s*[–—-]\s*', range_str) if p.strip()]
    # Cas sans tiret : un seul niveau
    if len(parts) == 1:
        return NIVEAU_EXPAND.get(parts[0], [parts[0]])
    start, end = parts[0], parts[-1]
    try:
        i_start = NIVEAU_ORDER.index(start)
        i_end   = NIVEAU_ORDER.index(end)
    except ValueError:
        return [start, end]
    result = []
    for n in NIVEAU_ORDER[i_start:i_end + 1]:
        result.extend(NIVEAU_EXPAND.get(n, [n]))
    return result


# ── Normalisation des chaînes ─────────────────────────────────
def normalize(s):
    """Retire les accents, met en minuscule, garde lettres/chiffres."""
    s = unicodedata.normalize('NFKD', s)
    s = s.encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'[^a-z0-9]', '', s.lower())


TITLES = {'pr', 'dr', 'm.', 'mr', 'mme', 'prof.', 'prof'}


def strip_title(name):
    """Retire le titre du début du nom."""
    parts = name.split()
    while parts and parts[0].lower().rstrip('.') in TITLES:
        parts = parts[1:]
    return ' '.join(parts)


def split_name(full_name):
    """
    Retourne (first_name, last_name) après avoir retiré le titre.
    Heuristique : le dernier mot tout-majuscules est le nom de famille.
    """
    cleaned = strip_title(full_name)
    parts   = cleaned.split()
    if not parts:
        return '', full_name
    # Cherche le dernier token en majuscules comme nom de famille
    for i in range(len(parts) - 1, -1, -1):
        if parts[i].isupper() or parts[i].replace('.', '').isupper():
            return ' '.join(parts[:i]), parts[i]
    # Sinon : dernier mot = nom, reste = prénom
    return ' '.join(parts[:-1]), parts[-1]


def make_username(first_name, last_name):
    last  = normalize(last_name)[:12]
    first = normalize(first_name.split()[0])[:4] if first_name.split() else 'ens'
    base  = f'{last}_{first}'
    username = base
    n = 1
    while User.objects.filter(username=username).exists():
        username = f'{base}{n}'
        n += 1
    return username


def make_email(first_name, last_name):
    last  = normalize(last_name)
    first = normalize(first_name.split()[0])[:1] if first_name.split() else 'e'
    base  = f'{first}.{last}@ufr-set.sn'
    email = base
    n = 1
    while User.objects.filter(email=email).exists():
        email = f'{first}.{last}{n}@ufr-set.sn'
        n += 1
    return email


def find_user(first_name, last_name):
    """
    Cherche un utilisateur existant par correspondance de nom.
    Retourne le User ou None.
    """
    norm_last  = normalize(last_name)
    norm_first = normalize(first_name)

    candidates = User.objects.filter(
        last_name__iexact=last_name
    )
    if not candidates.exists():
        # Essai normalisé
        candidates = [
            u for u in User.objects.all()
            if normalize(u.last_name) == norm_last
        ]

    if not candidates:
        return None

    # Si prénom vide ou initial → retourner le premier match sur le nom de famille
    if not norm_first or len(norm_first) <= 2:
        return candidates[0] if hasattr(candidates, '__iter__') else candidates.first()

    # Chercher la correspondance la plus proche sur le prénom
    best = None
    for u in candidates:
        nf = normalize(u.first_name)
        # Correspondance exacte, préfixe ou initiale commune
        if nf == norm_first or nf.startswith(norm_first) or norm_first.startswith(nf[:3]):
            best = u
            break
    # Si aucun prénom ne correspond parfaitement, prendre le premier par nom de famille
    return best or (candidates[0] if hasattr(candidates, '__getitem__') else candidates.first())


# ── Données des enseignants ───────────────────────────────────
ENSEIGNANTS = [
    {
        'display':     'Papa Cheikh DIOP',
        'first_name':  'Papa Cheikh',
        'last_name':   'DIOP',
        'modules':     ['Analyse 1 & 2', 'Algèbre 1 & 2'],
        'niveaux_range': 'L1',
    },
    {
        'display':     'Idrissa GAYE',
        'first_name':  'Idrissa',
        'last_name':   'GAYE',
        'modules':     ['Physique', 'Électricité', 'Ondes', 'Électronique',
                        'Transmission analogique', 'Méthodo recherche'],
        'niveaux_range': 'L1 – M1',
    },
    {
        'display':     'Pr Cheikh SARR',
        'first_name':  'Cheikh',
        'last_name':   'SARR',
        'modules':     ['Analyse de données massives'],
        'niveaux_range': 'M2',
    },
    {
        'display':     'François KALY',
        'first_name':  'François',
        'last_name':   'KALY',
        'modules':     ['Algorithmique & Programmation 1 & 2', 'Data Mining'],
        'niveaux_range': 'L1 – M1',
    },
    {
        'display':     'Mouhamadou THIAM',
        'first_name':  'Mouhamadou',
        'last_name':   'THIAM',
        'modules':     ["Systèmes d'exploitation", 'BD nouvelle génération', 'Web sémantique'],
        'niveaux_range': 'L1 – M2',
    },
    {
        'display':     'Seny MBAYE',
        'first_name':  'Seny',
        'last_name':   'MBAYE',
        'modules':     ['Dév Web 1 & 2', 'Web avancé', 'Génie logiciel intro'],
        'niveaux_range': 'L2 – L3',
    },
    {
        'display':     'Dr François GOMIS',
        'first_name':  'François',
        'last_name':   'GOMIS',
        'modules':     ['Algo avancé', 'Programmation fonctionnelle', 'IA intro'],
        'niveaux_range': 'L2 – M1',
    },
    {
        'display':     'Mansour DIOUF',
        'first_name':  'Mansour',
        'last_name':   'DIOUF',
        'modules':     ['POO2', 'Qualité logicielle'],
        'niveaux_range': 'L3',
    },
    {
        'display':     'Cheikhou THIAM',
        'first_name':  'Cheikhou',
        'last_name':   'THIAM',
        'modules':     ['Cloud & virtualisation', 'Systèmes distribués'],
        'niveaux_range': 'M1 – M2',
    },
    {
        'display':     'Cherif KASSE',
        'first_name':  'Cherif',
        'last_name':   'KASSE',
        'modules':     ['Génie & architecture logicielle'],
        'niveaux_range': 'M1',
    },
    {
        'display':     'Amadou MBAYE',
        'first_name':  'Amadou',
        'last_name':   'MBAYE',
        'modules':     ['Compilation'],
        'niveaux_range': 'M2',
    },
    {
        'display':     'Abdou Karim CISSOKHO',
        'first_name':  'Abdou Karim',
        'last_name':   'CISSOKHO',
        'modules':     ['Programmation avancée'],
        'niveaux_range': 'M2',
    },
    {
        'display':     'M. KALY',
        'first_name':  '',
        'last_name':   'KALY',
        'modules':     ["Systèmes d'information"],
        'niveaux_range': 'M1',
    },
    {
        'display':     'Pr Moussa Déthié SARR',
        'first_name':  'Moussa Déthié',
        'last_name':   'SARR',
        'modules':     ['Réseaux', 'Admin réseaux & systèmes'],
        'niveaux_range': 'L2 – M1',
    },
    {
        'display':     'Cheikh S.M CISSE',
        'first_name':  'Cheikh S.M',
        'last_name':   'CISSE',
        'modules':     ['Architecture TCP/IP'],
        'niveaux_range': 'M1',
    },
    {
        'display':     'Pr C. SARR',
        'first_name':  'C.',
        'last_name':   'SARR',
        'modules':     ['Sécurité des réseaux'],
        'niveaux_range': 'L3',
    },
    {
        'display':     'M. DOUMBOUYA',
        'first_name':  '',
        'last_name':   'DOUMBOUYA',
        'modules':     ['Routage IP'],
        'niveaux_range': 'L3',
    },
    {
        'display':     'Dr BARRO',
        'first_name':  '',
        'last_name':   'BARRO',
        'modules':     ['IoT'],
        'niveaux_range': 'L3',
    },
    {
        'display':     'M. DIONE',
        'first_name':  '',
        'last_name':   'DIONE',
        'modules':     ['Maintenance informatique', 'Techno sans-fil'],
        'niveaux_range': 'L3 – M1',
    },
    {
        'display':     'Seydina Oumar NDIAYE',
        'first_name':  'Seydina Oumar',
        'last_name':   'NDIAYE',
        'modules':     ['Administration bases de données'],
        'niveaux_range': 'M1',
    },
    {
        'display':     'Baye Demba DIACK',
        'first_name':  'Baye Demba',
        'last_name':   'DIACK',
        'modules':     ['Entrepôt de données'],
        'niveaux_range': 'M2',
    },
    {
        'display':     'Dr Modou MBOUP',
        'first_name':  'Modou',
        'last_name':   'MBOUP',
        'modules':     ['Cryptographie'],
        'niveaux_range': 'M1',
    },
    {
        'display':     'Dr E.M MBOUP',
        'first_name':  'E.M',
        'last_name':   'MBOUP',
        'modules':     ['Sécurité logicielle'],
        'niveaux_range': 'M1',
    },
    {
        'display':     'Mame Ousmane KANE',
        'first_name':  'Mame Ousmane',
        'last_name':   'KANE',
        'modules':     ['Gestion de projet'],
        'niveaux_range': 'M2',
    },
    {
        'display':     'Matar DIOP',
        'first_name':  'Matar',
        'last_name':   'DIOP',
        'modules':     ['Management des entreprises'],
        'niveaux_range': 'M2',
    },
    {
        'display':     'Pierre NDIAYE',
        'first_name':  'Pierre',
        'last_name':   'NDIAYE',
        'modules':     ['Droit des TIC'],
        'niveaux_range': 'M1',
    },
    {
        'display':     'Mbagnick GNING',
        'first_name':  'Mbagnick',
        'last_name':   'GNING',
        'modules':     ["Création d'entreprise"],
        'niveaux_range': 'L3',
    },
    {
        'display':     'M. DIA',
        'first_name':  '',
        'last_name':   'DIA',
        'modules':     ['Projet pro', 'Recherche scientifique'],
        'niveaux_range': 'L2 – L3',
    },
    {
        'display':     'Khadim Rassoul FALL',
        'first_name':  'Khadim Rassoul',
        'last_name':   'FALL',
        'modules':     ['Anglais'],
        'niveaux_range': 'M1',
    },
    {
        'display':     'M. SAMB',
        'first_name':  '',
        'last_name':   'SAMB',
        'modules':     ['Anglais'],
        'niveaux_range': 'L2 – L3',
    },
    {
        'display':     'M. AGNE',
        'first_name':  '',
        'last_name':   'AGNE',
        'modules':     ['Anglais'],
        'niveaux_range': 'L1 – L2',
    },
    {
        'display':     'Mr SEYE',
        'first_name':  '',
        'last_name':   'SEYE',
        'modules':     ['Recherche documentaire', 'Communication'],
        'niveaux_range': 'L1',
    },
    {
        'display':     'Mr DIAWARA',
        'first_name':  '',
        'last_name':   'DIAWARA',
        'modules':     ['Architecture des ordinateurs'],
        'niveaux_range': 'L1',
    },
]


class Command(BaseCommand):
    help = "Insère les enseignants avec leurs niveaux sans dupliquer les utilisateurs existants."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simule sans écrire en base.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        if dry_run:
            self.stdout.write(self.style.WARNING('  [DRY-RUN] Aucune écriture en base.\n'))

        created_count  = 0
        updated_count  = 0
        skipped_count  = 0

        self.stdout.write('  ' + '-' * 72)
        self.stdout.write(f"  {'Nom affiche':<30} {'Action':<12} {'Niveaux ajoutes'}")
        self.stdout.write('  ' + '-' * 72)

        with transaction.atomic():
            for ens in ENSEIGNANTS:
                niveaux_new = expand_niveaux(ens['niveaux_range'])
                existing    = find_user(ens['first_name'], ens['last_name'])

                if existing:
                    # ── Utilisateur trouvé → mise à jour additive des niveaux ──
                    current   = list(existing.niveaux_souhaites or [])
                    to_add    = [n for n in niveaux_new if n not in current]
                    merged    = current + to_add

                    action = f'MàJ ({existing.get_role_display()[:8]})'
                    detail = ', '.join(to_add) if to_add else '(déjà présents)'

                    if not dry_run and to_add:
                        existing.niveaux_souhaites = merged
                        existing.save(update_fields=['niveaux_souhaites'])
                    updated_count += 1
                else:
                    # ── Nouvel enseignant ─────────────────────────────────────
                    username = make_username(ens['first_name'], ens['last_name'])
                    email    = make_email(ens['first_name'], ens['last_name'])
                    password = f"Spet@{normalize(ens['last_name']).capitalize()}_2025"

                    action = 'CRÉÉ'
                    detail = ', '.join(niveaux_new)

                    if not dry_run:
                        User.objects.create_user(
                            username=username,
                            email=email,
                            password=password,
                            first_name=ens['first_name'],
                            last_name=ens['last_name'],
                            role='ENSEIGNANT',
                            niveaux_souhaites=niveaux_new,
                            profile_status='INCOMPLET',
                            is_active=True,
                        )
                    created_count += 1

                self.stdout.write(
                    f"  {ens['display']:<30} {action:<12} {detail}"
                )

        self.stdout.write('  ' + '-' * 72)
        self.stdout.write('')
        if dry_run:
            self.stdout.write(self.style.WARNING(
                f"  [DRY-RUN] {created_count} à créer, {updated_count} à mettre à jour."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"  OK — {created_count} compte(s) créé(s), {updated_count} mis à jour."
            ))
        self.stdout.write('')

        # Récapitulatif des nouveaux comptes créés (mots de passe)
        if not dry_run and created_count:
            self.stdout.write('  Nouveaux comptes créés :')
            self.stdout.write('  ' + '-' * 72)
            self.stdout.write(f"  {'Nom':<30} {'Email':<35} {'Mot de passe'}")
            self.stdout.write('  ' + '-' * 72)
            for ens in ENSEIGNANTS:
                if not find_user(ens['first_name'], ens['last_name']):
                    # Already created, won't match again — afficher depuis DB
                    pass
            # Recharger depuis la DB pour lister les nouveaux
            for ens in ENSEIGNANTS:
                u = find_user(ens['first_name'], ens['last_name'])
                if u and u.role == 'ENSEIGNANT':
                    pwd = f"Spet@{normalize(ens['last_name']).capitalize()}_2025"
                    self.stdout.write(
                        f"  {ens['display']:<30} {u.email:<35} {pwd}"
                    )
            self.stdout.write('  ' + '-' * 72)
