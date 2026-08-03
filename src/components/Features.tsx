import React from 'react';
import { useNavigate } from 'react-router-dom';
import useReveal from '../hooks/useReveal';
import styles from './Features.module.css';

const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` } as React.CSSProperties);

const features = [
    {
        label: 'Spiaggia',
        title: 'Il mare in giardino',
        description:
            "Per arrivare al mare basta un passo: alla fine del prato inizia la sabbia, così vicina che si sentono le onde rompere."
    },
    {
        label: 'Vista',
        title: 'Terrazza panoramica',
        description:
            "Una vista di 270 gradi sul mare. Il belvedere privato dove finiscono tutte le giornate, con il sole che cala dietro la costa."
    },
    {
        label: 'Accesso',
        title: 'Spiaggia semiprivata',
        description:
            "La spiaggia a fine prato è semiprivata: niente file di ombrelloni, niente corsa per un posto la mattina presto."
    },
    {
        label: 'Interni',
        title: 'Da quattro a sei posti letto',
        description:
            "Una camera matrimoniale e una junior per quattro persone, più il divano letto in soggiorno per arrivare a sei. Due bagni completi e cucina attrezzata."
    },
    {
        label: 'Esterni',
        title: 'Giardino e due patii',
        description:
            "Un giardino curato e due patii luminosi: uno per la colazione al sole, l'altro all'ombra per il pomeriggio."
    }
];

const stats = [
    { value: '0', unit: 'passi', label: 'dal mare' },
    { value: '270', unit: 'gradi', label: 'di vista dalla terrazza' },
    { value: '4–6', unit: 'posti', label: 'letto' }
];

const Features: React.FC = () => {
    const ref = useReveal<HTMLElement>();
    const navigate = useNavigate();

    return (
        <section id="villa" ref={ref} className={styles.section} aria-labelledby="villa-title">
            <div className={`container ${styles.grid}`}>

                <div className={styles.mediaCol}>
                    <figure className={`${styles.media} reveal`}>
                        <img
                            src="/images/gallery/photo_2026-05-13_19-14-20.jpg"
                            alt="Il tramonto visto dalla terrazza panoramica della villa"
                            loading="lazy"
                        />
                        <figcaption className={styles.caption}>La terrazza, al tramonto</figcaption>
                    </figure>
                </div>

                <div className={styles.contentCol}>
                    <p className={`eyebrow ${styles.eyebrow} reveal`}>La villa</p>

                    <h2 id="villa-title" className={`${styles.title} reveal`} style={delay(60)}>
                        Un posto che si spiega<em> in tre numeri</em>
                    </h2>

                    <dl className={`${styles.stats} reveal`} style={delay(120)}>
                        {stats.map((s) => (
                            <div key={s.label} className={styles.stat}>
                                <dt className={styles.statValue}>
                                    {s.value}<span className={styles.statUnit}>{s.unit}</span>
                                </dt>
                                <dd className={styles.statLabel}>{s.label}</dd>
                            </div>
                        ))}
                    </dl>

                    <ul className={styles.list}>
                        {features.map((f, i) => (
                            <li key={f.title} className={`${styles.item} reveal`} style={delay(80 + i * 60)}>
                                <span className={styles.itemLabel}>{f.label}</span>
                                <div>
                                    <h3 className={styles.itemTitle}>{f.title}</h3>
                                    <p className={styles.itemText}>{f.description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className={`${styles.actions} reveal`}>
                        <button className={styles.primary} onClick={() => navigate('/contatti')}>
                            Chiedi le date
                        </button>
                        <button className={styles.secondary} onClick={() => navigate('/gallery')}>
                            Vedi tutte le foto
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;
