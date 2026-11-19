# Perf des pages (suite d'audit)

> **Statut** : DONE · **Livré** : 2026-11-19 · **Commits** : `b95e6ce..7132129` (base `0226dbe`)

## Ce que ça fait
Réduit le poids et le délai d'affichage des pages publiques : accueil, bio, grille Kinematik, carnets, en-tête. Le visiteur télécharge une seule photo d'accueil, un seul portrait, des vignettes légères, et le menu s'hydrate au repos du navigateur.

## Comment ça marche
- **Accueil** (`src/pages/index.astro`) : le `<a id="accueil">` porte `data-photos` (liste JSON des paysages, sinon toutes les photos) et aucun `background-image`. Un `<script is:inline data-astro-rerun>` juste après tire une photo au hasard et pose `style.backgroundImage` avant le premier rendu. Sans JS : `<noscript><style>` applique la première photo.
- **Bio** (`src/components/BioPage.astro`) : `<img id="bio-portrait">` sans `src`, avec `fetchpriority="high"`, `width/height`, `data-portraits`. Un script inline `data-astro-rerun` pose `src` au hasard. `<noscript><img>` avec le premier portrait. Plus de `loading="lazy"`. L'icône œil a `width/height` 46.
- **Kinematik** (`src/pages/kinematik/index.astro`) : `tools/build-images.mjs` (`resolveImages`) demande `thumb: true` pour `film.vignette` ; la grille sert `img.thumb ?? img.src` (vignette 700px, suffixe `-t.jpg`). Les 3 premières (`i < 3`) chargent immédiatement, les autres `lazy`, `decoding="async"`. Environ 477 Ko au lieu de 1,47 Mo.
- **Carnets** (`src/pages/carnets/index.astro`) : un lien sans titre reçoit `aria-label="Carnet {slug avec espaces}"` au lieu du slug brut.
- **Header** (`src/components/Header.astro`) : `MenuDropdown` en `client:idle` ; logo `nom-manuscrit.png` avec `width=1200 height=225`.

## Carte du code
> Mise à jour : 2026-11-19

| Fichier | Rôle |
|---|---|
| `src/pages/index.astro` | Accueil : tirage de la photo par script inline, repli noscript |
| `src/components/BioPage.astro` | Bio : portrait tiré par script inline, fetchpriority high |
| `src/pages/kinematik/index.astro` | Grille : vignettes, chargement immédiat des 3 premières |
| `tools/build-images.mjs` | Génère la vignette `-t.jpg` des films Kinematik (`thumb: true`) |
| `src/pages/carnets/index.astro` | aria-label lisible des liens sans titre |
| `src/components/Header.astro` | `client:idle` du menu, dimensions du logo |

### Décisions clés
- Tirage aléatoire avant le premier rendu, sans `src` dans le HTML — évite le double téléchargement (détail → DECISIONS.md)
- `client:idle` pour le menu — le menu n'est pas nécessaire avant l'idle
- Vignettes 700px pour la grille Kinematik

## Comment débuguer
- **Par où entrer** : les scripts inline de `index.astro` et `BioPage.astro`.
- **Ce qu'on observe** : onglet Réseau (une seule image d'accueil, un seul portrait ; vignettes `-t.jpg` sur `/kinematik`), console sans erreur. Tester sur `npm run build && npm run preview`.
- **Pannes connues** : photo/portrait absent → JSON `data-photos`/`data-portraits` vide ou invalide (le `try/catch` avale l'erreur, aucun message). Menu sans réaction juste après le chargement → hydratation `idle` pas encore passée.
- **Pièges** : le script doit rester après l'élément ciblé (il lit le DOM au moment de s'exécuter) ; `data-astro-rerun` fait qu'il se relance à chaque navigation. Le portrait n'a pas de `src` sans JS hors `<noscript>`.

## Configuration
Aucune. Les vignettes sont générées au build (`npm run build`).

## Tests et vérifications
| Vérif | Commande | Résultat réel |
|---|---|---|
| Tests | `npm test` | 36/36 (rapporté, non relancé) |
| Build | `npm run build` | OK (rapporté, non relancé) |
| Navigateur | Chrome headless sur `astro preview` | accueil 1 photo, bio 1 portrait, menu ≡ s'ouvre après idle, kinematik en `-t.jpg`, aucune erreur console (rapporté, non relancé) |

## Limites et dettes
- Descriptions dupliquées, h1, clavier du lecteur audio, dimensions des images de prose et canonical de `carnets/[id]` : réglés, voir [finitions-seo-a11y.md](finitions-seo-a11y.md).
- React reste chargé partout : le menu est à réécrire en vanilla pour le retirer.
- Carnets : première rangée en lazy + opacity 0 (colonnes CSS, pas d'index fiable de la première rangée).
- Vignette `k4.jpg` (Carte Postale de Montevidéo #1) entièrement noire à la source.
- Sans JS, le portrait vient du seul `<noscript>` (premier portrait, pas d'aléa).
