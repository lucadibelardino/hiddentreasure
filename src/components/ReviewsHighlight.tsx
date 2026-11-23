import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useReveal from '../hooks/useReveal';
import Stars from './Stars';
import { reviews, sources, totalCount, overall, formatDate, fmt } from '../data/reviewsData';
import styles from './ReviewsHighlight.module.css';

/* Sezione della home: alcune recensioni che scorrono da sole,
   con il rimando alla pagina Recensioni completa.
   Compaiono quelle con "featured": true in src/data/reviews.json;
   se nessuna e' segnata, le 6 piu' recenti da 5 stelle e non troppo lunghe. */

const MAX_CHARS = 380;
const INTERVAL_MS = 7000;

const featured = reviews.filter((r) => r.featured);
const slides = featured.length
    ? featured
    : reviews.filter((r) => r.rating === 5 && r.text.length <= MAX_CHARS).slice(0, 6);

const Chevron: React.FC<{ dir: 'left' | 'right' }> = ({ dir }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
    </svg>
);

const ReviewsHighlight: React.FC = () => {
    const ref = useReveal<HTMLElement>();
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchX = useRef<number | null>(null);
    const n = slides.length;

    const go = useCallback((i: number) => setIndex(((i % n) + n) % n), [n]);

    // Avanza da sola, tranne se l'utente ci sta sopra o preferisce meno movimento
    useEffect(() => {
        if (paused || n < 2) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const t = window.setTimeout(() => go(index + 1), INTERVAL_MS);
        return () => window.clearTimeout(t);
    }, [index, paused, go, n]);

    if (n === 0) return null;

    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
    };

    return (
        <section ref={ref} className={styles.section} aria-labelledby="ospiti-title">
            <div className={`container ${styles.inner}`}>
                <header className={`${styles.head} reveal`}>
                    <p className="eyebrow">Recensioni</p>
                    <h2 id="ospiti-title" className={styles.title}>Cosa dicono <em>gli ospiti</em></h2>
                    <p className={styles.score}>
                        <span className={styles.scoreValue}>{fmt(overall, 2)}</span>
                        <Stars value={overall} size={18} className={styles.stars} />
                        <span className={styles.scoreLabel}>su {totalCount} recensioni Airbnb e Google</span>
                    </p>
                </header>

                <div
                    className={`${styles.slider} reveal`}
                    role="region"
                    aria-roledescription="carosello"
                    aria-label="Recensioni degli ospiti"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onFocus={() => setPaused(true)}
                    onBlur={() => setPaused(false)}
                    onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
                    onTouchEnd={onTouchEnd}
                >
                    <div className={styles.viewport}>
                        {slides.map((r, i) => (
                            <figure
                                key={`${r.source}-${r.name}-${r.date}`}
                                className={`${styles.slide} ${i === index ? styles.active : ''}`}
                                aria-hidden={i !== index}
                                aria-roledescription="recensione"
                                aria-label={`${i + 1} di ${n}`}
                            >
                                <Stars value={r.rating} className={styles.stars} />
                                <blockquote className={styles.quote}>“{r.text}”</blockquote>
                                <figcaption className={styles.author}>
                                    <span className={styles.authorName}>{r.name}</span>
                                    <span className={styles.authorMeta}>
                                        {formatDate(r.date)} · {sources[r.source].label}
                                        {r.translatedFrom ? ` · tradotta dall'${r.translatedFrom}` : ''}
                                    </span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>

                    {n > 1 && (
                        <div className={styles.controls}>
                            <button type="button" className={styles.arrow} onClick={() => go(index - 1)} aria-label="Recensione precedente">
                                <Chevron dir="left" />
                            </button>
                            <div className={styles.dots}>
                                {slides.map((r, i) => (
                                    <button
                                        key={`${r.name}-${i}`}
                                        type="button"
                                        className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
                                        onClick={() => go(i)}
                                        aria-label={`Recensione ${i + 1} di ${n}`}
                                        aria-current={i === index}
                                    />
                                ))}
                            </div>
                            <button type="button" className={styles.arrow} onClick={() => go(index + 1)} aria-label="Recensione successiva">
                                <Chevron dir="right" />
                            </button>
                        </div>
                    )}
                </div>

                <Link to="/recensioni" className={`${styles.cta} reveal`}>
                    Leggi tutte le recensioni
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                </Link>
            </div>
        </section>
    );
};

export default ReviewsHighlight;
