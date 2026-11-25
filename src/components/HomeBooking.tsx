import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import type { DateRange } from 'react-day-picker';
import BookingSearch, { type BookingSearchHandle } from './BookingSearch';
import RequestForm from './RequestForm';
import { useT } from '../i18n';
import { DEFAULT_GUESTS, useCalendar, type Guests } from '../booking/availability';
import { OPEN_DATES_EVENT, type OpenDatesState } from '../booking/openDates';
import styles from './HomeBooking.module.css';

/**
 * Barra di prenotazione nella hero della home, in tutte le lingue.
 * "Verifica" apre il modulo con i recapiti in una finestra sopra la pagina.
 */
const HomeBooking: React.FC = () => {
    const t = useT().request;
    const ts = useT().search;
    const { blocked, pricing, maxGuests, loading } = useCalendar();
    const [range, setRange] = useState<DateRange | undefined>();
    const [guests, setGuests] = useState<Guests>(DEFAULT_GUESTS);
    const [open, setOpen] = useState(false);
    const searchRef = useRef<BookingSearchHandle>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    const location = useLocation();
    const navigate = useNavigate();

    // "Prenota" / "Chiedi le date": apre il calendario della barra
    useEffect(() => {
        const openDates = () => {
            setOpen(false);
            searchRef.current?.open();
        };
        window.addEventListener(OPEN_DATES_EVENT, openDates);
        // Arrivando da un'altra pagina: aspetta che la pagina sia tornata in cima
        let id: number | undefined;
        if ((location.state as OpenDatesState | null)?.openDates) {
            navigate(location.pathname, { replace: true, state: null });
            id = window.setTimeout(openDates, 150);
        }
        return () => {
            window.removeEventListener(OPEN_DATES_EVENT, openDates);
            window.clearTimeout(id);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const complete = !!(range?.from && range.to);
    const dialogOpen = open && complete;

    const close = () => setOpen(false);

    // Esc chiude, la pagina sotto non scorre, il fuoco entra nella finestra
    useEffect(() => {
        if (!dialogOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        dialogRef.current?.focus();
        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKey);
        };
    }, [dialogOpen]);

    const edit = () => {
        setOpen(false);
        requestAnimationFrame(() => searchRef.current?.open());
    };

    const reset = () => {
        setRange(undefined);
        setGuests(DEFAULT_GUESTS);
        setOpen(false);
    };

    return (
        <div className={styles.slot}>
            <BookingSearch
                ref={searchRef}
                range={range}
                onRangeChange={setRange}
                guests={guests}
                onGuestsChange={setGuests}
                blocked={blocked}
                loading={loading}
                pricing={pricing}
                maxGuests={maxGuests}
                onSearch={() => setOpen(true)}
                hideMobileBar={dialogOpen}
            />

            {/* Nel body: dentro la hero (animata) "fixed" non coprirebbe lo schermo */}
            {dialogOpen && createPortal(
                <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && close()}>
                    <div
                        ref={dialogRef}
                        className={styles.dialog}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="hb-title"
                        tabIndex={-1}
                    >
                        <header className={styles.head}>
                            <div>
                                <p className="eyebrow">{t.eyebrow}</p>
                                <h2 id="hb-title" className={styles.title}>
                                    {t.title}
                                    <em>{t.titleAccent}</em>
                                </h2>
                                <p className={styles.subtitle}>{t.subtitle}</p>
                            </div>
                            <button type="button" className={styles.close} onClick={close} aria-label={ts.close}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                    <path d="M6 6l12 12M18 6L6 18" />
                                </svg>
                            </button>
                        </header>
                        <RequestForm from={range!.from!} to={range!.to!} guests={guests} pricing={pricing} onEdit={edit} onReset={reset} />
                    </div>
                </div>,
                document.body,
            )}
        </div>
    );
};

export default HomeBooking;
