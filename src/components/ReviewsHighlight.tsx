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

/* Ramo d'alloro: uno stelo curvo (curva di Bezier, dal basso verso l'alto) con coppie
   di foglie attaccate allo stelo e orientate lungo la sua direzione, piu' una foglia
   in punta. Il lato destro e' lo specchio del sinistro. */
type Pt = [number, number];
const STEM: [Pt, Pt, Pt, Pt] = [[30, 64], [11, 56], [5, 32], [17, 6]];

const bezier = (t: number): Pt => {
    const u = 1 - t;
    const [p0, p1, p2, p3] = STEM;
    return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]) as Pt;
};
const tangentDeg = (t: number) => {
    const u = 1 - t;
    const [p0, p1, p2, p3] = STEM;
    const [dx, dy] = [0, 1].map(
        (k) => 3 * u * u * (p1[k] - p0[k]) + 6 * u * t * (p2[k] - p1[k]) + 3 * t * t * (p3[k] - p2[k])
    );
    return (Math.atan2(dy, dx) * 180) / Math.PI;
};

const r1 = (n: number) => Math.round(n * 10) / 10;
const LEAF_SPREAD = 38; // gradi tra stelo e foglia

/* Foglia: ellisse con la base sullo stelo, inclinata di `side * LEAF_SPREAD` gradi rispetto allo stelo */
const leaf = (t: number, side: -1 | 0 | 1, size: number) => {
    const [x, y] = bezier(t);
    const dir = ((tangentDeg(t) + side * LEAF_SPREAD) * Math.PI) / 180;
    const ry = 6.2 * size;
    return {
        cx: r1(x + Math.cos(dir) * ry * 0.92),
        cy: r1(y + Math.sin(dir) * ry * 0.92),
        rx: r1(2.7 * size),
        ry: r1(ry),
        rot: r1(tangentDeg(t) + side * LEAF_SPREAD + 90),
        outer: side <= 0,
    };
};

const LEAVES = [
    ...[0.1, 0.23, 0.36, 0.49, 0.62, 0.75, 0.87].flatMap((t, i) => {
        const size = 1 - i * 0.055;
        return [leaf(t, -1, size), leaf(t, 1, size * 0.92)];
    }),
    leaf(0.995, 0, 0.8),
];

const Laurel: React.FC<{ flip?: boolean }> = ({ flip }) => (
    <svg
        className={styles.laurel}
        viewBox="-2 -4 42 72"
        aria-hidden="true"
        style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
        <path
            d={`M${STEM[0].join(' ')} C ${STEM[1].join(' ')}, ${STEM[2].join(' ')}, ${STEM[3].join(' ')}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
        />
        {LEAVES.map((l, i) => (
            <ellipse
                key={i}
                cx={l.cx}
                cy={l.cy}
                rx={l.rx}
                ry={l.ry}
                transform={`rotate(${l.rot} ${l.cx} ${l.cy})`}
                fill="currentColor"
                opacity={l.outer ? 1 : 0.8}
            />
        ))}
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
