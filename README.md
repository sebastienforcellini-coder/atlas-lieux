# Atlas — Répertoire de lieux

Application web pour répertorier, classer et partager des lieux (restaurants, hôtels, musées, plages…).

**Stack identique à riad-vision** : Next.js 14 · TypeScript · Supabase · next-pwa · Vercel

---

## Structure du projet

```
atlas-lieux/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (fonts DM Sans + Fraunces)
│   │   ├── page.tsx            # Page principale (router + état global)
│   │   └── globals.css         # Styles globaux (même palette que riad-vision)
│   ├── components/
│   │   ├── Sidebar.tsx         # Sidebar fixe desktop + drawer mobile
│   │   ├── UI.tsx              # Stars, Lightbox, Toast, ConfirmModal…
│   │   └── views/
│   │       ├── Home.tsx        # Accueil — Pays / Villes / Récents
│   │       ├── AllLieux.tsx    # Tous les lieux + recherche full-text
│   │       ├── CountryCityViews.tsx  # Drill-down pays → ville
│   │       ├── Detail.tsx      # Fiche détail (photos, GPS, vidéos, commentaires)
│   │       └── LieuForm.tsx    # Formulaire création / modification
│   ├── lib/
│   │   ├── supabase.ts         # Client Supabase
│   │   └── useLieux.ts         # Hook CRUD (fetch, add, update, delete)
│   └── types/
│       └── index.ts            # Types TypeScript (Lieu, Comment, View…)
├── public/
│   └── manifest.json           # PWA manifest
├── supabase-schema.sql         # Schema SQL à coller dans Supabase
├── .env.example                # Variables d'env à copier
└── vercel.json
```

---

## 1. Supabase — Créer la table

1. Aller sur [supabase.com](https://supabase.com) → ton projet (ou nouveau)
2. **SQL Editor** → **New query**
3. Coller le contenu de `supabase-schema.sql` → **Run**
4. La table `lieux` est créée avec tous les index et politiques RLS

---

## 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Remplir `.env.local` avec les clés de ton projet Supabase
(**Settings** → **API** dans la console Supabase) :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Installation locale

```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## 4. Déploiement Vercel

```bash
# Pousser sur GitHub
git init
git add .
git commit -m "init atlas-lieux"
git remote add origin https://github.com/sebastienforcellini-coder/atlas-lieux.git
git push -u origin main
```

Puis sur **vercel.com** :
1. **New Project** → importer `atlas-lieux`
2. **Settings** → **Environment Variables** → ajouter `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy** → dispo sur `atlas-lieux.vercel.app`

---

## Fonctionnalités

| Feature | Détail |
|---|---|
| 🗺 Navigation | Accueil → Pays → Ville → Fiche |
| 🔍 Recherche | Full-text sur nom, ville, pays, tags |
| 📸 Photos | Galerie avec lightbox + navigation clavier |
| 🎥 Vidéos | YouTube intégré (iframe) |
| 📍 GPS | Coordonnées + lien Google Maps |
| ⭐ Note | 1 à 5 étoiles |
| 🏷 Tags | Tags libres |
| 💬 Commentaires | Horodatés, supprimables |
| 📋 Partage | Copie fiche dans le presse-papier |
| 📱 PWA | Installable sur mobile |
| 🌐 Supabase | Données partagées multi-utilisateurs |
