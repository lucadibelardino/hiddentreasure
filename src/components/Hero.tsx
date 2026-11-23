import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingBar from './BookingBar';
import { ROUTES, useLang, useT } from '../i18n';
import styles from './Hero.module.css';

const SLIDE_MS = 8000;
// Deve coincidere con la durata della transition di opacita' in Hero.module.css
const FADE_MS = 2200;

// I testi alternativi sono in src/i18n/strings.ts (hero.imageAlts), nello stesso ordine
const heroImages = [
    '/images/hero/hero-bg-resized.webp',
    '/images/hero/20230804_115659.webp',
    '/images/hero/20230804_203514.webp',
    '/images/hero/1cdb0be8-1741-41fa-b1a7-02258c4b72cd.webp',
    '/images/hero/20230804_115710.webp'
].map((src, i) => ({ src, i }));

const Hero: React.FC = () => {
    // `leaving` e' la foto che sta sfumando via: deve conservare lo zoom raggiunto finche'
    // non e' invisibile, altrimenti torna di colpo alla scala iniziale (lo "scatto" al cambio foto).
    // Va aggiornata nello stesso render di `index`: anche un solo frame senza classe riavvia l'animazione.
    const [{ index, leaving }, setSlide] = useState<{ index: number; leaving: number | null }>({ index: 0, leaving: null });
    const [paused, setPaused] = useState(false);
    const navigate = useNavigate();
    const lang = useLang();
    const t = useT().hero;

    const go = useCallback((next: number) => {
        const n = ((next % heroImages.length) + heroImages.length) % heroImages.length;
        setSlide((s) => (s.index === n ? s : { index: n, leaving: s.index }));
    }, []);

    useEffect(() => {
        if (paused) return;
        const t = window.setInterval(
            () => setSlide((s) => ({ index: (s.index + 1) % heroImages.length, leaving: s.index })),
            SLIDE_MS
        );
        return () => window.clearInterval(t);
    }, [paused]);

    // A dissolvenza finita la foto uscita torna "a riposo", pronta a ripartire da capo
    useEffect(() => {
        if (leaving === null) return;
        const t = window.setTimeout(() => setSlide((s) => ({ ...s, leaving: null })), FADE_MS + 100);
        return () => window.clearTimeout(t);
    }, [index, leaving]);

    // Non far girare lo slideshow quando la scheda e' in secondo piano
    useEffect(() => {
        const onVisibility = () => setPaused(document.hidden);
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    return (
        <section id="hero" className={styles.hero} aria-label={t.sectionAria}>
            <div className={styles.stage} aria-hidden="true">
                {heroImages.map((img, i) => (
                    <div
                        key={img.src}
                        className={`${styles.slide} ${i === index ? styles.active : i === leaving ? styles.leaving : ''}`}
                        style={{ backgroundImage: `url("${img.src}")` }}
                        role="img"
                        aria-label={t.imageAlts[img.i]}
                    />
                ))}
                <div className={styles.scrim} />
            </div>

            <div className={`container ${styles.content}`}>
                <p className={styles.eyebrow}>{t.eyebrow}</p>

                <h1 className={styles.title}>
                    {t.title}
                    <em className={styles.titleAccent}>{t.titleAccent}</em>
                </h1>

                <p className={styles.lead}>{t.lead}</p>

                <BookingBar />

                <button className={styles.galleryBtn} onClick={() => navigate(ROUTES[lang].gallery)}>
                    <span>{t.seeVilla}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                </button>
            </div>

            {/* Indicatori: barre che si riempiono al ritmo dello slideshow */}
            <div className={styles.indicators} role="group" aria-label={t.indicatorsAria}>
                {heroImages.map((img, i) => (
                    <button
                        key={img.src}
                        aria-current={i === index}
                        aria-label={t.imageAlts[img.i]}
                        className={`${styles.indicator} ${i === index ? styles.indicatorActive : ''}`}
                        onClick={() => go(i)}
                    >
                        <span className={styles.indicatorFill} style={{ animationDuration: `${SLIDE_MS}ms` }} />
                    </button>
                ))}
            </div>

            <a href="#villa" className={styles.scrollCue} aria-label={t.scrollAria}>
                <span className={styles.scrollLine} aria-hidden="true" />
            </a>
        </section>
    );
};

export default Hero;
