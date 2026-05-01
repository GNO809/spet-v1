# SPET — Système de Planification des Emplois du Temps
## UFR Sciences et Technologies · Université Iba Der Thiam de Thiès

---

## 🚀 Installation & Démarrage

### Prérequis
- Node.js >= 18.x
- npm >= 9.x

### Étapes

```bash
# 1. Aller dans le dossier
cd spet-frontend

# 2. Installer les dépendances
npm install

# 3. Copier le fichier d'environnement
cp .env.example .env

# 4. Démarrer le serveur de développement
npm run dev
```

L'application sera accessible sur **http://localhost:5173**

---

## 🔐 Comptes de démonstration

| Email              | Rôle                    | Mot de passe |
|--------------------|-------------------------|--------------|
| admin@ufr.sn       | Administrateur          | spet2024     |
| chef@ufr.sn        | Chef de Département     | spet2024     |
| resp@ufr.sn        | Responsable de Filière  | spet2024     |
| prof@ufr.sn        | Enseignant              | spet2024     |

---

## 🏗️ Architecture du projet

```
src/
├── assets/                   # Images, icônes statiques
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx       # Navigation latérale fixe
│   │   ├── Topbar.jsx        # Barre de navigation supérieure
│   │   └── MainLayout.jsx    # Layout principal avec Outlet
│   ├── ui/
│   │   ├── Badge.jsx         # Badges statut/rôle/type
│   │   ├── Button.jsx        # Boutons (primary/secondary/danger...)
│   │   ├── Loader.jsx        # Spinner, Skeleton, PageLoader
│   │   ├── Modal.jsx         # Fenêtres modales
│   │   ├── StatCard.jsx      # Cartes statistiques
│   │   ├── Table.jsx         # Tableau avec recherche/tri/pagination
│   │   └── ToastContainer.jsx # Notifications toast
│   └── timetable/
│       └── TimetableView.jsx  # Grille EDT hebdomadaire
├── contexts/
│   ├── AuthContext.jsx        # État auth + login/logout
│   └── NotificationContext.jsx # Toast notifications
├── pages/
│   ├── auth/
│   │   └── Login.jsx          # Page de connexion
│   ├── admin/
│   │   ├── Dashboard.jsx      # Tableau de bord Admin
│   │   ├── Users.jsx          # CRUD utilisateurs
│   │   ├── Rooms.jsx          # CRUD salles
│   │   ├── Courses.jsx        # CRUD cours
│   │   ├── Stats.jsx          # Statistiques globales
│   │   └── Archive.jsx        # Archivage EDT
│   ├── chef/
│   │   ├── Dashboard.jsx      # Tableau de bord Chef Dept
│   │   ├── CourseAssignment.jsx # Affectation des cours
│   │   ├── Timetables.jsx     # Vue EDT (toutes filières)
│   │   ├── Validation.jsx     # Valider/rejeter les EDT
│   │   └── Export.jsx         # Export PDF/Excel
│   ├── responsable/
│   │   ├── Dashboard.jsx      # Tableau de bord Resp. Filière
│   │   ├── TimetableGeneration.jsx # Génération EDT
│   │   ├── MyTimetables.jsx   # Liste de mes EDT
│   │   ├── ProfileValidation.jsx   # Valider profils enseignants
│   │   └── Publication.jsx    # Soumission & Publication EDT
│   ├── enseignant/
│   │   ├── Dashboard.jsx      # Tableau de bord Enseignant
│   │   ├── Profile.jsx        # Mon profil
│   │   ├── Availability.jsx   # Mes disponibilités
│   │   └── MyTimetable.jsx    # Mon emploi du temps
│   └── shared/
│       ├── Notifications.jsx  # Toutes les notifications
│       └── Settings.jsx       # Paramètres & sécurité
├── services/
│   ├── api.js                 # Client Axios (JWT interceptors)
│   ├── auth.service.js        # Login, logout, profile
│   ├── timetable.service.js   # CRUD EDT, génération, export
│   ├── user.service.js        # CRUD users, profiles, availabilities
│   ├── room.service.js        # CRUD salles
│   └── notification.service.js # Notifications
├── utils/
│   ├── constants.js           # Rôles, statuts, couleurs, jours...
│   ├── helpers.js             # Formatage, initiales, storage...
│   └── mockData.js            # Données de démonstration
├── App.jsx                    # Routeur principal (React Router v6)
├── main.jsx                   # Point d'entrée React
└── index.css                  # Design system (CSS custom properties)
```

---

## 🔗 Connexion au Backend Django

Pour brancher le backend Django/PostgreSQL :

### 1. Mettre à jour `.env`
```env
VITE_API_URL=http://localhost:8000/api
```

### 2. Désactiver le mode démo dans `AuthContext.jsx`

Dans `src/contexts/AuthContext.jsx`, commentez le bloc **DEMO MODE** et décommentez le bloc **PRODUCTION** :

```javascript
// ── PRODUCTION (décommenter quand backend prêt) ──
const tokens = await AuthService.login(email, password);
const profile = await AuthService.getProfile();
storage.set('spet_user', profile);
setUser(profile);
return profile;
```

### 3. Remplacer les données mock

Dans chaque page, remplacez les imports de `mockData.js` par des appels API via les services :

```javascript
// Avant (mock)
import { MOCK_USERS } from '@/utils/mockData';

// Après (API)
import UserService from '@/services/user.service';
const users = await UserService.getAll();
```

### 4. Points d'API attendus (Django)

| Endpoint                        | Description                    |
|---------------------------------|--------------------------------|
| `POST /api/auth/token/`         | Connexion (JWT)                |
| `POST /api/auth/token/refresh/` | Rafraîchir le token            |
| `GET  /api/auth/me/`            | Profil utilisateur courant     |
| `GET/POST /api/users/`          | CRUD utilisateurs              |
| `GET/POST /api/rooms/`          | CRUD salles                    |
| `GET/POST /api/edts/`           | CRUD emplois du temps          |
| `POST /api/edts/{id}/generate/` | Générer un EDT                 |
| `POST /api/edts/{id}/validate/` | Valider un EDT                 |
| `POST /api/edts/{id}/publish/`  | Publier un EDT                 |
| `GET  /api/notifications/`      | Liste des notifications        |
| `GET  /api/dashboard/stats/`    | Statistiques dashboard         |

---

## 🎨 Design System

Le design system est centralisé dans `src/index.css` avec des **CSS Custom Properties** :

```css
:root {
  --blue-primary:   #1a56db;
  --blue-dark:      #1e3a8a;
  --success:        #10b981;
  --warning:        #f59e0b;
  --danger:         #ef4444;
  --text-primary:   #1e293b;
  --sidebar-width:  260px;
  /* ... */
}
```

---

## 📦 Build pour production

```bash
npm run build
```

Les fichiers optimisés seront dans le dossier `dist/`.

---

## 🛠️ Technologies

| Technologie        | Usage                        |
|--------------------|------------------------------|
| React 18           | Framework UI                 |
| React Router v6    | Navigation & routage         |
| Axios              | Appels API HTTP              |
| Lucide React       | Icônes SVG                   |
| date-fns           | Formatage des dates          |
| Vite               | Build tool & dev server      |
| CSS Custom Props   | Design system                |

---

*SPET © 2025-2026 · UFR Sciences et Technologies · Université Iba Der Thiam de Thiès*
