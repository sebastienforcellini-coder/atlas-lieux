# 🧭 PROJET — Atlas Lieux

> Fichier de contexte projet. À déposer dans le dossier projet pour que tout le contexte soit dispo dès le départ de chaque conversation.

---

## 1. C'est quoi

**Atlas Lieux** (« Atlas — Répertoire de lieux ») : application web personnelle de cartographie et de répertoire de lieux (restos, hôtels, boutiques, spots de voyage…), avec depuis peu un module **Sourcing déco & travaux** pour répertorier les fournisseurs/artisans (rénovation de riads à Marrakech).

Fonctions principales :
- Enregistrer des lieux avec photos, description, GPS, catégorie, contact, notes, date de visite
- Organiser par **catégories**, **pays**, **villes**
- Marquer des **favoris**
- Créer des **collections** thématiques (ex. « Marrakech ») partageables publiquement
- Partager un lieu individuel ou une collection via une page publique (sans code d'accès)
- Carte interactive de tous les lieux
- Import de lieu (via API, route `import-lieu`)
- **Module Sourcing** : mur de photos (« trouvailles ») rangé par catégorie de produit, fiches fournisseurs, partage par trouvaille (voir §10)

Esthétique : style « magazine / éditorial » — police Georgia italique, palette beige/crème (`#F5F2ED`, `#FDFCFA`, brun `#8C5A28`), coins arrondis, ombres douces.

---

## 2. Stack technique

- **Next.js 14** (App Router) + **TypeScript**
- **Supabase** : base PostgreSQL + storage (bucket `atlas/`, sous-dossiers `photos/`, `covers/` et `sourcing/`)
- **CSS inline** + `globals.css` (pas de framework CSS lourd)
- **PWA** : `manifest.json`, icônes (192/512, apple-touch-icon)
- Géocodage via `geocode.ts` (fonction `reverseGeocode(lat,lng)` → ville/adresse via Nominatim/OpenStreetMap ; PAS de sens adresse→GPS) ; import de lieu possible via API (mention d'une clé type Gemini pour parser adresse/GPS)

### Accès par code PIN
- Protection d'accès par **PIN = `2266`**
- ⚠️ Implémenté **côté client dans `page.tsx`** (composant `PinScreen`), PAS via le middleware (le middleware Next.js / cache Vercel posait problème)
- Le PIN est stocké dans `localStorage` sous la clé `atlas_pin` = `'ok'` (valable indéfiniment sur l'appareil)
- Les pages publiques `/partager/[id]`, `/collection/[slug]`, `/idee/[slug]` et `/source/[slug]` restent **accessibles sans PIN** (routes séparées)
- Pas de comptes séparés : toute personne avec le PIN (ex. la femme de Séb, qui source la déco avec lui) a accès à tout. Choix assumé : outil de couple, pas de cloisonnement.

---

## 3. Hébergement & déploiement

| Élément | Détail |
|---|---|
| **GitHub** | https://github.com/sebastienforcellini-coder/atlas-lieux (branche `main`) |
| **Vercel** | https://atlas-lieux.vercel.app (déploiement auto à chaque push sur `main`) |
| **Local PC** | `C:\Users\pc03\Documents\projects\atlas-lieux` (Windows) |
| **Local Mac** | `/Users/sebastienforcellini/Library/CloudStorage/GoogleDrive-sebastienforcellini@gmail.com/Mon Drive/SEBASTIEN/Applis Séb/atlas-lieux` |
| **Synchro** | fichiers source transportés via **Google Drive** entre PC et Mac (⚠️ migré depuis OneDrive — voir §6) |

---

## 4. Workflow git (IMPORTANT)

**Toujours `git pull origin main` AVANT de coder** (sinon conflits Mac ↔ PC).

```bash
# avant
git pull origin main

# vérifier qu'aucun parasite Library/ n'est ajouté
git status

# après — utiliser 'git add src/' plutôt que 'git add .' (exclut Library/)
git add src/
git commit -m "..."
git push origin main
```

GitHub = la vraie sauvegarde. Google Drive ne fait que transporter les fichiers source.

⚠️ **Avant de pousser un gros changement, faire `npm run build` en local** : le build de prod Vercel est plus strict que le mode dev (`npm run dev`) et peut échouer là où le dev passait (erreurs de type notamment).

`.gitignore` actuel :
```
node_modules
.next
.env.local
.env
.DS_Store
dist
Library/
```

---

## 5. Anti-veille Supabase (mis en place le 21/05/2026)

**Le plan gratuit Supabase met le projet en pause après ~1 semaine d'inactivité** → l'app affiche alors du vide (mais les données restent sauves, réactivation via « Resume project »).

Solution mise en place :
- Route **`/api/ping`** (`src/app/api/ping/route.ts`) : fait un `select('id')` sur la table `lieux` → réveille la base. Renvoie `{ok:true, pinged:...}`.
- **Cron externe** sur **cron-job.org** : appelle `https://atlas-lieux.vercel.app/api/ping` **toutes les 12h** (`0 */12 * * *`, timezone Europe/Paris). Job nommé « Atlas Lieux - keep alive ».

→ La base ne se met plus jamais en veille.

---

## 6. Pièges connus & règles d'or

### Git / fichiers
- **Email privé GitHub** : si push rejeté (`GH007`), faire :
  ```bash
  git config user.email "sebastienforcellini-coder@users.noreply.github.com"
  git commit --amend --reset-author --no-edit
  git push origin main
  ```
- **Dossier `Library/` parasite** ⚠️ (récurrent) : un chemin absolu de cloud storage (anciennement `Library/CloudStorage/OneDrive-SARLJL26/...`) avait été commité par erreur → doublonnait toute l'arbo + un bout du projet Riad-dashboard. **Le 02/06/2026, il a été SUPPRIMÉ PHYSIQUEMENT du disque** (`rm -rf Library/`) car il faisait échouer le build Vercel (il embarquait une vieille version de `page.tsx` sans les vues sourcing → erreur de type sur `Record<View, string>`). Il est gitignoré (`Library/`). S'il réapparaît physiquement (resync cloud), le re-supprimer avec `rm -rf Library/` avant tout build/commit. Toujours utiliser `git add src/` et non `git add .`.
- **Push avec crochets** : toujours mettre des quotes →
  `git add 'src/app/partager/[id]/page.tsx'`
- **Windows UTF-16** : si édition de fichier sur Windows, utiliser Python avec `encoding='utf-8'`.
- **Téléchargements depuis le chat** : peu fiables chez Séb. Si le fichier n'arrive pas, vérifier le nom `(1)` dans `~/Downloads`, ou éditer directement en terminal (Python/sed). Copier avec `cp ~/Downloads/Fichier.tsx <destination>`.

### Supabase / données
- **Colonnes en français avec accents** : beaucoup de colonnes ont des noms accentués. La table catégories s'appelle **`catégories`** (avec accent), ses colonnes sont **`identifiant`**, **`étiquette`**, **`icône`** (pas `id`/`label`/`icon`).
  - Pour vérifier les colonnes d'une table :
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'lieux'`
  - Le `select` Supabase avec colonnes accentuées **fait planter le parser TS** → utiliser `select('*')` à la place de `select('identifiant, étiquette, icône')`.
- **`useLieux.ts`** : tout nouveau champ doit être ajouté dans `normalize()` **ET** `addLieu()` **ET** `updateLieu()` — sinon il est silencieusement ignoré. (Même logique pour `useFournisseurs.ts` / `useTrouvailles.ts`.)
- **`useCategories.ts`** : `normalizeId()` normalise les accents des ids à la lecture.
- **CATEGORIES statique dans `types/index.ts`** : ⚠️ ne plus utiliser → toujours passer par `useCategories()` ou une requête Supabase directe.
- **Cache Supabase** : après un changement de schéma, lancer `NOTIFY pgrst, 'reload schema';` (sinon erreurs 404 sur les nouvelles tables/colonnes).
- **Ajout d'un champ au type** : bien le placer dans la BONNE interface (ex. mettre `tags` dans `Fournisseur`, pas dans `Lieu`). Un `grep` qui trouve le mot ne garantit pas qu'il est dans le bon bloc → le build prod le détecte.

---

## 7. Arborescence (fichiers versionnés)

```
.env.example
.gitignore
README.md
next-env.d.ts
next.config.js
package.json / package-lock.json
tsconfig.json
vercel.json
supabase-schema.sql
sql/
  sourcing-schema.sql   ← tables fournisseurs + trouvailles
  sourcing-tags.sql     ← ajout colonne tags[] aux fournisseurs
public/
  favicon.svg, logo.svg, og-logo.png
  apple-touch-icon.png, icon-192.png, icon-512.png
  manifest.json
src/
  app/
    page.tsx              ← app principale + PinScreen (PIN côté client) + state fournisseurActif
    layout.tsx
    globals.css
    api/
      import-lieu/route.ts
      ping/route.ts        ← route anti-veille
    collection/[slug]/page.tsx   ← page publique d'une collection (sans PIN)
    partager/[id]/page.tsx       ← page publique d'un lieu (sans PIN), galerie multi-photos, OG tags
    idee/[slug]/page.tsx         ← page publique d'une trouvaille (sans PIN), 3 niveaux via ?n=
    source/[slug]/page.tsx       ← page publique d'un fournisseur (sans PIN)
  components/
    Sidebar.tsx           ← navigation (exporte aussi Logo) ; bouton Sourcing (icône 🛋)
    UI.tsx                ← ConfirmModal, Toast
    views/
      Home.tsx
      AllLieux.tsx
      Categories.tsx
      Collections.tsx     ← liste + CollectionForm (+ CollectionCard avec cover)
      CountryCityViews.tsx ← exporte CountryView et CityView
      Detail.tsx          ← fiche lieu (réf. pour GpsMenu : Google Maps / Plans / Waze / Maps.me)
      Favoris.tsx
      GeoForm.tsx         ← « Ma position »
      LieuForm.tsx        ← formulaire nouveau/édition lieu
      MapView.tsx         ← carte
      Sourcing.tsx        ← mur de trouvailles 3 colonnes + ajout rapide (⚠️ ZoomModal = code mort à nettoyer)
      FournisseurDetail.tsx ← fiche fournisseur éditable inline (contacts, étiquettes, note, géoloc, suppression)
  lib/
    supabase.ts           ← client Supabase
    geocode.ts            ← reverseGeocode (GPS → ville/adresse)
    imageUtils.ts
    slug.ts               ← toSlug(name, city) — PREND 2 ARGUMENTS
    useLieux.ts           ← hook CRUD lieux (normalize/addLieu/updateLieu)
    useCategories.ts      ← hook catégories (normalizeId)
    useCollections.ts
    useFournisseurs.ts    ← hook CRUD fournisseurs (gère tags, gps, notes…)
    useTrouvailles.ts     ← hook CRUD trouvailles
    categoriesProduit.ts  ← CATEGORIES_PRODUIT (groupées), CATEGORIES_FLAT, UNITES_PRIX
    sourcingShare.ts      ← ideeUrl/sourceUrl, whatsappLink, mailtoLink, formatPrix
  types/
    index.ts              ← types Lieu, LieuInput, View, NavState, Fournisseur, Trouvaille (+ CATEGORIES statique obsolète)
```

### Vues / navigation (dans `page.tsx`)
`View` possibles : `home`, `all`, `map`, `favoris`, `collections`, `categories`, `geoform`, `country`, `city`, `detail`, `form`, **`sourcing`**, **`fournisseur`**.
⚠️ `VIEW_LABELS: Record<View, string>` dans `page.tsx` doit couvrir TOUTES les vues (sinon erreur de type au build) — y compris `sourcing` et `fournisseur`.

### Champs d'un lieu (table `lieux`)
`id`, `slug`, `name`, `description`, `city`, `country`, `categorie`, `photos[]` (1ère = principale), `gps_lat`/`gps_lng` (**string|null** pour les lieux), `tags[]`, date de visite, notes, note (étoiles), contacts : `phone`, `whatsapp`, `email`, `website`, `instagram`, `facebook`.

---

## 8. Module Sourcing déco & travaux

### Principe
Outil terrain pour sourcer fournisseurs/artisans (déco, mobilier, zellige, ferronnerie…) à Marrakech : photographier des idées + noter le prix + garder le contact. Écran principal = **mur de photos rangé par catégorie de PRODUIT** (pas par fournisseur). Clic sur une photo → fiche du fournisseur correspondant.

### Tables Supabase
- **`fournisseurs`** : `id`, `slug`, `name`, `specialite`, `city`, `address`, `gps_lat`/`gps_lng` (**number|null** — ≠ lieux qui sont string), `phone`, `whatsapp`, `email`, `website`, `instagram`, `carte_visite_url`, `notes`, **`tags text[]`** (étiquettes), `created_at`.
- **`trouvailles`** : `id`, `slug`, 1 photo (`photo_url`), 1 prix (`prix`/`devise`/`unite`), `description`, catégorie produit, `fournisseur_id` (FK, **`on delete cascade`** → supprimer un fournisseur efface ses trouvailles), `created_at`.
- RLS ouverte à `anon` (app perso derrière PIN). Slugs avec suffixe aléatoire 4 car.

### Fiche fournisseur (`FournisseurDetail.tsx`)
- **Éditable inline** : chaque champ cliquable, bouton flottant « Sauvegarder » apparaît dès modification (état `dirty`).
- Boutons contact (WhatsApp / Appeler / Email / Site / Instagram) si renseignés.
- **Étiquettes à cocher** (`tags`), 16 réparties en 4 groupes : Prix (Prix canon/Correct/Trop cher/Négociable), Contact (Parle français/Anglais OK/Arabe-darija seulement/Réactif WhatsApp), Relationnel (Super sympa/Pro/Difficile), Qualité-logistique (Belle qualité/Qualité moyenne/Livre/Sur commande/Délais longs).
- **Note libre** (textarea, champ `notes`).
- **Carte de visite** : upload photo vers `atlas/sourcing/` (input `capture="environment"` → caméra arrière sur mobile).
- **Géolocalisation** : bouton « Ma position » → capte le GPS du navigateur + `reverseGeocode` remplit ville/adresse. Affichage `📍 lat, lng → Navigation` (5 décimales, calqué sur `Detail.tsx`) qui ouvre `GpsMenu` (Google Maps / Plans Apple / Waze). URLs identiques à `Detail.tsx`.
- **Suppression** : bouton « Suppr. » sous chaque trouvaille (avec ConfirmModal) ; bouton « Supprimer ce fournisseur » visible **seulement si 0 trouvaille** (garde-fou anti-accident).

### Mur / ajout (`Sourcing.tsx`)
- Mur 3 colonnes (`repeat(3,1fr)`), vignettes carrées (`aspectRatio 1/1`), max-width ~640px.
- Clic photo → va directement à la fiche fournisseur (pas d'agrandissement ; `ZoomModal` = code mort inerte à nettoyer un jour).
- Formulaire d'ajout rapide de trouvaille : photo (caméra) + prix + catégorie + fournisseur.

### Partage (pages publiques sans PIN)
- `/idee/[slug]` (une trouvaille) — lit `?n=` : `image` (image seule), `prix` (image + prix), `tout` (image + prix + contact fournisseur).
- `/source/[slug]` (un fournisseur).
- Liens WhatsApp/mail via `sourcingShare.ts`. Termes « trouvaille »/« fournisseur » dans le code, « idee »/« source » seulement dans les URL.

---

## 9. En cours / à faire

### Reporté (à attaquer plus tard)
- **OCR carte de visite** : pré-remplir une fiche fournisseur depuis une photo de carte de visite scannée (via IA Gemini/Claude vision — Séb a déjà une clé Gemini). À coupler avec le « fix import Gemini » ci-dessous. Décision : reporté, pas prioritaire tant que le flux terrain n'a pas été éprouvé.
- **Géocodage adresse→GPS** (sens inverse de `reverseGeocode`, pas encore codé) — utile si on veut localiser un fournisseur via son adresse tapée plutôt que sur place.
- **Nettoyer le code mort `ZoomModal`** dans `Sourcing.tsx`.

### Hérité (toujours en suspens)
- **Fix import Gemini** : adresse/GPS manquants après changement de clé API.
- **RLS policies** pour la table `catégories`.
- **Tri dans le CollectionForm** : lieux non sélectionnés en haut (triés par ville dominante), sélectionnés en bas.

---

## 10. URLs de référence

- App : https://atlas-lieux.vercel.app
- Ping : https://atlas-lieux.vercel.app/api/ping
- Exemple collection publique : https://atlas-lieux.vercel.app/collection/marrakech-v93l
- Repo : https://github.com/sebastienforcellini-coder/atlas-lieux
- Cron : https://cron-job.org (job « Atlas Lieux - keep alive »)

---

*Dernière mise à jour : 2 juin 2026 — ajout du module Sourcing (tables fournisseurs/trouvailles, fiches éditables, étiquettes, note, géoloc Maps/Waze, suppression, pages publiques /idee et /source), migration OneDrive → Google Drive (nouveau chemin Mac), et suppression physique du parasite Library/ qui faisait échouer le build Vercel.*
