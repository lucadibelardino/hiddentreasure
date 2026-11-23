import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Stars from './Stars';
import { reviews, sources, formatDate, fmt, localize } from '../data/reviewsData';
import { ROUTES, useLang, useT } from '../i18n';
import type { Review } from '../data/reviewsData';
import styles from './ReviewsHighlight.module.css';

/* Fascia recensioni in home.
   In alto il riconoscimento Airbnb con la corona d'alloro; sotto i commenti
   degli ospiti che scorrono a scatti: uno resta fermo da leggere, poi
   la fila scivola veloce al successivo. Compaiono le recensioni con
   "featured": true in src/data/reviews.json (altrimenti quelle da 5 stelle). */

const HOLD_MS = 4500;   // tempo di lettura per commento
const SLIDE_MS = 650;   // durata dello scatto

const featured = reviews.filter((r) => r.featured);
const slides: Review[] = featured.length ? featured : reviews.filter((r) => r.rating === 5).slice(0, 8);

const AVATAR_COLORS = ['var(--c-sea)', 'var(--c-brass)', 'var(--c-deep-2)', 'var(--c-sea-dark)'];
const avatarColor = (name: string) =>
    AVATAR_COLORS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

const airbnb = sources.airbnb;

/* Ramo d'alloro: coppie di foglie lungo uno stelo curvo, dal basso verso l'alto.
   Il lato destro e' lo specchio del sinistro. */
const LEAF_PAIRS = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const t = i / 6;
    return {
        x: 28 - Math.sin(t * Math.PI * 0.85) * 14 + t * 4,
        y: 58 - t * 50,
        size: 1 - t * 0.3,
        tilt: -20 + t * 25
    };
});

const Laurel: React.FC<{ flip?: boolean }> = ({ flip }) => (
    <svg
        className={styles.laurel}
        viewBox="0 0 40 66"
        aria-hidden="true"
        style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
        <path d="M31 63 C 12 52, 8 30, 19 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {LEAF_PAIRS.map((l, i) => (
            <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.tilt})`}>
                <ellipse cx={-5.5 * l.size} cy={-1} rx={2.8 * l.size} ry={6.4 * l.size} transform={`rotate(-42 ${-5.5 * l.size} -1)`} fill="currentColor" />
                <ellipse cx={5 * l.size} cy={-1} rx={2.6 * l.size} ry={6 * l.size} transform={`rotate(42 ${5 * l.size} -1)`} fill="currentColor" opacity="0.8" />
            </g>
        ))}
        <ellipse cx="19.5" cy="4" rx="2.4" ry="5" fill="currentColor" />
    </svg>
);

const Comment: React.FC<{ r: Review }> = ({ r }) => {
    const lang = useLang();
    const { text } = localize(r, lang);
    return (
        <article className={styles.card}>
            <header className={styles.cardHead}>
                <span className={styles.avatar} style={{ background: avatarColor(r.name) }} aria-hidden="true">
                    {r.name.charAt(0)}
                </span>
                <div className={styles.who}>
                    <span className={styles.name}>{r.name}</span>
                    <span className={styles.meta}>{formatDate(r.date, lang)} · {sources[r.source].label}</span>
                </div>
                <Stars value={r.rating} size={13} className={styles.stars} />
            </header>
            <p className={styles.text}>{text}</p>
        </article>
    );
};

const ReviewsHighlight: React.FC = () => {
    const [index, setIndex] = useState(0);
    const [animate, setAnimate] = useState(true);
    const [paused, setPaused] = useState(false);
    const [offset, setOffset] = useState(0);
    const trackRef = useRef<HTMLDivElement>(null);
    const n = slides.length;
    const lang = useLang();
    const dict = useT();
    const t = dict.highlight;
    const badge = airbnb.badge ? (dict.reviews.badge[airbnb.badge] ?? airbnb.badge) : t.fallbackTitle;

    // Posizione della card corrente (misurata, cosi' funziona a ogni larghezza)
    useLayoutEffect(() => {
        const measure = () => {
            const card = trackRef.current?.children[index] as HTMLElement | undefined;
            setOffset(card ? card.offsetLeft : 0);
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [index]);

    // Ferma, poi scatto al commento successivo
    useEffect(() => {
        if (paused || n < 2) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const t = window.setTimeout(() => {
            setAnimate(true);
            setIndex((i) => i + 1);
        }, HOLD_MS);
        return () => window.clearTimeout(t);
    }, [index, paused, n]);

    // Arrivati alla copia del primo commento, si torna all'inizio senza animazione
    const onTransitionEnd = () => {
        if (index >= n) {
            setAnimate(false);
            setIndex(0);
        }
    };

    if (n === 0) return null;

    return (
        <section className={styles.band} aria-labelledby="ospiti-badge">
            <div className={styles.head}>
                <div className={styles.award}>
                    <Laurel />
                    <div className={styles.awardText}>
                        <h2 id="ospiti-badge" className={styles.awardTitle}>{badge}</h2>
                        <p className={styles.awardSource}>{t.awardSource}</p>
                    </div>
                    <Laurel flip />
                </div>
                <p className={styles.score}>
                    <strong>{fmt(airbnb.rating, 2, lang)}</strong> {t.scoreRest(airbnb.count)}
                    <span aria-hidden="true"> · </span>
                    <Link to={ROUTES[lang].reviews} className={styles.link}>{t.readAll}</Link>
                </p>
            </div>

            <div
                className={styles.viewport}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
                <div
                    ref={trackRef}
                    className={styles.track}
                    style={{
                        transform: `translateX(${-offset}px)`,
                        transition: animate ? `transform ${SLIDE_MS}ms cubic-bezier(0.7, 0, 0.2, 1)` : 'none'
                    }}
                    onTransitionEnd={onTransitionEnd}
                >
                    {/* Seconda copia: permette di ripartire dall'inizio senza salti */}
                    {[...slides, ...slides].map((r, i) => (
                        <div key={i} className={styles.slot} aria-hidden={i >= n}>
                            <Comment r={r} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ReviewsHighlight;
