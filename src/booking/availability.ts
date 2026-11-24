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

/** Notti occupate lette da public/availability.json (sincronizzato da Airbnb). */
export function useBlockedNights() {
    const [blocked, setBlocked] = useState<Date[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${import.meta.env.BASE_URL}availability.json`, { signal: controller.signal, cache: 'no-cache' })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
            .then((data: { blocked?: { from: string; to: string }[] }) => {
                const nights: Date[] = [];
                data.blocked?.forEach(({ from, to }) => {
                    const end = new Date(`${to}T00:00:00`);
                    // "to" e' il giorno di partenza: quella notte e' di nuovo libera
                    for (const d = new Date(`${from}T00:00:00`); d < end; d.setDate(d.getDate() + 1)) {
                        nights.push(new Date(d));
                    }
                });
                nights.sort((a, b) => a.getTime() - b.getTime());
                setBlocked(nights);
            })
            .catch((err) => {
                // Il calendario resta usabile: tutte le date sembrano libere e la richiesta arriva comunque
                if (err.name !== 'AbortError') console.error('Date occupate non disponibili:', err);
            })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, []);

    return { blocked, loading };
}

export type Field = 'checkIn' | 'checkOut' | 'guests';

/**
 * Quali giorni si possono cliccare.
 * - Arrivo: qualsiasi notte libera da oggi in poi.
 * - Partenza: dopo l'arrivo e fino alla prima notte occupata compresa,
 *   perche' si puo' partire la mattina in cui arriva qualcun altro.
 *   I giorni liberi prima dell'arrivo restano cliccabili: diventano il nuovo arrivo.
 */
export function useDisabledDays(from: Date | undefined, pickingCheckOut: boolean, blocked: Date[]): Matcher[] {
    return useMemo<Matcher[]>(() => {
        const past = { before: startOfToday() };
        if (pickingCheckOut && from) {
            const nextBusy = blocked.find((d) => d > from);
            if (!nextBusy) return [past, ...blocked];
            return [past, ...blocked.filter((d) => d !== nextBusy), { after: nextBusy }];
        }
        return [past, ...blocked];
    }, [blocked, from, pickingCheckOut]);
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
): { range: DateRange; next: Field } {
    const from = range?.from;
    const to = range?.to;
    // Sto scegliendo la partenza e il giorno viene dopo l'arrivo
    if (active === 'checkOut' && from && day > from) {
        return { range: { from, to: day }, next: 'guests' };
    }
    // Cambio solo l'arrivo e la partenza scelta resta valida
    if (active === 'checkIn' && to && day < to && !hasBlockedBetween(day, to, blocked)) {
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
