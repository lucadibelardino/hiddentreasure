import React from 'react';
import { useNavigate } from 'react-router-dom';
import useReveal from '../hooks/useReveal';
import { ROUTES, useLang, useT } from '../i18n';
import { useOpenDates } from '../booking/openDates';
import styles from './Features.module.css';

const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` } as React.CSSProperties);

/* Testi in src/i18n/strings.ts, chiave "features" */

const Features: React.FC = () => {
    const ref = useReveal<HTMLElement>();
    const navigate = useNavigate();
    const lang = useLang();
    const t = useT().features;
    const openDates = useOpenDates();
    const { items: features, stats } = t;

    return (
        <section id="villa" ref={ref} className={styles.section} aria-labelledby="villa-title">
            <div className={`container ${styles.grid}`}>

                <div className={styles.mediaCol}>
                    <figure className={`${styles.media} reveal`}>
                        <img
                            src="/images/gallery/photo_2026-05-13_19-14-20.webp"
                            alt={t.imageAlt}
                            loading="lazy"
                        />
                        <figcaption className={styles.caption}>{t.caption}</figcaption>
                    </figure>
                </div>

                <div className={styles.contentCol}>
                    <p className={`eyebrow ${styles.eyebrow} reveal`}>{t.eyebrow}</p>

                    <h2 id="villa-title" className={`${styles.title} reveal`} style={delay(60)}>
                        {t.title}<em>{t.titleAccent}</em>
                    </h2>

                    <dl className={`${styles.stats} reveal`} style={delay(120)}>
                        {stats.map((s) => (
                            <div key={s.unit} className={styles.stat}>
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
                        <button className={styles.primary} onClick={openDates}>
                            {t.askDates}
                        </button>
                        <button className={styles.secondary} onClick={() => navigate(ROUTES[lang].gallery)}>
                            {t.allPhotos}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;
