import { useEffect, useMemo, useState } from 'react';
import type { DateRange, Matcher } from 'react-day-picker';
import { LOCALES, type Dict, type Lang } from '../i18n';

/** Massimo di ospiti (adulti + bambini), confermato da Luca. I neonati non contano. */
export const MAX_GUESTS = 6;

export interface Guests {
    adults: number;
    children: number;
    infants: number;
}

export const DEFAULT_GUESTS: Guests = { adults: 2, children: 0, infants: 0 };

/** Data locale -> "2027-07-15" (senza passare da UTC, che sposterebbe il giorno). */
export const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

export const nightsBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000);

/** "dom 10 gen" -> "Dom 10 gen" */
export const formatDay = (d: Date, lang: Lang) => {
    const s = d.toLocaleDateString(LOCALES[lang], { weekday: 'short', day: 'numeric', month: 'short' });
    return s.charAt(0).toUpperCase() + s.slice(1);
};

/** "10 gen" senza giorno della settimana, per gli spazi stretti. */
export const formatDayShort = (d: Date, lang: Lang) =>
    d.toLocaleDateString(LOCALES[lang], { day: 'numeric', month: 'short' });

/** Il Worker Cloudflare: GET /calendario (prezzi, blocchi) e POST /richiesta. */
export const WORKER_URL = 'https://richieste.luca-dibelardino.workers.dev';

interface Period {
    from: string;
    to: string;
}

/** Risposta di GET /calendario (tabelle D1 stagioni, prezzi_giorno, blocchi, impostazioni). */
interface CalendarApi {
    max_ospiti?: number;
    /** Ospiti compresi nel prezzo a notte (di solito 2). */
    ospiti_inclusi?: number;
    /** Euro a notte per ogni ospite oltre quelli compresi. */
    supplemento_ospite_eur?: number;
    blocchi?: { dal: string; al: string }[];
    stagioni?: { nome: string; dal: string; al: string; prezzo_notte_eur: number; min_notti: number }[];
    prezzi_giorno?: { data: string; prezzo_notte_eur: number | null; min_notti: number | null }[];
}

export interface Pricing {
    stagioni: NonNullable<CalendarApi['stagioni']>;
    giorni: Map<string, NonNullable<CalendarApi['prezzi_giorno']>[number]>;
    /** Ospiti compresi nel prezzo a notte. */
    includedGuests: number;
    /** Euro a notte per ogni ospite in piu' (adulti + bambini, i neonati non contano). */
    extraGuestFee: number;
}

const getJSON = <T,>(url: string, signal: AbortSignal): Promise<T> =>
    fetch(url, { signal, cache: 'no-cache' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${url}: ${r.status}`))));

/** Ogni notte occupata come Date; "to" e' il giorno di partenza, quindi escluso. */
function expandNights(periods: Period[]): Date[] {
    const seen = new Set<string>();
    const nights: Date[] = [];
    for (const { from, to } of periods) {
        const end = new Date(`${to}T00:00:00`);
        for (const d = new Date(`${from}T00:00:00`); d < end; d.setDate(d.getDate() + 1)) {
            const key = toISO(d);
            if (seen.has(key)) continue;
            seen.add(key);
            nights.push(new Date(d));
        }
    }
    return nights.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Calendario del sito, tutto dal Worker: notti occupate (Airbnb sincronizzato ogni ora,
 * blocchi e sblocchi fatti da Luca nella gestione), prezzi, notti minime e massimo ospiti.
 * availability.json non si usa piu' qui: avrebbe richiuso le notti che Luca sblocca.
 */
export function useCalendar() {
    const [blocked, setBlocked] = useState<Date[]>([]);
    const [pricing, setPricing] = useState<Pricing | null>(null);
    const [maxGuests, setMaxGuests] = useState(MAX_GUESTS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;
        getJSON<CalendarApi>(`${WORKER_URL}/calendario`, signal)
            .then((data) => {
                setBlocked(expandNights((data.blocchi ?? []).map((b) => ({ from: b.dal, to: b.al }))));
                setPricing({
                    stagioni: data.stagioni ?? [],
                    giorni: new Map((data.prezzi_giorno ?? []).map((g) => [g.data, g])),
                    includedGuests: data.ospiti_inclusi ?? 2,
                    extraGuestFee: data.supplemento_ospite_eur ?? 0,
                });
                if (data.max_ospiti && data.max_ospiti > 0) setMaxGuests(data.max_ospiti);
            })
            .catch((e) => {
                if (!signal.aborted) console.error('Calendario Cloudflare non disponibile:', e);
            })
            .finally(() => {
                if (!signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, []);

    return { blocked, pricing, maxGuests, loading };
}

/** Prezzo e notti minime di una notte: l'eccezione del giorno vince sulla stagione. */
function nightRule(iso: string, pricing: Pricing) {
    const day = pricing.giorni.get(iso);
    const season = pricing.stagioni.find((s) => s.dal <= iso && iso <= s.al);
    return {
        price: day?.prezzo_notte_eur ?? season?.prezzo_notte_eur ?? null,
        minNights: day?.min_notti ?? season?.min_notti ?? 1,
    };
}

/**
 * Notti minime di un soggiorno: vale il minimo piu' alto tra le notti che comprende
 * (scelta di Luca: se Ferragosto vuole 7 notti, ogni soggiorno che lo include dura almeno 7 notti).
 */
function stayMinNights(from: Date, to: Date, pricing: Pricing) {
    let min = 1;
    for (const d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
        min = Math.max(min, nightRule(toISO(d), pricing).minNights);
    }
    return min;
}

/** Il soggiorno rispetta le notti minime di tutte le sue notti? */
export const isLongEnough = (from: Date, to: Date, pricing: Pricing | null) =>
    !pricing || nightsBetween(from, to) >= stayMinNights(from, to, pricing);

/**
 * Il soggiorno valido piu' corto con questo arrivo, per il suggerimento "Minimo N notti".
 * Allungandolo si possono incontrare notti con un minimo piu' alto:
 * quelle partenze le disattiva il calendario.
 */
export function shortestStay(from: Date, pricing: Pricing | null): number {
    if (!pricing) return 1;
    let min = 1;
    for (let k = 1; k <= 90; k++) {
        const night = new Date(from);
        night.setDate(night.getDate() + k - 1);
        min = Math.max(min, nightRule(toISO(night), pricing).minNights);
        if (k >= min) return k;
    }
    return min;
}

/**
 * Totale delle notti, con il supplemento per gli ospiti oltre quelli compresi.
 * null se anche una sola notte non ha un prezzo: meglio nessuna cifra che una cifra sbagliata.
 */
export function quote(from: Date, to: Date, pricing: Pricing | null, guests = 0): number | null {
    if (!pricing) return null;
    const extra = Math.max(0, guests - pricing.includedGuests) * pricing.extraGuestFee;
    let total = 0;
    for (const d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
        const { price } = nightRule(toISO(d), pricing);
        if (price == null) return null;
        total += price + extra;
    }
    return total;
}

export const formatEuro = (n: number, lang: Lang) =>
    new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export type Field = 'checkIn' | 'checkOut' | 'guests';

/**
 * Quali giorni si possono cliccare.
 * - Arrivo: qualsiasi notte libera da oggi in poi.
 * - Partenza: dopo l'arrivo e fino alla prima notte occupata compresa,
 *   perche' si puo' partire la mattina in cui arriva qualcun altro.
 *   I giorni liberi prima dell'arrivo restano cliccabili: diventano il nuovo arrivo.
 */
export function useDisabledDays(
    from: Date | undefined,
    pickingCheckOut: boolean,
    blocked: Date[],
    longEnough: (from: Date, to: Date) => boolean = () => true,
): Matcher[] {
    return useMemo<Matcher[]>(() => {
        const past = { before: startOfToday() };
        if (pickingCheckOut && from) {
            const nextBusy = blocked.find((d) => d > from);
            // Notti minime: le partenze che danno un soggiorno troppo corto non si possono scegliere
            const tooShort: Matcher[] = [(d: Date) => d > from && !longEnough(from, d)];
            if (!nextBusy) return [past, ...blocked, ...tooShort];
            return [past, ...blocked.filter((d) => d !== nextBusy), { after: nextBusy }, ...tooShort];
        }
        return [past, ...blocked];
    }, [blocked, from, pickingCheckOut, longEnough]);
}

/** C'e' almeno una notte occupata tra arrivo (compreso) e partenza (esclusa)? */
const hasBlockedBetween = (from: Date, to: Date, blocked: Date[]) => blocked.some((d) => d >= from && d < to);

/**
 * Cosa succede cliccando un giorno, come su Airbnb.
 * Restituisce le nuove date e il campo da attivare dopo.
 */
export function pickDay(
    day: Date,
    range: DateRange | undefined,
    active: Field | null,
    blocked: Date[],
    longEnough: (from: Date, to: Date) => boolean = () => true,
): { range: DateRange; next: Field } {
    const from = range?.from;
    const to = range?.to;
    // Sto scegliendo la partenza e il giorno viene dopo l'arrivo
    // (i giorni sotto le notti minime sono gia' disattivati nel calendario)
    if (active === 'checkOut' && from && day > from) {
        return { range: { from, to: day }, next: 'guests' };
    }
    // Cambio solo l'arrivo e la partenza scelta resta valida
    if (active === 'checkIn' && to && day < to && !hasBlockedBetween(day, to, blocked)
        && longEnough(day, to)) {
        return { range: { from: day, to }, next: 'checkOut' };
    }
    // Altrimenti si riparte: nuovo arrivo, poi la partenza
    return { range: { from: day, to: undefined }, next: 'checkOut' };
}

export const totalGuests = (g: Guests) => g.adults + g.children;

/** "2 ospiti, 1 neonato" */
export function guestsLabel(g: Guests, t: Dict['search']) {
    const parts = [t.guestsCount(totalGuests(g))];
    if (g.infants > 0) parts.push(t.infantsCount(g.infants));
    return parts.join(', ');
}
