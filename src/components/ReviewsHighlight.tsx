import React from 'react';
import { Link } from 'react-router-dom';
import { reviews, sources, fmt } from '../data/reviewsData';
import styles from './ReviewsHighlight.module.css';

/* Fascia sottile in home: frasi brevi dalle recensioni che scorrono
   da un lato all'altro, con il riconoscimento Airbnb e il rimando
   alla pagina Recensioni. Compaiono le recensioni con "featured": true
   in src/data/reviews.json (altrimenti tutte quelle da 5 stelle). */

const MAX_CHARS = 110;

/* Prima frase (o le prime parole) della recensione, senza emoji */
const snippet = (text: string) => {
    const clean = text.replace(/\p{Extended_Pictographic}/gu, '').trim();
    const first = clean.match(/^.+?[.!?](?=\s|$)/u)?.[0] ?? clean;
    if (first.length <= MAX_CHARS) return first;
    const cut = first.slice(0, MAX_CHARS);
    return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
};

const featured = reviews.filter((r) => r.featured);
const items = (featured.length ? featured : reviews.filter((r) => r.rating === 5))
    .map((r) => ({ key: `${r.source}-${r.name}-${r.date}`, text: snippet(r.text), name: r.name }));

const airbnb = sources.airbnb;

const Item: React.FC<{ text: string; name: string }> = ({ text, name }) => (
    <li className={styles.item}>
        <span className={styles.star} aria-hidden="true">★</span>
        <q className={styles.quote}>{text}</q>
        <span className={styles.name}>{name}</span>
    </li>
);

const ReviewsHighlight: React.FC = () => {
    if (items.length === 0) return null;

    return (
        <section className={styles.band} aria-label="Recensioni degli ospiti">
            <Link to="/recensioni" className={styles.badge}>
                <span className={styles.badgeTitle}>{airbnb.badge ?? 'Recensioni'}</span>
                <span className={styles.badgeMeta}>
                    {fmt(airbnb.rating, 2)} su {airbnb.label} · Leggi tutte
                </span>
            </Link>

            <div className={styles.track}>
                {/* Due copie identiche in fila: quando la prima esce, la seconda e' al suo posto */}
                <ul className={styles.row}>
                    {items.map((it) => <Item key={it.key} text={it.text} name={it.name} />)}
                </ul>
                <ul className={styles.row} aria-hidden="true">
                    {items.map((it) => <Item key={`b-${it.key}`} text={it.text} name={it.name} />)}
                </ul>
            </div>
        </section>
    );
};

export default ReviewsHighlight;
