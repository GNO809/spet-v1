# SPET — Backend Django REST Framework
**Système de Planification des Emplois du Temps**
UFR Sciences et Technologies · Université Iba Der Thiam de Thiès

---

## 🚀 Installation rapide

```bash
# 1. Cloner et entrer dans le dossier
cd spet-backend

# 2. Créer le virtualenv
python -m venv .venv
source .venv/bin/activate     # Linux/Mac
.venv\Scripts\activate        # Windows

# 3. Installer les dépendances
pip install -r requirements.txt

# 4. Configurer l'environnement
cp .env.example .env
# Éditez .env avec vos paramètres PostgreSQL

# 5. Créer la base de données PostgreSQL
createdb spet_db

# 6. Appliquer les migrations
python manage.py migrate

# 7. Initialiser les données de démo
python manage.py seed_data

# 8. Lancer le serveur
python manage.py runserver
```

---

## 📁 Structure du projet

```
spet-backend/
├── manage.py
├── requirements.txt
├── .env.example
├── spet/                    # Configuration principale
│   ├── settings/
│   │   ├── base.py          # Settings communs
│   │   ├── development.py   # Dev (DEBUG=True, BrowsableAPI)
│   │   └── production.py    # Prod (HTTPS, logs, email)
│   └── urls.py              # Routes principales
│
├── accounts/                # Authentification & utilisateurs
│   ├── models.py            # User custom avec rôles
│   ├── serializers.py       # JWT enrichi, CRUD user
│   ├── views.py             # Login, me, users, validation profil
│   ├── permissions.py       # IsAdmin, IsChefDept, IsRespFil…
│   └── urls/
│       ├── auth.py          # /api/v1/auth/
│       └── users.py         # /api/v1/users/
│
├── academics/               # Structure académique
│   ├── models.py            # UFR, Département, Filière, Cours, Groupes
│   ├── serializers.py
│   ├── views.py             # ViewSets
│   └── urls.py              # /api/v1/academics/
│
├── planning/                # Planification
│   ├── models.py            # Salle, Dispo, Séance, EDT, Conflit
│   ├── serializers.py
│   ├── views.py             # ViewSets + workflow
│   ├── services.py          # Logique métier (conflits, qualité, workflow)
│   └── urls.py              # /api/v1/planning/
│
├── notifications/           # Système de notifications
│   ├── models.py
│   ├── services.py          # create_notification(), mark_all_read()
│   ├── views.py
│   └── urls.py              # /api/v1/notifications/
│
├── exports/                 # Export PDF & Excel
│   ├── services.py          # generate_timetable_pdf/excel
│   ├── views.py
│   └── urls.py              # /api/v1/exports/
│
├── dashboard/               # Statistiques par rôle
│   ├── views.py
│   └── urls.py              # /api/v1/dashboard/
│
└── core/                    # Utilitaires communs
    ├── pagination.py        # StandardPagination
    ├── exceptions.py        # Handler d'erreurs normalisé
    └── management/
        └── commands/
            └── seed_data.py # python manage.py seed_data
```

---

## 🔑 Authentification JWT

```
POST /api/v1/auth/login/
Body : { "email": "...", "password": "..." }
Response : { "access": "...", "refresh": "...", "user": {...} }

# Rafraîchir
POST /api/v1/auth/refresh/
Body : { "refresh": "..." }

# Déconnexion (blacklist)
POST /api/v1/auth/logout/
Body : { "refresh": "..." }

# Profil courant
GET /api/v1/auth/me/

# Changer mot de passe
POST /api/v1/auth/change-password/
```

---

## 🗺️ Carte des endpoints

### AUTH
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/v1/auth/login/` | Connexion, retourne JWT |
| POST | `/api/v1/auth/logout/` | Déconnexion (blacklist refresh) |
| POST | `/api/v1/auth/refresh/` | Rafraîchir l'access token |
| GET/PATCH | `/api/v1/auth/me/` | Profil de l'utilisateur connecté |
| POST | `/api/v1/auth/change-password/` | Changer le mot de passe |

### USERS
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/users/` | Liste utilisateurs (admin/chef) |
| POST | `/api/v1/users/` | Créer un utilisateur (admin) |
| GET | `/api/v1/users/{id}/` | Détail utilisateur |
| PATCH | `/api/v1/users/{id}/` | Modifier utilisateur |
| DELETE | `/api/v1/users/{id}/` | Désactiver utilisateur |
| GET | `/api/v1/users/teachers/` | Liste enseignants |
| PATCH | `/api/v1/users/{id}/validate-profile/` | Valider profil enseignant |

### ACADEMICS
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| CRUD | `/api/v1/academics/ufr/` | UFR |
| CRUD | `/api/v1/academics/departments/` | Départements |
| CRUD | `/api/v1/academics/filieres/` | Filières |
| CRUD | `/api/v1/academics/academic-years/` | Années académiques |
| CRUD | `/api/v1/academics/courses/` | Cours/Modules |
| CRUD | `/api/v1/academics/groups/` | Groupes étudiants |

### PLANNING
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| CRUD | `/api/v1/planning/rooms/` | Salles |
| GET | `/api/v1/planning/rooms/available/` | Salles disponibles |
| CRUD | `/api/v1/planning/availabilities/` | Dispos enseignants |
| GET | `/api/v1/planning/availabilities/my/` | Mes disponibilités |
| POST | `/api/v1/planning/availabilities/bulk/` | Mise à jour groupée |
| CRUD | `/api/v1/planning/room-availabilities/` | Dispos salles |
| CRUD | `/api/v1/planning/timetables/` | Emplois du temps |
| POST | `/api/v1/planning/timetables/{id}/action/` | Workflow (submit/validate/reject/publish/archive) |
| POST | `/api/v1/planning/timetables/{id}/detect-conflicts/` | Détection conflits |
| CRUD | `/api/v1/planning/sessions/` | Séances |
| GET | `/api/v1/planning/conflicts/` | Conflits |
| PATCH | `/api/v1/planning/conflicts/{id}/resolve/` | Résoudre conflit |

### NOTIFICATIONS
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/notifications/` | Mes notifications |
| GET | `/api/v1/notifications/?read=false` | Non lues |
| PATCH | `/api/v1/notifications/{id}/` | Marquer comme lue |
| POST | `/api/v1/notifications/mark-all-read/` | Tout marquer lu |
| GET | `/api/v1/notifications/unread-count/` | Compteur |
| DELETE | `/api/v1/notifications/{id}/` | Supprimer |

### EXPORTS
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/exports/timetable/{id}/pdf/` | PDF emploi du temps |
| GET | `/api/v1/exports/timetable/{id}/excel/` | Excel emploi du temps |
| GET | `/api/v1/exports/teacher/{id}/pdf/` | PDF personnel enseignant |

### DASHBOARD
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/dashboard/` | Stats selon le rôle connecté |

---

## 👤 Rôles et permissions

| Action | ADMIN | CHEF_DEPT | RESP_FIL | ENSEIGNANT |
|--------|-------|-----------|----------|------------|
| Créer utilisateurs | ✅ | ❌ | ❌ | ❌ |
| Gérer salles | ✅ | ❌ | ❌ | ❌ |
| Gérer cours/filières | ✅ | ✅ | ✅ | ❌ |
| Créer séances | ✅ | ❌ | ✅ | ❌ |
| Soumettre EDT | ✅ | ❌ | ✅ | ❌ |
| Valider EDT | ✅ | ✅ | ❌ | ❌ |
| Publier EDT | ✅ | ❌ | ✅ | ❌ |
| Voir mon EDT | ✅ | ✅ | ✅ | ✅ |
| Saisir disponibilités | ✅ | ❌ | ❌ | ✅ |
| Valider profil enseignant | ✅ | ✅ | ✅ | ❌ |

---

## 🔧 Variables d'environnement (.env)

```env
SECRET_KEY=votre-clé-secrète
DEBUG=True
DB_NAME=spet_db
DB_USER=spet_user
DB_PASSWORD=spet_password
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
```

---

## 🔗 Connexion avec React (frontend)

Le frontend doit :
1. Stocker le `access` token dans un state (mémoire ou cookie sécurisé)
2. Ajouter `Authorization: Bearer <access>` dans chaque requête
3. Rafraîchir via `/auth/refresh/` quand l'access expire (401)
4. Supprimer les tokens au logout

---

*SPET — UFR Sciences et Technologies · Université Iba Der Thiam de Thiès*
