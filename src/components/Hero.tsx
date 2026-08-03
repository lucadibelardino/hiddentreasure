import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingBar from './BookingBar';
import styles from './Hero.module.css';

const SLIDE_MS = 8000;

const heroImages = [
    { src: '/images/hero/hero-bg-resized.jpg', alt: 'La villa Hidden Treasure vista dal giardino sul mare' },
    { src: '/images/hero/20230804_115659.jpg', alt: 'La spiaggia semiprivata davanti alla villa' },
    { src: '/images/hero/20230804_203514.jpg', alt: 'Tramonto sul mare visto dalla terrazza' },
    { src: '/images/hero/1cdb0be8-1741-41fa-b1a7-02258c4b72cd.jpg', alt: 'Scorcio della costa di Villasimius' },
    { src: '/images/hero/20230804_115710.jpg', alt: 'Il prato della villa che si apre sulla spiaggia' }
];

const Hero: React.FC = () => {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const navigate = useNavigate();

    const go = useCallback((next: number) => {
        setIndex(((next % heroImages.length) + heroImages.length) % heroImages.length);
    }, []);

    useEffect(() => {
        if (paused) return;
        const t = window.setInterval(() => setIndex((i) => (i + 1) % heroImages.length), SLIDE_MS);
        return () => window.clearInterval(t);
    }, [paused]);

    // Non far girare lo slideshow quando la scheda e' in secondo piano
    useEffect(() => {
        const onVisibility = () => setPaused(document.hidden);
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    return (
        <section id="hero" className={styles.hero} aria-label="Presentazione della villa">
            <div className={styles.stage} aria-hidden="true">
                {heroImages.map((img, i) => (
                    <div
                        key={img.src}
                        className={`${styles.slide} ${i === index ? styles.active : ''}`}
                        style={{ backgroundImage: `url("${img.src}")` }}
                        role="img"
                        aria-label={img.alt}
                    />
                ))}
                <div className={styles.scrim} />
            </div>

            <div className={`container ${styles.content}`}>
                <p className={styles.eyebrow}>Hidden Treasure · Villasimius</p>

                <h1 className={styles.title}>
                    Il giardino finisce
                    <em className={styles.titleAccent}>dove inizia la spiaggia</em>
                </h1>

                <p className={styles.lead}>
                    Una villa da quattro a sei posti sulla costa sud della Sardegna.
                    Terrazza con vista a 270 gradi, spiaggia semiprivata a fine prato.
                </p>

                <BookingBar />

                <button className={styles.galleryBtn} onClick={() => navigate('/gallery')}>
                    <span>Guarda la villa</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                </button>
            </div>

            {/* Indicatori: barre che si riempiono al ritmo dello slideshow */}
            <div className={styles.indicators} role="group" aria-label="Fotografie della villa">
                {heroImages.map((img, i) => (
                    <button
                        key={img.src}
                        aria-current={i === index}
                        aria-label={img.alt}
                        className={`${styles.indicator} ${i === index ? styles.indicatorActive : ''}`}
                        onClick={() => go(i)}
                    >
                        <span className={styles.indicatorFill} style={{ animationDuration: `${SLIDE_MS}ms` }} />
                    </button>
                ))}
            </div>

            <a href="#villa" className={styles.scrollCue} aria-label="Scorri alla presentazione della villa">
                <span className={styles.scrollLine} aria-hidden="true" />
            </a>
        </section>
    );
};

export default Hero;
