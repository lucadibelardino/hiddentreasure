/**
 * Titolo, descrizione e indirizzo di ogni pagina in ogni lingua. Usati sia dal
 * prerender (HTML statico letto da Google e dalle anteprime social) sia dal
 * browser al cambio pagina. I testi stanno in src/i18n/strings.ts (chiave "meta").
 */
import { LANGS, PAGE_KEYS, ROUTES, DEFAULT_LANG, langFromPath, pageFromPath, type Lang, type PageKey } from '../i18n/langs';
import { STRINGS } from '../i18n/strings';

export const SITE_URL = 'https://hiddentreasurevillasimius.com';

export interface PageMeta {
    lang: Lang;
    /** null = pagina 404 */
    page: PageKey | null;
    path: string;
    title: string;
    description: string;
}

const metaOf = (lang: Lang, page: PageKey): PageMeta => ({
    lang,
    page,
    path: ROUTES[lang][page],
    ...STRINGS[lang].meta[page],
});

/** Tutte le pagine indicizzabili: ogni pagina in ogni lingua. */
export const PAGES: PageMeta[] = LANGS.flatMap((lang) => PAGE_KEYS.map((page) => metaOf(lang, page)));

export const notFoundMeta = (lang: Lang): PageMeta => ({
    lang,
    page: null,
    path: '/404',
    ...STRINGS[lang].meta.notFound,
});

export const NOT_FOUND = notFoundMeta(DEFAULT_LANG);

export function metaFor(pathname: string): PageMeta {
    const lang = langFromPath(pathname);
    const page = pageFromPath(pathname);
    return page ? metaOf(lang, page) : notFoundMeta(lang);
}

export const canonicalUrl = (path: string) => `${SITE_URL}${path}`;

/** Le versioni linguistiche di una pagina, per i link hreflang (piu' x-default = italiano). */
export function alternates(page: PageKey): { hreflang: string; href: string }[] {
    return [
        ...LANGS.map((lang) => ({ hreflang: lang, href: canonicalUrl(ROUTES[lang][page]) })),
        { hreflang: 'x-default', href: canonicalUrl(ROUTES[DEFAULT_LANG][page]) },
    ];
}
