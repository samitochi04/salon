# Radiant Bloom – Frontend

Interface React (sans TypeScript) pour la maison de beauté Radiant Bloom. Le site s’articule autour de trois volets :

- Mise en valeur de l’univers de la marque (landing page et storytelling)
- Catalogue des rituels avec réservation en ligne connectée à l’API Node.js
- Espace équipe pour la gestion des réservations, disponibilités et du catalogue via Supabase

Le projet utilise Vite, Tailwind CSS v3, React Query et Supabase Auth.

## Prérequis

- Node.js 20+ (requis par Vite rolldown)
- Backend disponible (voir dossier `server/` du mono-repo)
- Base Supabase provisionnée avec le schéma `salon`

## Installation

```bash
cd client
npm install
```

## Variables d’environnement

Créer un fichier `.env` à la racine du dossier `client/` :

```bash
VITE_API_BASE_URL=http://localhost:4000
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJ...
```

- `VITE_API_BASE_URL` doit pointer vers le serveur Express qui expose `/api/public` et `/api/admin`
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` correspondent au projet Supabase utilisé pour l’authentification staff

## Scripts npm

| Commande         | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `npm run dev`    | Démarre Vite en mode développement (http://localhost:5173) |
| `npm run build`  | Génère la version de production (`dist/`)                  |
| `npm run preview`| Prévisualise la build de prod                              |
| `npm run lint`   | Vérifie le code avec ESLint                                |

## Architecture

```
src/
  components/          // Composants transverses (CTA newsletter…)
  hooks/               // Hooks personnalisés (ex. profil staff)
  pages/               // Pages publiques et dashboard
  providers/           // Contexte Auth Supabase
  services/            // Clients API REST et Supabase
  utils/               // Lecture des variables d’environnement
```

Tailwind est configuré via `tailwind.config.js` et `postcss.config.cjs`. Les fontes Inter et Playfair Display sont chargées dans `index.html`.

## Points d’intégration backend

- **Public**
  - `GET /api/public/services` : catalogue des rituels
  - `GET /api/public/services/:slug/availability` : slots disponibles (42 jours glissants côté API)
  - `POST /api/public/bookings` : création d’une demande de réservation
  - `POST /api/public/newsletter` : inscription newsletter
- **Administratif (JWT Supabase requis)**
  - `GET /api/admin/bookings` : liste et filtrage des réservations
  - `PATCH /api/admin/bookings/:id` : mise à jour statut/horaires/notes
- **Supabase (côté navigateur)**
  - Auth email + mot de passe (`supabase.auth`)
  - Tables `salon.staff`, `salon.availability_blocks`, `salon.services` pour la gestion interne (RLS à adapter si nécessaire)

## Limitations connues

- Les actions de création/édition/suppression de services reposent sur les politiques RLS Supabase. Si les droits ne sont pas accordés aux membres du staff, ces opérations renverront une erreur « Not authorized ».
- Les créneaux disponibles affichent un horizon de 21 jours côté frontend pour offrir une UX légère ; l’API reste maîtresse de la validation lors de la création de réservation.

## Déploiement

1. Construire via `npm run build`
2. Servir `dist/` avec l’hébergement statique de votre choix ou via Express (`app.use(express.static(STATIC_ROOT))` déjà en place côté serveur)
3. Vérifier que les variables d’environnement sont injectées (par exemple via `.env.production`)

Bon développement 🌸
