/**
 * "Prenota" e "Chiedi le date": portano alla barra di prenotazione della home
 * con il calendario gia' aperto, da qualunque pagina e in qualunque lingua.
 */
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES, pageFromPath, useLang } from '../i18n';

/** Evento ascoltato dalla barra quando si e' gia' in home. */
export const OPEN_DATES_EVENT = 'ht:open-dates';

/** Segnale passato con la navigazione quando si arriva da un'altra pagina. */
export interface OpenDatesState {
    openDates?: boolean;
}

export function useOpenDates() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const lang = useLang();
    return useCallback(() => {
        if (pageFromPath(pathname) === 'home') {
            window.dispatchEvent(new Event(OPEN_DATES_EVENT));
        } else {
            navigate(ROUTES[lang].home, { state: { openDates: true } satisfies OpenDatesState });
        }
    }, [navigate, pathname, lang]);
}
