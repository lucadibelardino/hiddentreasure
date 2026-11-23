/**
 * Lingue del sito e indirizzi di ogni pagina.
 * L'italiano e' la lingua principale e resta alla radice (/, /gallery, ...);
 * le altre lingue hanno un prefisso (/en/, /de/, /fr/) e indirizzi tradotti.
 */
export const LANGS = ['it', 'en', 'de', 'fr'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'it';

export type PageKey = 'home' | 'gallery' | 'reviews' | 'contact';
export const PAGE_KEYS: PageKey[] = ['home', 'gallery', 'reviews', 'contact'];

export const ROUTES: Record<Lang, Record<PageKey, string>> = {
    it: { home: '/', gallery: '/gallery', reviews: '/recensioni', contact: '/contatti' },
    en: { home: '/en/', gallery: '/en/gallery', reviews: '/en/reviews', contact: '/en/contact' },
    de: { home: '/de/', gallery: '/de/galerie', reviews: '/de/bewertungen', contact: '/de/kontakt' },
    fr: { home: '/fr/', gallery: '/fr/galerie', reviews: '/fr/avis', contact: '/fr/contact' },
};

/** Nome della lingua scritto nella lingua stessa (per il selettore). */
export const LANG_NAMES: Record<Lang, string> = {
    it: 'Italiano',
    en: 'English',
    de: 'Deutsch',
    fr: 'Français',
};

/** Usato per numeri, date e og:locale. */
export const LOCALES: Record<Lang, string> = { it: 'it-IT', en: 'en-GB', de: 'de-DE', fr: 'fr-FR' };
export const OG_LOCALES: Record<Lang, string> = { it: 'it_IT', en: 'en_GB', de: 'de_DE', fr: 'fr_FR' };

const clean = (pathname: string) => (pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname);

export function langFromPath(pathname: string): Lang {
    const first = pathname.split('/')[1];
    return (LANGS as readonly string[]).includes(first) && first !== DEFAULT_LANG ? (first as Lang) : DEFAULT_LANG;
}

/** Pagina corrispondente all'indirizzo, oppure null (404). */
export function pageFromPath(pathname: string): PageKey | null {
    const lang = langFromPath(pathname);
    const p = clean(pathname);
    for (const key of PAGE_KEYS) {
        if (clean(ROUTES[lang][key]) === p) return key;
    }
    return null;
}

export const pathFor = (lang: Lang, page: PageKey) => ROUTES[lang][page];
