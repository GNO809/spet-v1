"""
Maquette officielle — Licence Informatique, UFR SET, Université de Thiès (v2018)
+ Master Informatique (M1 / M2)

Données extraites page par page depuis le PDF officiel.
Usage : python manage.py shell -c "exec(open('insert_maquette.py').read())"
"""

from academics.models import Filiere, Course

FILIERES = {'L1': 7, 'L2': 8, 'L3-GL': 9, 'L3-RT': 10, 'M1': 11, 'M2': 12}

# Format : (code, name, ue, semestre, ecue_credits, ue_coef, vol_cm, vol_td, vol_tp)
# ecue_credits  = UE_credits / nb_ecues  (arrondi si impair)
# ue_coef       = coefficient de l'UE
# vol_td inclut TD+TP (maquette ne distingue pas)

MAQUETTE = {

    # ===========================================================
    # L1 — SEMESTRE 1  (30 cr, coef 12)
    # ===========================================================
    'L1': [
        # UE Mathématiques INF 111 — 8 cr, coef 3
        ('INF1111', 'Analyse 1',                                        'Mathématiques',              'S1', 4, 3, 20, 20, 0),
        ('INF1112', 'Algèbre 1',                                        'Mathématiques',              'S1', 4, 3, 20, 20, 0),
        # UE Physique INF 112 — 8 cr, coef 3
        ('INF1121', 'Fondamentaux de physique',                         'Physique',                   'S1', 4, 3, 20, 20, 0),
        ('INF1122', 'Électricité',                                      'Physique',                   'S1', 4, 3, 20, 20, 0),
        # UE Informatique INF 113 — 8 cr, coef 3
        ('INF1131', 'Algorithmique et programmation 1',                 'Informatique',               'S1', 4, 3, 20, 20, 0),
        ('INF1132', "Introduction aux systèmes d'exploitation",         'Informatique',               'S1', 4, 3, 20, 20, 0),
        # UE Humanités et entreprises INF 114 — 6 cr, coef 2
        ('INF1141', 'Anglais 1',                                        'Humanités et entreprises',   'S1', 3, 2, 20, 20, 0),
        ('INF1142', 'Recherche documentaire',                           'Humanités et entreprises',   'S1', 3, 2, 10, 10, 0),

        # ===========================================================
        # L1 — SEMESTRE 2  (30 cr, coef 11)
        # ===========================================================
        # UE Mathématiques INF 121 — 8 cr, coef 3
        ('INF1211', 'Analyse 2',                                        'Mathématiques',              'S2', 4, 3, 20, 20, 0),
        ('INF1212', 'Algèbre 2',                                        'Mathématiques',              'S2', 4, 3, 20, 20, 0),
        # UE Physique INF 122 — 8 cr, coef 3
        ('INF1221', 'Ondes et Propagation',                             'Physique',                   'S2', 4, 3, 20, 20, 0),
        ('INF1222', 'Électronique',                                     'Physique',                   'S2', 4, 3, 20, 20, 0),
        # UE Informatique INF 123 — 8 cr, coef 3
        ('INF1231', 'Algorithmique et Programmation 2',                 'Informatique',               'S2', 4, 3, 20, 20, 0),
        ('INF1232', 'Architecture des ordinateurs',                     'Informatique',               'S2', 4, 3, 20, 20, 0),
        # UE Humanités et entreprises INF 124 — 6 cr, coef 2
        ('INF1241', 'Anglais 2',                                        'Humanités et entreprises',   'S2', 3, 2, 20, 20, 0),
        ('INF1242', 'Technique de communications',                      'Humanités et entreprises',   'S2', 3, 2, 10, 10, 0),
    ],

    # ===========================================================
    # L2 — SEMESTRE 3  (30 cr, coef 11)
    # ===========================================================
    'L2': [
        # UE Mathématiques INF 231 — 6 cr, coef 2
        ('INF2311', 'Probabilités et Statistiques',                     'Mathématiques',              'S3', 3, 2, 15, 15, 0),
        ('INF2312', 'Calcul Numérique',                                 'Mathématiques',              'S3', 3, 2, 15, 15, 0),
        # UE Réseaux et Systèmes INF 232 — 6 cr, coef 2
        ('INF2321', "Systèmes d'Exploitation",                          'Réseaux et Systèmes',        'S3', 3, 2, 15, 15, 0),
        ('INF2322', 'Introduction aux réseaux',                         'Réseaux et Systèmes',        'S3', 3, 2, 15, 15, 0),
        # UE Informatique INF 233 — 8 cr, coef 3
        ('INF2331', 'Algorithmique et Structures de données',           'Informatique',               'S3', 4, 3, 20, 20, 0),
        ('INF2332', 'Développement web 1',                              'Informatique',               'S3', 4, 3, 20, 20, 0),
        # UE Systèmes d'Information INF 234 — 6 cr, coef 2
        ('INF2341', "Analyse et Conception des Systèmes d'Information", "Systèmes d'information",     'S3', 3, 2, 15, 15, 0),
        ('INF2342', 'Introduction aux Bases de Données Relationnelles', "Systèmes d'information",     'S3', 3, 2, 15, 15, 0),
        # UE Humanités et entreprises INF 235 — 4 cr, coef 2
        ('INF2351', 'Projet Personnel Professionnel',                   'Humanités et entreprises',   'S3', 2, 2, 10, 10, 0),
        ('INF2352', 'Anglais 3',                                        'Humanités et entreprises',   'S3', 2, 2, 10, 10, 0),

        # ===========================================================
        # L2 — SEMESTRE 4  (30 cr, coef 11)
        # ===========================================================
        # UE Réseaux et Sécurité INF 241 — 8 cr, coef 3
        ('INF2411', 'Introduction à la sécurité',                       'Réseaux et Sécurité',        'S4', 4, 3, 20, 20, 0),
        ('INF2412', 'Réseaux locaux',                                   'Réseaux et Sécurité',        'S4', 4, 3, 20, 20, 0),
        # UE Programmation INF 242 — 8 cr, coef 3
        ('INF2421', 'Programmation Orientée Objet 1',                   'Programmation',              'S4', 4, 3, 20, 20, 0),
        ('INF2422', 'Analyse et Conception des Systèmes Orientés Objet','Programmation',              'S4', 4, 3, 20, 20, 0),
        # UE Informatique INF 243 — 8 cr, coef 3
        ('INF2431', 'Technologies XML',                                 'Informatique',               'S4', 4, 3, 20, 20, 0),
        ('INF2432', 'Développement web 2',                              'Informatique',               'S4', 4, 3, 20, 20, 0),
        # UE Humanités et entreprises INF 244 — 6 cr, coef 2  (3 ECUE → 2 cr chacun)
        ('INF2441', 'Gestion de projets',                               'Humanités et entreprises',   'S4', 2, 2, 10, 10, 0),
        ('INF2442', 'Leadership et développement personnel',            'Humanités et entreprises',   'S4', 2, 2, 10, 10, 0),
        ('INF2443', 'Anglais 4',                                        'Humanités et entreprises',   'S4', 2, 2, 10, 10, 0),
    ],

    # ===========================================================
    # L3-GL — SEMESTRE 5  (30 cr, coef 11)
    # ===========================================================
    'L3-GL': [
        # UE Programmation INF 351 — 8 cr, coef 3
        ('INF3511', 'Programmation des mobiles',                        'Programmation',              'S5', 4, 3, 20, 20, 0),
        ('INF3512', 'Programmation Orientée Objet 2',                   'Programmation',              'S5', 4, 3, 20, 20, 0),
        # UE Génie Logiciel INF 352 — 8 cr, coef 3
        ('INF3521', 'Développement Web Avancé',                         'Génie Logiciel',             'S5', 4, 3, 20, 20, 0),
        ('INF3522', 'Introduction au Génie Logiciel',                   'Génie Logiciel',             'S5', 4, 3, 20, 20, 0),
        # UE Informatique INF 353 — 8 cr, coef 3
        ('INF3531', 'Bases de données avancées',                        'Informatique',               'S5', 4, 3, 20, 20, 0),
        ('INF3532', 'Programmation fonctionnelle',                      'Informatique',               'S5', 4, 3, 20, 20, 0),
        # UE Humanités et entreprises INF 354 — 6 cr, coef 2
        ('INF3541', 'Anglais 5',                                        'Humanités et entreprises',   'S5', 3, 2, 15, 15, 0),
        ('INF3542', "Création d'entreprises",                           'Humanités et entreprises',   'S5', 3, 2, 15, 15, 0),

        # ===========================================================
        # L3-GL — SEMESTRE 6  (30 cr, coef 11)
        # ===========================================================
        # UE Informatique INF 361 — 8 cr, coef 3  (3 ECUE : 3+3+2)
        ('INF3611', "Développement d'Applications Distribuées",         'Informatique',               'S6', 3, 3, 15, 15, 0),
        ('INF3612', 'Langage Automate et Compilation',                  'Informatique',               'S6', 3, 3, 15, 15, 0),
        ('INF3613', 'Mesure qualité et performance logicielle',         'Informatique',               'S6', 2, 3, 10, 10, 0),
        # UE Humanités et entreprises INF 362 — 4 cr, coef 2
        ('INF3621', 'Recherche documentaire 2 et Rédaction scientifique','Humanités et entreprises',  'S6', 2, 2, 10, 10, 0),
        ('INF3622', 'Anglais 6',                                        'Humanités et entreprises',   'S6', 2, 2, 10, 10, 0),
        # UE Stage INF 363 — 18 cr, coef 6
        ('INF3631', 'Stage ou Projet Opérationnel',                     'Stage',                      'S6', 18, 6, 0,  0,  0),
    ],

    # ===========================================================
    # L3-RT — SEMESTRE 5  (30 cr, coef 11)
    # ===========================================================
    'L3-RT': [
        # UE Réseaux et télécoms INF 351 — 8 cr, coef 3
        ('INF3511', 'Réseaux sans-fil',                                 'Réseaux et Télécommunications','S5', 4, 3, 20, 20, 0),
        ('INF3512', 'Signaux et systèmes analogiques',                  'Réseaux et Télécommunications','S5', 4, 3, 20, 20, 0),
        # UE Informatique INF 352 — 8 cr, coef 3
        ('INF3521', 'Programmation des mobiles',                        'Informatique',               'S5', 4, 3, 20, 20, 0),
        ('INF3522', "Introduction à l'IoT",                             'Informatique',               'S5', 4, 3, 20, 20, 0),
        # UE Réseaux et Systèmes INF 353 — 8 cr, coef 3
        ('INF3531', 'Administration réseaux et systèmes',               'Réseaux et Systèmes',        'S5', 4, 3, 20, 20, 0),
        ('INF3532', 'Sécurité des réseaux',                             'Réseaux et Systèmes',        'S5', 4, 3, 20, 20, 0),
        # UE Humanités et entreprises INF 354 — 6 cr, coef 2
        ('INF3541', 'Anglais 5',                                        'Humanités et entreprises',   'S5', 3, 2, 15, 15, 0),
        ('INF3542', "Création d'entreprise",                            'Humanités et entreprises',   'S5', 3, 2, 15, 15, 0),

        # ===========================================================
        # L3-RT — SEMESTRE 6  (30 cr, coef 11)
        # ===========================================================
        # UE Réseaux et Systèmes INF 361 — 8 cr, coef 3  (3 ECUE : 3+3+2)
        ('INF3611', 'Maintenance Informatique',                         'Réseaux et Systèmes',        'S6', 3, 3, 10, 20, 0),
        ('INF3612', 'Services réseaux',                                 'Réseaux et Systèmes',        'S6', 3, 3, 10, 20, 0),
        ('INF3613', 'Modules complémentaires',                          'Réseaux et Systèmes',        'S6', 2, 3, 10, 10, 0),
        # UE Humanités et Entreprises INF 362 — 4 cr, coef 2
        ('INF3621', 'Recherche documentaire 2 et Rédaction scientifique','Humanités et entreprises',  'S6', 2, 2, 10, 10, 0),
        ('INF3622', 'Anglais 6',                                        'Humanités et entreprises',   'S6', 2, 2, 10, 10, 0),
        # UE Stage INF 363 — 18 cr, coef 6
        ('INF3631', 'Stage ou Projet Opérationnel',                     'Stage',                      'S6', 18, 6, 0,  0,  0),
    ],

    # ===========================================================
    # MASTER 1 — SEMESTRE 7  (30 cr, coef 12)
    # ===========================================================
    'M1': [
        # UE Algorithmique et Théorie — 8 cr, coef 3
        ('INF5111', 'Algorithmique avancée',                            'Algorithmique et Théorie',   'S7', 4, 3, 25, 20, 0),
        ('INF5112', 'Complexité et calculabilité',                      'Algorithmique et Théorie',   'S7', 4, 3, 25, 20, 0),
        # UE Génie Logiciel Avancé — 8 cr, coef 3
        ('INF5121', 'Architecture logicielle',                          'Génie Logiciel Avancé',      'S7', 4, 3, 25, 20, 0),
        ('INF5122', 'Tests et qualité logicielle',                      'Génie Logiciel Avancé',      'S7', 4, 3, 25, 20, 0),
        # UE Réseaux et Sécurité — 8 cr, coef 3
        ('INF5131', 'Sécurité informatique avancée',                    'Réseaux et Sécurité',        'S7', 4, 3, 25, 20, 0),
        ('INF5132', 'Administration systèmes avancée',                  'Réseaux et Sécurité',        'S7', 4, 3, 25, 20, 0),
        # UE Humanités et Recherche — 6 cr, coef 2
        ('INF5141', 'Anglais scientifique',                             'Humanités et Recherche',     'S7', 3, 2, 20, 15, 0),
        ('INF5142', 'Méthodologie de recherche',                        'Humanités et Recherche',     'S7', 3, 2, 20, 15, 0),

        # ===========================================================
        # MASTER 1 — SEMESTRE 8  (30 cr, coef 11)
        # ===========================================================
        # UE Intelligence Artificielle — 8 cr, coef 3
        ('INF5211', 'Intelligence artificielle',                        'Intelligence Artificielle',  'S8', 4, 3, 25, 20, 0),
        ('INF5212', 'Traitement des données massives',                  'Intelligence Artificielle',  'S8', 4, 3, 25, 20, 0),
        # UE Développement Avancé — 8 cr, coef 3
        ('INF5221', 'Développement mobile avancé',                      'Développement Avancé',       'S8', 4, 3, 25, 20, 0),
        ('INF5222', 'Services web et microservices',                    'Développement Avancé',       'S8', 4, 3, 25, 20, 0),
        # UE Bases de données avancées — 8 cr, coef 3
        ('INF5231', 'Bases de données NoSQL',                           'Bases de données avancées',  'S8', 4, 3, 25, 20, 0),
        ('INF5232', 'Entrepôts de données et Décisionnel',              'Bases de données avancées',  'S8', 4, 3, 25, 20, 0),
        # UE Professionnalisation — 6 cr, coef 2
        ('INF5241', 'Anglais professionnel',                            'Professionnalisation',       'S8', 3, 2, 20, 15, 0),
        ('INF5242', 'Gestion de projets informatiques',                 'Professionnalisation',       'S8', 3, 2, 20, 15, 0),
    ],

    # ===========================================================
    # MASTER 2 — SEMESTRE 9  (30 cr, coef 12)
    # ===========================================================
    'M2': [
        # UE Spécialisation — 8 cr, coef 3
        ('INF6111', 'Cloud computing et virtualisation',                'Spécialisation',             'S9', 4, 3, 25, 20, 0),
        ('INF6112', 'Systèmes distribués',                              'Spécialisation',             'S9', 4, 3, 25, 20, 0),
        # UE Innovation et Recherche — 8 cr, coef 3
        ('INF6121', 'Séminaire de recherche avancé',                    'Innovation et Recherche',    'S9', 4, 3, 20, 15, 0),
        ('INF6122', 'Rédaction et publication scientifique',            'Innovation et Recherche',    'S9', 4, 3, 20, 15, 0),
        # UE Entrepreneuriat — 8 cr, coef 3
        ('INF6131', 'Entrepreneuriat numérique',                        'Entrepreneuriat',            'S9', 4, 3, 20, 15, 0),
        ("INF6132", "Management des systèmes d'information",            'Entrepreneuriat',            'S9', 4, 3, 20, 15, 0),
        # UE Humanités — 6 cr, coef 2
        ('INF6141', 'Anglais avancé',                                   'Humanités',                  'S9', 3, 2, 20, 15, 0),
        ('INF6142', 'Éthique et droit du numérique',                   'Humanités',                  'S9', 3, 2, 20, 15, 0),

        # ===========================================================
        # MASTER 2 — SEMESTRE 10  (30 cr, coef 10)
        # ===========================================================
        # UE Séminaires avancés — 12 cr, coef 4
        ('INF6211', 'Séminaire de spécialité',                          'Séminaires avancés',         'S10', 4, 2, 20, 15, 0),
        ("INF6212", "Atelier de projet de fin d'études",                'Séminaires avancés',         'S10', 4, 2, 20, 15, 0),
        ('INF6213', 'Veille technologique et prospective',              'Séminaires avancés',         'S10', 4, 2, 15, 10, 0),
        # UE Mémoire et Stage — 18 cr, coef 6
        ('INF6221', 'Mémoire de Master',                                'Mémoire et Stage',           'S10', 12, 6, 0,  0,  0),
        ('INF6222', 'Stage en entreprise',                              'Mémoire et Stage',           'S10', 6,  4, 0,  0,  0),
    ],
}


def run():
    created_total = 0
    updated_total = 0
    deleted_total = 0

    for niveau_key, courses_data in MAQUETTE.items():
        filiere_id = FILIERES[niveau_key]
        try:
            filiere = Filiere.objects.get(id=filiere_id)
        except Filiere.DoesNotExist:
            print(f'⚠  Filière {niveau_key} (id={filiere_id}) introuvable — ignorée')
            continue

        # Récupérer les codes présents dans la nouvelle maquette
        new_codes = {code for code, *_ in courses_data}
        # Supprimer les cours obsolètes (codes absents de la maquette)
        old_qs = Course.objects.filter(filiere=filiere).exclude(code__in=new_codes)
        n_del = old_qs.count()
        if n_del:
            old_qs.delete()
            deleted_total += n_del
            print(f'\n  [{niveau_key}] {n_del} cours obsolètes supprimés')

        print(f'\n=== {niveau_key} — {filiere.name} ===')
        for code, name, ue, semestre, credits, coefficient, vol_cm, vol_td, vol_tp in courses_data:
            obj, created = Course.objects.update_or_create(
                filiere=filiere,
                code=code,
                defaults={
                    'name':        name,
                    'ue':          ue,
                    'semestre':    semestre,
                    'credits':     credits,
                    'coefficient': coefficient,
                    'volume_cm':   vol_cm,
                    'volume_td':   vol_td,
                    'volume_tp':   vol_tp,
                    'is_active':   True,
                },
            )
            tag = 'CRÉÉ  ' if created else 'màj   '
            print(f'  [{tag}] {code} | {semestre} | {credits}cr coef{coefficient} | {name}')
            if created:
                created_total += 1
            else:
                updated_total += 1

    print(f'\n✓ Terminé — {created_total} créés | {updated_total} mis à jour | {deleted_total} supprimés')


run()
