/**
 * Titolo e descrizione di ogni pagina. Usati sia dal prerender (HTML statico
 * letto da Google e dalle anteprime social) sia dal browser al cambio pagina.
 */
export const SITE_URL = 'https://hiddentreasurevillasimius.com';

export interface PageMeta {
    path: string;
    title: string;
    description: string;
}

export const PAGES: PageMeta[] = [
    {
        path: '/',
        title: 'Hidden Treasure | Villa sul Mare a Villasimius, Sardegna',
        description:
            'Villa in affitto a Villasimius con il giardino che finisce sulla spiaggia. Terrazza con vista a 270°, spiaggia semiprivata, 4-6 posti letto. Prenota diretto e risparmia.',
    },
    {
        path: '/gallery',
        title: 'Foto della villa | Hidden Treasure Villasimius',
        description:
            'Le fotografie della villa Hidden Treasure a Villasimius: terrazza panoramica, giardino sulla spiaggia, interni, camere e il mare del sud Sardegna.',
    },
    {
        path: '/recensioni',
        title: 'Recensioni degli ospiti | Hidden Treasure Villasimius',
        description:
            'Cosa dicono gli ospiti della villa Hidden Treasure a Villasimius: 4,91 su Airbnb e 5,0 su Google. Leggi le recensioni vere di chi ci ha soggiornato.',
    },
    {
        path: '/contatti',
        title: 'Contatti e prenotazioni | Hidden Treasure Villasimius',
        description:
            'Prenota direttamente la villa Hidden Treasure a Villasimius: scrivici su WhatsApp, chiamaci o mandaci una email. Ti rispondiamo noi, senza intermediari.',
    },
];

export const NOT_FOUND: PageMeta = {
    path: '/404',
    title: 'Pagina non trovata | Hidden Treasure Villasimius',
    description: 'Questa pagina non esiste. Torna alla home della villa Hidden Treasure a Villasimius.',
};

export function metaFor(pathname: string): PageMeta {
    const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
    return PAGES.find((p) => p.path === clean) ?? NOT_FOUND;
}

export function canonicalUrl(path: string): string {
    return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}
