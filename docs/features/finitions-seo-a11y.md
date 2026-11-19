# Finitions SEO et accessibilité (suite d'audit)

> **Statut** : DONE · **Livré** : 2026-11-19 · **Commits** : `5596935..ea5ba1f` (base `36e8cb7`)

## Ce que ça fait
Règle les dettes SEO et accessibilité laissées par [perf-pages.md](perf-pages.md) : chaque page indexable a sa propre meta description et un h1, le lecteur audio se pilote au clavier, les images collées dans le Markdown ne font plus sauter la page. Les visiteurs au clavier ou au lecteur d'écran et les moteurs de recherche en profitent.

## Comment ça marche
- **Lecteur audio** (`src/islands/AudioPlayer.jsx`) : chaque ligne d'épisode est un `<button type="button">` avec `aria-current` (épisode courant) et `aria-label` (« En lecture » / « Écouter : titre, durée ») ; le survol est aussi déclenché par focus/blur. La barre de progression est un `role="slider"` `tabIndex=0` avec `aria-valuemin/max/now/text` ; `onKeyDown` : ←/↓ −10 s, →/↑ +10 s, Début = 0, Fin = fin, borné à `[0, track.sec]` puis `seek()`. Le clic souris reste inchangé.
- **Images de prose** (`src/lib/images.ts`, `withImageVariants`) : après le remplacement du `src` par la variante réduite, un `replace` sur les `<img>` sans `width=` retrouve l'entrée du manifeste par une `Map` inverse `src → entrée` (`bySrc`) et ajoute `width`/`height`. Tous les appelants sont sous `.vjm-prose`, qui a `height:auto` : les proportions restent justes.
- **Descriptions** : `films/index`, `lecture/index`, `kinematik/index`, `carnets/index`, `contact` ont leur propre `description`. `lecture/[id]` : `describe(extrait, contexte, corps)` retombe sur le corps du texte. `kinematik/[slug]` : si ni information ni résumé, repli généré « titre (sous-titre), film de …, année, trailer, durée » ; la même valeur alimente le JSON-LD `VideoObject`.
- **h1** : classe globale `.sr-only` (`src/styles/global.css`) ; prop `titre` de `Page.astro` qui rend `<h1 class="sr-only">`. Utilisée sur accueil, 404, bio (`BioPage.astro`) ; `kinematik/[slug].astro` met son h1 caché directement.
- **Canonical** : `carnets/[id].astro` passe `path={`/carnets/${slug}`}` à `Base` (canonical vers sa propre URL, plus vers `/carnets`).

## Carte du code
> Mise à jour : 2026-11-19

| Fichier | Rôle |
|---|---|
| `src/islands/AudioPlayer.jsx` | Lignes d'épisode en boutons, slider clavier |
| `src/lib/images.ts` | `withImageVariants` : ajoute width/height du manifeste |
| `src/components/Page.astro` | Prop `titre` → h1 `.sr-only` |
| `src/styles/global.css` | Classe `.sr-only` |
| `src/components/BioPage.astro`, `src/pages/index.astro`, `src/pages/404.astro` | h1 caché via `titre` |
| `src/pages/kinematik/[slug].astro` | Description de repli, h1 caché, JSON-LD aligné |
| `src/pages/lecture/[id].astro` | Description avec repli sur `corps` |
| `src/pages/{films,lecture,kinematik,carnets}/index.astro`, `src/pages/contact.astro` | Descriptions propres |
| `src/pages/carnets/[id].astro` | Canonical sur sa propre URL |

### Décisions clés
- h1 invisible (`.sr-only`) plutôt que titre affiché — le design n'affiche pas de titre sur ces pages (détail → DECISIONS.md)
- Description de repli générée pour les films — aucun film n'a encore information ni résumé, les 21 pages partageaient la description du site
- width/height ajoutés côté build, pas dans le CMS — le manifeste les connaît déjà

## Comment débuguer
- **Par où entrer** : `Base.astro` (description/canonical) ; `AudioPlayer.jsx` (clavier) ; `withImageVariants` (dimensions).
- **Ce qu'on observe** : sur `dist/` après build, grep des `<meta name="description">` et `<h1` ; Chrome : Tab sur un épisode puis Entrée, focus sur le slider puis flèches/Début/Fin.
- **Pannes connues** : image de prose sans dimensions → son `src` n'est pas dans le manifeste (regex ne trouve pas d'entrée) ou l'`<img>` a déjà `width=` ; description du site sur une page → champ source vide et pas de repli.
- **Pièges** : la regex d'`images.ts` suppose `src` dans le tag `<img ...>` sans `>` avant ; `bySrc` compare au `src` après `asset()`. `height:auto` de `.vjm-prose` est ce qui évite la déformation : tout nouvel appelant hors `.vjm-prose` devra le reproduire.

## Configuration
Aucune.

## Tests et vérifications
| Vérif | Commande | Résultat réel |
|---|---|---|
| Tests | `npm test` | 36/36 (rapporté, non relancé) |
| Build | `npm run build` | OK, 148 pages (rapporté, non relancé) |
| Descriptions | script sur `dist/` | plus aucun doublon sauf la description du site sur accueil et menu (voulu) (rapporté, non relancé) |
| h1 | script sur `dist/` | toutes les pages indexables en ont un ; `carnets/[id]` (noindex) n'en a pas (rapporté, non relancé) |
| Clavier | Chrome headless, `/films/chronique` | Tab+Entrée sur l'épisode 2 le lance, slider +10 s, Fin va à la fin, aucune erreur console (rapporté, non relancé) |

## Limites et dettes
- `carnets/[id]` (noindex) n'a pas de h1.
- Pas de test automatisé pour le clavier du lecteur ni pour `withImageVariants`.
- React toujours chargé partout (menu à réécrire en vanilla).
- Carnets : première rangée en lazy + opacity 0.
- Vignette `k4.jpg` noire à la source.
