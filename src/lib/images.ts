/* Lecture du manifeste écrit par tools/build-images.mjs : chemin du CMS → { src, w, h, thumb? }. */
import manifest from "../generated/images.json";
import { asset, swapImageSrcs } from "./content";

export type Img = { src: string; w: number; h: number; thumb?: string };

const entries = manifest as Record<string, Img>;
// Même normalisation que `clean` de build-images.mjs
const clean = (p: string) => p.trim().replace(/^\/+/, "");

/* Dimensions + src absolue, ou null si l'image n'est pas au manifeste (introuvable au build). */
export function image(path: string): Img | null {
  const e = entries[clean(path)];
  return e ? { ...e, src: asset(e.src), ...(e.thumb ? { thumb: asset(e.thumb) } : {}) } : null;
}

// Src d'affichage : la variante réduite du manifeste, sinon le fichier du CMS tel quel.
export const imageSrc = (path: string): string => image(path)?.src ?? asset(path);

// Vignette d'un film Kinematik : celle du CMS, sinon `assets/kinematik/{id}.jpg`.
export const kinematikImage = (film: { id: string; vignette?: string }) =>
  image(film.vignette || `assets/kinematik/${film.id}.jpg`);

// Images collées dans un texte Markdown : `src="/assets/x.jpg"` → variante réduite du manifeste, comme l'ancien build,
// plus ses dimensions (la page ne saute plus quand l'image arrive ; `.vjm-prose img` a `height: auto`).
const bySrc = new Map(Object.values(entries).map((e) => [asset(e.src), e]));
export const withImageVariants = (html: string): string =>
  swapImageSrcs(html, (src) => entries[clean(src)]?.src).replace(/<img (?![^>]*\bwidth=)[^>]*?src="([^"]+)"/g, (tag, src: string) => {
    const e = bySrc.get(src);
    return e ? `${tag} width="${e.w}" height="${e.h}"` : tag;
  });
