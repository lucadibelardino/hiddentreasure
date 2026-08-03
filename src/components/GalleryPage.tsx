import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useReveal from '../hooks/useReveal';
import styles from './GalleryPage.module.css';

const fileNames = [
    "photo_2026-05-13_19-14-20.jpg",
    "20230804_203514.jpg",
    "1cdb0be8-1741-41fa-b1a7-02258c4b72cd.jpg",
    "20230804_115659.jpg",
    "20230804_115706.jpg",
    "20230804_115710.jpg",
    "20230808_142946.jpg",
    "photo_2026-05-13_19-14-22.jpg",
    "photo_2026-05-13_19-14-27.jpg",
    "20240711_183926.jpg",
    "20240711_185151.jpg",
    "20240711_203607.jpg",
    "20240711_203611.jpg",
    "20240711_204113.jpg",
    "20240802_113304.jpg",
    "20240802_113343.jpg",
    "20241228_125337.jpg",
    "20241228_125344.jpg",
    "20250529_205200.jpg",
    "20250617_202658.jpg",
    "253c471b-7f67-4cde-9ab4-d6f3c3520f96.jpg",
    "336ba03e-0b06-4c6d-aed3-853acca37063.jpg",
    "3bd74e9e-7eb6-4d5d-8d10-1281305baabc.jpg",
    "74d9e0c3-58f5-4ef6-b76e-658176a88979.jpg",
    "76de7422-dfdc-4368-bac7-7a685d755f0f.jpg",
    "c90e13c2-50c9-497b-a27a-ad052a07790b.jpg",
    "cc7cfba4-181c-4ebc-a786-6e51b31ca2f6.jpg",
    "dd379ddd-7f58-4718-8069-a26810528373.jpg",
    "ed83f638-58af-4192-9a22-8fb91b153631.jpg",
    "ff935983-2091-410c-9e00-728f047fabe6.jpg",
    "Gemini_Generated_Image_a7vx3qa7vx3qa7vx.jpg",
    "Gemini_Generated_Image_b8p9v1b8p9v1b8p9.jpg",
    "Gemini_Generated_Image_h982pih982pih982.jpg",
    "Gemini_Generated_Image_r1txelr1txelr1tx.jpg",
    "Gemini_Generated_Image_wznnamwznnamwznn.jpg",
    "IMG_20240609_145227_094.jpg",
    "IMG_20240609_145227_733.jpg",
    "IMG_20240609_145227_890.jpg",
    "IMG_20240609_145237_508.jpg",
    "IMG_20240609_145237_851.jpg",
    "IMG_20240609_145243_757 (1).jpg",
    "IMG_20240609_145243_773 (1).jpg",
    "IMG_20240609_145250_391.jpg",
    "IMG_20240609_145250_468 (1).jpg",
    "IMG_20240609_145250_685 (1).jpg",
    "IMG_20240609_145250_834.jpg",
    "IMG_20240609_145251_013.jpg",
    "IMG_20240609_145251_308.jpg",
    "IMG_20240609_145257_053.jpg",
    "IMG_20240609_145257_142.jpg",
    "IMG_20240609_145257_250.jpg",
    "IMG_20240609_145257_357.jpg",
    "IMG_20240609_145257_358.jpg",
    "IMG_20240609_145257_630.jpg",
    "IMG_20240609_145257_688 (1).jpg",
    "IMG_20240609_145257_970.jpg",
    "IMG_20240609_145258_005 (1).jpg",
    "IMG_20240609_145304_450.jpg",
    "IMG_20240809_214856_090.jpg"
];

const images = fileNames.map((name) => `/images/gallery/${encodeURI(name)}`);

const GalleryPage: React.FC = () => {
    const [current, setCurrent] = useState<number | null>(null);
    const revealRef = useReveal<HTMLDivElement>();
    const navigate = useNavigate();
    const touchStartX = useRef<number | null>(null);
    const isOpen = current !== null;

    const close = useCallback(() => setCurrent(null), []);
    const step = useCallback((delta: number) => {
        setCurrent((i) => (i === null ? i : (i + delta + images.length) % images.length));
    }, []);

    // Scorrimento bloccato e navigazione da tastiera mentre la foto e' aperta
    useEffect(() => {
        if (!isOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowRight') step(1);
            else if (e.key === 'ArrowLeft') step(-1);
        };
        window.addEventListener('keydown', onKey);

        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener('keydown', onKey);
        };
    }, [isOpen, close, step]);

    // Precarica la foto successiva e la precedente
    useEffect(() => {
        if (current === null) return;
        [current + 1, current - 1].forEach((i) => {
            const img = new Image();
            img.src = images[(i + images.length) % images.length];
        });
    }, [current]);

    const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
        touchStartX.current = null;
    };

    return (
        <main className={styles.page}>
            <div className="container">
                <header className={styles.header}>
                    <p className="eyebrow">{images.length} fotografie</p>
                    <h1 className={styles.title}>La villa, <em>senza filtri</em></h1>
                    <p className={styles.subtitle}>
                        Le stanze, il giardino, la spiaggia a fine prato e i tramonti dalla terrazza.
                        Tocca una foto per vederla intera.
                    </p>
                </header>

                <div className={styles.masonry} ref={revealRef}>
                    {images.map((src, i) => (
                        <button
                            key={src}
                            className={`${styles.tile} reveal`}
                            onClick={() => setCurrent(i)}
                            aria-label={`Apri la fotografia ${i + 1} di ${images.length}`}
                        >
                            <img src={src} alt={`Hidden Treasure Villasimius, fotografia ${i + 1}`} loading="lazy" decoding="async" />
                            <span className={styles.tileOverlay} aria-hidden="true">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                    <circle cx="11" cy="11" r="7" />
                                    <path d="m20 20-3.5-3.5M11 8v6M8 11h6" />
                                </svg>
                            </span>
                        </button>
                    ))}
                </div>

                <div className={styles.cta}>
                    <p className={styles.ctaText}>Ti è piaciuto quello che hai visto?</p>
                    <button className={styles.ctaBtn} onClick={() => navigate('/contatti')}>
                        Chiedi disponibilità e prezzi
                    </button>
                </div>
            </div>

            {isOpen && (
                <div
                    className={styles.lightbox}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Fotografia ${current + 1} di ${images.length}`}
                    onClick={close}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                >
                    <button className={styles.closeBtn} onClick={close} aria-label="Chiudi">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>

                    <button
                        className={`${styles.navBtn} ${styles.prevBtn}`}
                        onClick={(e) => { e.stopPropagation(); step(-1); }}
                        aria-label="Fotografia precedente"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </button>

                    <img
                        key={current}
                        src={images[current]}
                        alt={`Hidden Treasure Villasimius, fotografia ${current + 1}`}
                        className={styles.lightboxImage}
                        onClick={(e) => e.stopPropagation()}
                    />

                    <button
                        className={`${styles.navBtn} ${styles.nextBtn}`}
                        onClick={(e) => { e.stopPropagation(); step(1); }}
                        aria-label="Fotografia successiva"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>

                    <p className={styles.counter}>{current + 1} / {images.length}</p>
                </div>
            )}
        </main>
    );
};

export default GalleryPage;
