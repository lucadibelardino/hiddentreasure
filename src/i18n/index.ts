import { useLocation } from 'react-router-dom';
import { langFromPath, LOCALES, type Lang } from './langs';
import { STRINGS, type Dict } from './strings';

export * from './langs';
export { STRINGS, type Dict } from './strings';

/** Lingua della pagina corrente, letta dall'indirizzo (/en/..., /de/..., /fr/...). */
export function useLang(): Lang {
    return langFromPath(useLocation().pathname);
}

/** Testi dell'interfaccia nella lingua della pagina corrente. */
export function useT(): Dict {
    return STRINGS[useLang()];
}

/** Numero con decimali fissi, nel formato della lingua (4,91 / 4.91). */
export const formatNumber = (n: number, digits: number, lang: Lang) =>
    n.toLocaleString(LOCALES[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** "2026-08" -> "agosto 2026" / "August 2026" / "août 2026". */
export const formatMonth = (ym: string, lang: Lang) => {
    const [y, m] = ym.split('-').map(Number);
    if (!m) return String(y);
    return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString(LOCALES[lang], {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
};
