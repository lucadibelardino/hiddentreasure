import React, { useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import BookingSearch, { type BookingSearchHandle } from './BookingSearch';
import RequestForm from './RequestForm';
import { useT } from '../i18n';
import { DEFAULT_GUESTS, useBlockedNights, type Guests } from '../booking/availability';
import styles from './RequestForm.module.css';

/**
 * Pagina di prova (/provabanner): barra di prenotazione in stile Airbnb,
 * poi il modulo con i recapiti. Non e' nel menu ne' nella sitemap.
 */
const RequestPage: React.FC = () => {
    const t = useT().request;
    const { blocked, loading } = useBlockedNights();
    const [range, setRange] = useState<DateRange | undefined>();
    const [guests, setGuests] = useState<Guests>(DEFAULT_GUESTS);
    const [showDetails, setShowDetails] = useState(false);
    const searchRef = useRef<BookingSearchHandle>(null);
    const detailsRef = useRef<HTMLElement>(null);

    const complete = !!(range?.from && range.to);
    const detailsVisible = showDetails && complete;

    const onSearch = () => {
        setShowDetails(true);
        // Aspetta che il modulo sia nel DOM, poi ci scorre sopra
        requestAnimationFrame(() => detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };

    const reset = () => {
        setRange(undefined);
        setGuests(DEFAULT_GUESTS);
        setShowDetails(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <main className={styles.page}>
            <div className={`container ${styles.container}`}>
                <header className={styles.header}>
                    <p className="eyebrow">{t.eyebrow}</p>
                    <h1 className={styles.title}>
                        {t.title}
                        <em>{t.titleAccent}</em>
                    </h1>
                    <p className={styles.subtitle}>{t.subtitle}</p>
                </header>

                <div className={styles.searchArea}>
                    <BookingSearch
                        ref={searchRef}
                        range={range}
                        onRangeChange={setRange}
                        guests={guests}
                        onGuestsChange={setGuests}
                        blocked={blocked}
                        loading={loading}
                        onSearch={onSearch}
                        hideMobileBar={detailsVisible}
                    />
                </div>

                {detailsVisible && (
                    <section ref={detailsRef} className={styles.details}>
                        <RequestForm
                            from={range!.from!}
                            to={range!.to!}
                            guests={guests}
                            onEdit={() => searchRef.current?.open()}
                            onReset={reset}
                        />
                    </section>
                )}
            </div>
        </main>
    );
};

export default RequestPage;
