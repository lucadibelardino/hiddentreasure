import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useReveal from '../hooks/useReveal';
import data from '../data/reviews.json';
import styles from './ReviewsPage.module.css';

/* Le recensioni vivono in src/data/reviews.json:
   si aggiornano a mano copiandole da Airbnb e Google. */

type SourceKey = 'airbnb' | 'google';

interface Review {
    name: string;
    from?: string;
    date: string; // AAAA-MM
    rating: number;
    source: SourceKey;
    text: string;
}

interface Source {
    label: string;
    rating: number;
    count: number;
    url: string;
}

const sources = data.sources as Record<SourceKey, Source>;
const reviews = [...(data.reviews as Review[])].sort((a, b) => b.date.localeCompare(a.date));

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
    'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

const formatDate = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return m ? `${MONTHS[m - 1]} ${y}` : String(y);
};

const fmt = (n: number, digits: number) => n.toLocaleString('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/* Media complessiva pesata sul numero di recensioni di ciascuna piattaforma */
const totalCount = Object.values(sources).reduce((s, x) => s + x.count, 0);
const overall = totalCount
    ? Object.values(sources).reduce((s, x) => s + x.rating * x.count, 0) / totalCount
    : 0;

const Stars: React.FC<{ value: number; size?: number }> = ({ value, size = 16 }) => (
    <span className={styles.stars} role="img" aria-label={`${fmt(value, 1)} stelle su 5`}>
        {[0, 1, 2, 3, 4].map((i) => {
            const fill = Math.max(0, Math.min(1, value - i));
            return (
                <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
                    <defs>
                        <linearGradient id={`st-${i}-${Math.round(fill * 100)}`}>
                            <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                            <stop offset={`${fill * 100}%`} stopColor="var(--c-sand)" />
                        </linearGradient>
                    </defs>
                    <path
                        fill={`url(#st-${i}-${Math.round(fill * 100)})`}
                        d="M12 2.6l2.9 6 6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5L2.6 9.5l6.5-.9z"
                    />
                </svg>
            );
        })}
    </span>
);

const Arrow = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
);

type Filter = 'all' | SourceKey;

const ReviewsPage: React.FC = () => {
    const ref = useReveal<HTMLElement>();
    const [filter, setFilter] = useState<Filter>('all');

    const shown = useMemo(
        () => (filter === 'all' ? reviews : reviews.filter((r) => r.source === filter)),
        [filter]
    );

    const tabs: { key: Filter; label: string }[] = [
        { key: 'all', label: 'Tutte' },
        ...(Object.keys(sources) as SourceKey[]).map((k) => ({ key: k, label: sources[k].label }))
    ];

    return (
        <main ref={ref} className={styles.page}>
            <div className="container">

                <header className={styles.header}>
                    <p className="eyebrow">Recensioni</p>
                    <h1 className={styles.title}>Cosa dicono <em>gli ospiti</em></h1>
                    <p className={styles.subtitle}>
                        Le parole di chi ha già passato qui le sue vacanze, riportate
                        dalle nostre pagine su Airbnb e Google.
                    </p>
                </header>

                {/* Riepilogo voti */}
                <section className={`${styles.summary} reveal`} aria-label="Valutazione media">
                    <div className={styles.overall}>
                        <span className={styles.overallValue}>{fmt(overall, 2)}</span>
                        <div>
                            <Stars value={overall} size={20} />
                            <p className={styles.overallLabel}>
                                Media su {totalCount} recensioni
                            </p>
                        </div>
                    </div>

                    <ul className={styles.sources}>
                        {(Object.keys(sources) as SourceKey[]).map((k) => (
                            <li key={k}>
                                <a href={sources[k].url} target="_blank" rel="noopener noreferrer" className={styles.source}>
                                    <span className={`${styles.badge} ${styles[k]}`}>{sources[k].label}</span>
                                    <span className={styles.sourceValue}>{fmt(sources[k].rating, sources[k].rating % 1 ? 2 : 1)}</span>
                                    <span className={styles.sourceCount}>{sources[k].count} recensioni</span>
                                    <span className={styles.sourceAction}>Leggi tutte <Arrow /></span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Filtro */}
                <div className={styles.tabs} role="group" aria-label="Filtra per piattaforma">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            className={`${styles.tab} ${filter === t.key ? styles.tabActive : ''}`}
                            aria-pressed={filter === t.key}
                            onClick={() => setFilter(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Elenco */}
                <ul className={styles.grid}>
                    {shown.map((r) => (
                        <li key={`${r.source}-${r.name}-${r.date}`} className={styles.card}>
                            <div className={styles.cardTop}>
                                <Stars value={r.rating} />
                                <span className={`${styles.badge} ${styles[r.source]}`}>{sources[r.source].label}</span>
                            </div>
                            <blockquote className={styles.quote}>{r.text}</blockquote>
                            <p className={styles.author}>
                                <span className={styles.authorName}>{r.name}</span>
                                <span className={styles.authorMeta}>
                                    {r.from ? `${r.from} · ` : ''}{formatDate(r.date)}
                                </span>
                            </p>
                        </li>
                    ))}
                </ul>

                {/* Chiusura */}
                <section className={`${styles.cta} reveal`}>
                    <h2 className={styles.ctaTitle}>Vuoi essere il prossimo a scriverne una?</h2>
                    <Link to="/contatti" className={styles.ctaBtn}>Chiedi disponibilità <Arrow /></Link>
                </section>
            </div>
        </main>
    );
};

export default ReviewsPage;
