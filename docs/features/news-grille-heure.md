# News réduites en grille, onglet « news » du menu, heure de publication

> **Statut** : DONE (captures desktop OK, téléphone réel non vérifié) · **Livré** : 2026-11-02, grille corrigée 2026-11-19 · **Commits** : `0b453c9` (base `60ba19b`), puis `e5013c0` et `26b536e` (base `399c308`)

Complète [news-particules.md](news-particules.md) (qui décrit encore « le plus récent seulement » : le menu liste désormais toutes les news publiées depuis `60ba19b`).

## Ce que ça fait
Sur `/menu`, sous le pli, la news la plus récente et celles cochées « Garder en grand » restent affichées en entier ; les autres sont réduites en vignettes (image, date, titre, extrait) qui s'ouvrent au clic. Un onglet « news » du menu pointe sur `/menu#news`. Vania peut saisir une heure de publication pour classer deux news du même jour.

## Comment ça marche
1. **Schéma** (`src/content.config.ts`, collection `articles`) : `date` = chaîne `AAAA-MM-JJ` ou `AAAA-MM-JJTHH:mm` (regex, heure facultative) ; nouveau `enGrand: boolean` (défaut `false`).
2. **Tri** (`menu.astro`) : `date` décroissante en `localeCompare` sur la chaîne complète, puis `enGrand` d'abord à date égale.
3. **Partition** : `grandes` = index 0 + toutes celles avec `enGrand` ; `petites` = le reste.
4. **Rendu** : `grandes` en `<article>` complets ; `petites` dans `div.petites` (grille CSS à colonnes fixes : 3, 2 sous 720px, 1 sous 440px), chacune un `<details class="petite">`. Le `<summary>` porte miniature (variante `thumb` 700px), date, `h3` et `.extrait` (corps HTML débarrassé de ses balises par regex, espaces réduits, trimé, clampé à 3 lignes). Ouverte, la vignette prend toute la ligne (`grid-column: 1 / -1`), masque miniature/extrait, affiche date + « fermer × » sur la première ligne, puis titre, image et corps.
   - **Pagination côté client** : `PAR_PAGE = 6`. Les vignettes d'index ≥ 6 portent `data-suite` et sont `display:none` tant que `.petites` n'a pas la classe `tout`. Le bouton « anciennes news (n) » (`.voir-plus`, `onclick` inline) ajoute `tout` puis se supprime. Aucun changement CMS.
5. **Date affichée** : `dateFr()` ne garde que `slice(0, 10)` ; l'heure n'est jamais affichée, elle ne sert qu'au tri (et à `datetime=` de `<time>`).
6. **Menu** : `Header.astro`, `secondary` = `news` (`/menu#news`), `contact`, `bio`.
7. **CMS** (`public/admin/config.yml`) : widget `datetime` avec `time_format: "HH:mm"` et `format: "YYYY-MM-DDTHH:mm"` ; case booléenne `enGrand`.

## Carte du code
> Mise à jour : 2026-11-19

| Fichier | Rôle |
|---|---|
| `src/pages/menu.astro` | Tri, partition grandes/petites, `<details>`, pagination `PAR_PAGE`, styles de la grille |
| `tools/build-images.mjs` | `thumb: true` sur l'image des articles : génère la vignette 700px |
| `package-lock.json` | Resynchronisé (`e5013c0`) : `npm ci` échouait avant |
| `src/content.config.ts` | Schéma `articles` : `date` avec heure facultative, `enGrand` |
| `src/components/Header.astro` | Entrée « news » du menu secondaire |
| `public/admin/config.yml` | Champs CMS date+heure et « Garder en grand » |
| `content/articles/2026-10-26-*.json` (Radio Bascule, Bongo Joe) | Deux news du 26/10 avec heure et `enGrand: true` |

### Décisions clés
- Heure dans la chaîne `date` plutôt qu'un champ séparé — un seul champ de tri, anciennes news valides sans migration (détail daté → DECISIONS.md)
- `enGrand` pour garder une news en grand malgré l'âge, la plus récente l'étant toujours

## Comment débuguer
- **Par où entrer** : le `<style>` de `menu.astro` pour tout souci d'affichage ; frontmatter de `menu.astro` (`articles`, `grandes`, `petites`).
- **Ce qu'on observe** : `dist/menu.html` après `npm run build` : `article` = en grand, `details.petite` = réduites.
- **Pannes connues** : build en échec sur `date` → format hors `AAAA-MM-JJ[THH:mm]` (ex. secondes, fuseau) ; une news attendue en grand est réduite → ni la plus récente ni `enGrand`.
- **Pièges** : `.petite-image` doit garder `height: auto` : sans lui, l'attribut `height` HTML (taille réelle du fichier) bat `aspect-ratio` et les vignettes s'étirent (cause du bug corrigé en `26b536e`) · tri par chaîne, donc à jour égal une date sans heure passe **après** une date avec heure (le préfixe court est plus petit, ordre décroissant) · l'extrait retire les balises sans décoder les entités HTML (`&amp;` peut s'afficher tel quel).

## Configuration
Aucune variable d'env. Champs CMS `date` et `enGrand` dans `public/admin/config.yml`.

## Tests et vérifications
| Vérif | Commande | Résultat réel |
|---|---|---|
| Tests | `npm test` | 36/36 (rapporté, non relancé) |
| Build | `npm run build` | OK (rapporté, non relancé) |
| Rendu grille fermée / ouverte / bouton, 1280px | Chrome headless (captures) | OK (rapporté) |
| Rendu sur téléphone réel, breakpoints 720/440px | appareil | non vérifié |
| Affichage par Sveltia d'une ancienne date sans heure avec le nouveau `format` | CMS | non vérifié |

## Limites et dettes
- Les heures `12:00` (Radio Bascule) et `11:00` (Bongo Joe) sont arbitraires : posées pour placer Bascule en tête à la demande de Vania, pas des heures réelles de publication.
- Les deux news du 26/10 sont `enGrand: true` : seule l'une est « la plus récente », l'autre reste grande par le drapeau.
- Risque non levé : Sveltia peut mal lire/réécrire une ancienne date sans heure avec le format `YYYY-MM-DDTHH:mm`.
- Sans JavaScript, les vignettes au-delà de 6 restent cachées et le bouton ne fait rien : seules les 6 plus récentes sont accessibles.
- Pagination purement visuelle : tout le HTML des anciennes news reste dans la page.
- Aucun test automatisé sur le tri ni la partition.
