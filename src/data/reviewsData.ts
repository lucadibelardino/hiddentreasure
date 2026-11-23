import data from './reviews.json';
import { DEFAULT_LANG, type Lang } from '../i18n/langs';

/* Dati e funzioni comuni alla pagina Recensioni e alla sezione in home. */

export type SourceKey = 'airbnb' | 'google';

export interface Review {
    name: string;
    from?: string;
    date: string; // AAAA-MM
    rating: number;
    source: SourceKey;
    text: string;
    translatedFrom?: string;
    reply?: string;
    /** Link diretto alla recensione, se la piattaforma lo offre (Google si') */
    url?: string;
    /** true = compare nello slider della home */
    featured?: boolean;
    /** Traduzioni per le versioni del sito in inglese, tedesco e francese */
    i18n?: Partial<Record<Exclude<Lang, 'it'>, { text?: string; reply?: string; from?: string }>>;
}

/** Testo, risposta e provenienza nella lingua della pagina (se manca la traduzione resta l'italiano). */
export function localize(r: Review, lang: Lang) {
    const tr = lang === DEFAULT_LANG ? undefined : r.i18n?.[lang as Exclude<Lang, 'it'>];
    return {
        text: tr?.text ?? r.text,
        reply: tr?.reply ?? r.reply,
        from: tr?.from ?? r.from,
        /** true = il testo mostrato e' una nostra traduzione */
        translated: Boolean(tr?.text),
    };
}

export interface Source {
    label: string;
    rating: number;
    count: number;
    url: string;
    badge?: string;
    categories?: { label: string; rating: number }[];
}

export const sources = data.sources as Record<SourceKey, Source>;
export const sourceKeys = Object.keys(sources) as SourceKey[];
export const reviews = [...(data.reviews as Review[])].sort((a, b) => b.date.localeCompare(a.date));

/* Media complessiva pesata sul numero di recensioni di ciascuna piattaforma */
export const totalCount = sourceKeys.reduce((s, k) => s + sources[k].count, 0);
export const overall = totalCount
    ? sourceKeys.reduce((s, k) => s + sources[k].rating * sources[k].count, 0) / totalCount
    : 0;

export { formatMonth as formatDate, formatNumber as fmt } from '../i18n';
