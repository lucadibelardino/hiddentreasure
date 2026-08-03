import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { it } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import styles from './BookingBar.module.css';

/** Formato di public/availability.json, generato dal workflow di sincronizzazione. */
interface Availability {
    updatedAt: string;
    blocked: { from: string; to: string }[];
}

const BookingBar: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [blockedDates, setBlockedDates] = useState<Date[]>([]);
    const [loading, setLoading] = useState(true);
    const dialogRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [twoMonths, setTwoMonths] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 820px)');
        const update = () => setTwoMonths(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadAvailability = async () => {
            try {
                const url = `${import.meta.env.BASE_URL}availability.json`;
                const response = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
                if (!response.ok) throw new Error(`Risposta ${response.status}`);

                const data: Availability = await response.json();
                const dates: Date[] = [];

                data.blocked?.forEach(({ from, to }) => {
                    const start = new Date(`${from}T00:00:00`);
                    const end = new Date(`${to}T00:00:00`);
                    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
                    // "to" e' il giorno di partenza: la casa torna libera,
                    // quindi l'estremo finale e' escluso.
                    for (const dt = new Date(start); dt < end; dt.setDate(dt.getDate() + 1)) {
                        dates.push(new Date(dt));
                    }
                });

                setBlockedDates(dates);
            } catch (err) {
                if ((err as Error).name === 'AbortError') return;
                // Il calendario resta consultabile: mostra tutte le date come libere
                // e la richiesta passa comunque da noi.
                console.error('Impossibile leggere le date occupate:', err);
            } finally {
                setLoading(false);
            }
        };

        loadAvailability();
        return () => controller.abort();
    }, []);

    // Esc chiude, blocco dello scroll, fuoco che torna al pulsante
    useEffect(() => {
        if (!isOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', onKey);
        dialogRef.current?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKey);
        };
    }, [isOpen]);

    const close = () => {
        setIsOpen(false);
        triggerRef.current?.focus();
    };

    return (
        <>
            <div className={styles.bar}>
                <button
                    ref={triggerRef}
                    className={styles.availability}
                    onClick={() => setIsOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="16" rx="2" />
                        <path d="M3 10h18M8 3v4M16 3v4" />
                    </svg>
                    <span className={styles.availabilityText}>
                        <span className={styles.availabilityLabel}>Calendario</span>
                        <span className={styles.availabilityValue}>Vedi le date libere</span>
                    </span>
                </button>

                <span className={styles.divider} aria-hidden="true" />

                <button className={styles.cta} onClick={() => navigate('/contatti')}>
                    Richiedi il preventivo
                </button>
            </div>

            {isOpen && (
                <div className={styles.overlay} onClick={close}>
                    <div
                        ref={dialogRef}
                        className={styles.dialog}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Calendario delle disponibilita"
                        tabIndex={-1}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className={styles.dialogHeader}>
                            <div>
                                <p className={styles.dialogEyebrow}>Disponibilita</p>
                                <h2 className={styles.dialogTitle}>Quando vuoi venire?</h2>
                            </div>
                            <button className={styles.iconClose} onClick={close} aria-label="Chiudi il calendario">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </header>

                        <div className={styles.calendarWrap}>
                            {loading ? (
                                <p className={styles.loading}>Carico il calendario…</p>
                            ) : (
                                <DayPicker
                                    mode="single"
                                    locale={it}
                                    numberOfMonths={twoMonths ? 2 : 1}
                                    showOutsideDays={false}
                                    disabled={[{ before: new Date() }, ...blockedDates]}
                                    className={styles.calendar}
                                />
                            )}
                        </div>

                        <footer className={styles.dialogFooter}>
                            <ul className={styles.legend}>
                                <li><span className={`${styles.dot} ${styles.dotFree}`} />Libero</li>
                                <li><span className={`${styles.dot} ${styles.dotBusy}`} />Occupato</li>
                            </ul>
                            <button className={styles.footerCta} onClick={() => { setIsOpen(false); navigate('/contatti'); }}>
                                Richiedi queste date
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
};

export default BookingBar;
