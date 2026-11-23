import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useReveal from '../hooks/useReveal';
import Stars from './Stars';
import { sources, sourceKeys, reviews, totalCount, overall, formatDate, fmt } from '../data/reviewsData';
import type { Review, SourceKey } from '../data/reviewsData';
import keywords from '../data/reviewKeywords';
import styles from './ReviewsPage.module.css';

/* Le recensioni vivono in src/data/reviews.json:
   si aggiornano a mano copiandole da Airbnb e Google.
   Le parole chiave del filtro sono in src/data/reviewKeywords.ts. */

/* Una regex per parola chiave: la radice deve iniziare una parola */
const keywordRegex = new Map(
    keywords.map((k) => [k.id, new RegExp(`(?<!\\p{L})(?:${k.stems.join('|')})\\p{L}*`, 'giu')])
);

const matches = (text: string, re: RegExp) => {
    re.lastIndex = 0;
    return re.test(text);
};

/* Spezza il testo e avvolge in <mark> le parti che corrispondono */
const highlight = (text: string, re: RegExp | undefined): React.ReactNode => {
    if (!re) return text;
    const parts: React.ReactNode[] = [];
    let last = 0;
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
        const i = m.index ?? 0;
        if (i > last) parts.push(text.slice(last, i));
        parts.push(<mark key={i} className={styles.mark}>{m[0]}</mark>);
        last = i + m[0].length;
    }
    parts.push(text.slice(last));
    return parts;
};

/* Oltre questa lunghezza il testo si apre con "Continua a leggere" */
const CLAMP_CHARS = 420;

const Arrow = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
);

const ReviewCard: React.FC<{ review: Review; re?: RegExp }> = ({ review: r, re }) => {
    const [open, setOpen] = useState(false);
    const long = r.text.length > CLAMP_CHARS;
    // Con una parola chiave attiva il testo e' sempre intero: l'evidenziato non resta nascosto
    const clamped = long && !open && !re;

    return (
        <li className={styles.card}>
            <div className={styles.cardTop}>
                <Stars value={r.rating} className={styles.stars} />
                <span className={`${styles.badge} ${styles[r.source]}`}>{sources[r.source].label}</span>
            </div>
            <blockquote className={`${styles.quote} ${clamped ? styles.clamped : ''}`}>
                {highlight(r.text, re)}
            </blockquote>
            {long && !re && (
                <button type="button" className={styles.more} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
                    {open ? 'Mostra meno' : 'Continua a leggere'}
                </button>
            )}
            {r.translatedFrom && <p className={styles.note}>Tradotta dall'{r.translatedFrom}</p>}
            {r.reply && (
                <div className={styles.reply}>
                    <p className={styles.replyLabel}>Risposta dell'host</p>
                    <p>{r.reply}</p>
                </div>
            )}
            <p className={styles.author}>
                <span className={styles.authorName}>{r.name}</span>
                <span className={styles.authorMeta}>
                    {r.from ? `${r.from} · ` : ''}{formatDate(r.date)}
                </span>
            </p>
            <a
                href={r.url ?? sources[r.source].url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.verify}
            >
                {r.url ? `Vedi questa recensione su ${sources[r.source].label}` : `Verifica su ${sources[r.source].label}`}
            </a>
        </li>
    );
};

type Filter = 'all' | SourceKey;

const ReviewsPage: React.FC = () => {
    const ref = useReveal<HTMLElement>();
    const [filter, setFilter] = useState<Filter>('all');
    const [keyword, setKeyword] = useState<string | null>(null);

    const bySource = useMemo(
        () => (filter === 'all' ? reviews : reviews.filter((r) => r.source === filter)),
        [filter]
    );

    /* Quante recensioni (della piattaforma scelta) citano ciascuna parola chiave */
    const keywordCounts = useMemo(
        () => new Map(keywords.map((k) => [k.id, bySource.filter((r) => matches(r.text, keywordRegex.get(k.id)!)).length])),
        [bySource]
    );

    const re = keyword ? keywordRegex.get(keyword) : undefined;
    const shown = re ? bySource.filter((r) => matches(r.text, re)) : bySource;

    const tabs: { key: Filter; label: string }[] = [
        { key: 'all', label: 'Tutte' },
        ...sourceKeys.map((k) => ({ key: k, label: sources[k].label }))
    ];

    const airbnb = sources.airbnb;

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
                            <Stars value={overall} size={20} className={styles.stars} />
                            <p className={styles.overallLabel}>
                                Media su {totalCount} recensioni
                            </p>
                        </div>
                    </div>

                    <ul className={styles.sources}>
                        {sourceKeys.map((k) => (
                            <li key={k}>
                                <a href={sources[k].url} target="_blank" rel="noopener noreferrer" className={styles.source}>
                                    <span className={`${styles.badge} ${styles[k]}`}>{sources[k].label}</span>
                                    <span className={styles.sourceValue}>{fmt(sources[k].rating, sources[k].rating % 1 ? 2 : 1)}</span>
                                    <span className={styles.sourceCount}>
                                        {sources[k].count} recensioni{sources[k].badge ? ` · ${sources[k].badge}` : ''}
                                    </span>
                                    <span className={styles.sourceAction}>Leggi tutte <Arrow /></span>
                                </a>
                            </li>
                        ))}
                    </ul>

                    {airbnb.categories && (
                        <dl className={styles.categories}>
                            {airbnb.categories.map((c) => (
                                <div key={c.label} className={styles.category}>
                                    <dt>{c.label}</dt>
                                    <dd>{fmt(c.rating, 1)}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </section>

                {/* Filtri */}
                <div className={styles.filters}>
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

                    <div className={styles.keywords} role="group" aria-label="Filtra per argomento">
                        <span className={styles.keywordsLabel}>Cerca per argomento</span>
                        {keywords.map((k) => {
                            const n = keywordCounts.get(k.id) ?? 0;
                            if (n === 0) return null;
                            const active = keyword === k.id;
                            return (
                                <button
                                    key={k.id}
                                    type="button"
                                    className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                                    aria-pressed={active}
                                    onClick={() => setKeyword(active ? null : k.id)}
                                >
                                    {k.label} <span className={styles.chipCount}>{n}</span>
                                </button>
                            );
                        })}
                    </div>

                    <p className={styles.resultLine} aria-live="polite">
                        {shown.length} {shown.length === 1 ? 'recensione' : 'recensioni'}
                        {keyword && (
                            <>
                                {' '}che parlano di <strong>{keywords.find((k) => k.id === keyword)?.label.toLowerCase()}</strong>
                                {' · '}
                                <button type="button" className={styles.clear} onClick={() => setKeyword(null)}>
                                    Mostra tutte
                                </button>
                            </>
                        )}
                    </p>
                </div>

                {/* Elenco */}
                <ul className={styles.grid}>
                    {shown.map((r) => (
                        <ReviewCard key={`${r.source}-${r.name}-${r.date}-${keyword ?? ''}`} review={r} re={re} />
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
