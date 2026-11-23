import data from './reviews.json';

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

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
    'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

export const formatDate = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return m ? `${MONTHS[m - 1]} ${y}` : String(y);
};

export const fmt = (n: number, digits: number) =>
    n.toLocaleString('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits });
