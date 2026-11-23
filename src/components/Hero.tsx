import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingBar from './BookingBar';
import { ROUTES, useLang, useT } from '../i18n';
import styles from './Hero.module.css';

const SLIDE_MS = 8000;
// Durata del passaggio tra due foto: deve coincidere con --hero-dur in Hero.module.css
const TRANSITION_MS = 1300;

// I testi alternativi sono in src/i18n/strings.ts (hero.imageAlts), nello stesso ordine
const heroImages = [
    '/images/hero/hero-bg-resized.webp',
    '/images/hero/20230804_115659.webp',
    '/images/hero/20230804_203514.webp',
    '/images/hero/1cdb0be8-1741-41fa-b1a7-02258c4b72cd.webp',
    '/images/hero/20230804_115710.webp'
].map((src, i) => ({ src, i }));

/* Tipi di passaggio tra le foto, da provare e confrontare.
   Si sceglie aggiungendo ?hero=<nome> all'indirizzo (es. /?hero=slide): compare anche
   un piccolo selettore in alto per cambiarlo al volo. Senza parametro vale DEFAULT_TRANSITION. */
const TRANSITIONS = {
    fade: 'Dissolvenza',
    slide: 'Scorrimento',
    wipe: 'Tendina'
} as const;
type Transition = keyof typeof TRANSITIONS;
const DEFAULT_TRANSITION: Transition = 'fade';

const isTransition = (v: string | null): v is Transition => !!v && v in TRANSITIONS;

// Il parametro ?hero= letto come "store" esterno: sul server (pagine pre-renderizzate)
// vale sempre null, nel browser si legge dall'indirizzo senza errori di idratazione.
const heroParamListeners = new Set<() => void>();
const subscribeHeroParam = (cb: () => void) => {
    heroParamListeners.add(cb);
    return () => heroParamListeners.delete(cb);
};
const getHeroParam = () => new URLSearchParams(window.location.search).get('hero');
const getHeroParamOnServer = () => null;

/* Decodifica anticipata: una foto grande decodificata solo quando diventa visibile
   blocca qualche frame proprio all'inizio del passaggio (lo "scatto"). Qui ogni foto
   viene scaricata e decodificata prima, e il cambio parte solo quando e' pronta. */
const decoded = new Map<string, Promise<void>>();
const keepAlive: HTMLImageElement[] = [];
function predecode(src: string): Promise<void> {
    let p = decoded.get(src);
    if (!p) {
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
        keepAlive.push(img);
        p = img.decode().catch(() => undefined);
        decoded.set(src, p);
    }
    return p;
}

type SlideState = { index: number; leaving: number | null; dir: 'next' | 'prev' };

const Hero: React.FC = () => {
    // `leaving` e' la foto che sta uscendo: resta montata (e animata, a seconda del tipo
    // di passaggio) finche' il passaggio non e' finito.
    const [{ index, leaving, dir }, setSlide] = useState<SlideState>({ index: 0, leaving: null, dir: 'next' });
    const [paused, setPaused] = useState(false);
    const heroParam = useSyncExternalStore(subscribeHeroParam, getHeroParam, getHeroParamOnServer);
    const transition: Transition = isTransition(heroParam) ? heroParam : DEFAULT_TRANSITION;
    const picker = heroParam !== null;
    const busy = useRef(false);
    const navigate = useNavigate();
    const lang = useLang();
    const t = useT().hero;

    const go = useCallback((next: number, forcedDir?: 'next' | 'prev') => {
        const n = ((next % heroImages.length) + heroImages.length) % heroImages.length;
        // Un click durante il passaggio verrebbe interrotto a meta' con un salto: lo ignoriamo
        if (busy.current) return;
        busy.current = true;
        predecode(heroImages[n].src).then(() => {
            setSlide((s) => {
                if (s.index === n) {
                    busy.current = false;
                    return s;
                }
                return { index: n, leaving: s.index, dir: forcedDir ?? (n > s.index ? 'next' : 'prev') };
            });
        });
    }, []);

    // Decodifica tutte le foto dopo il primo caricamento, senza rubare banda alla prima
    useEffect(() => {
        const start = () => heroImages.forEach((img) => predecode(img.src));
        const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
        if (w.requestIdleCallback) w.requestIdleCallback(start);
        else window.setTimeout(start, 1500);
    }, []);

    // Avanzamento automatico: riparte da capo a ogni cambio, cosi' resta allineato alla barra
    useEffect(() => {
        if (paused) return;
        const id = window.setTimeout(() => go(index + 1, 'next'), SLIDE_MS);
        return () => window.clearTimeout(id);
    }, [index, paused, go]);

    // Fine del passaggio: la foto uscita torna a riposo
    useEffect(() => {
        if (leaving === null) return;
        const id = window.setTimeout(() => {
            busy.current = false;
            setSlide((s) => ({ ...s, leaving: null }));
        }, TRANSITION_MS + 80);
        return () => window.clearTimeout(id);
    }, [index, leaving]);

    // Non far girare lo slideshow quando la scheda e' in secondo piano
    useEffect(() => {
        const onVisibility = () => setPaused(document.hidden);
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    const pick = (tr: Transition) => {
        const url = new URL(window.location.href);
        url.searchParams.set('hero', tr);
        window.history.replaceState(window.history.state, '', url);
        heroParamListeners.forEach((cb) => cb());
    };

    return (
        <section id="hero" className={styles.hero} aria-label={t.sectionAria}>
            <div
                className={styles.stage}
                data-transition={transition}
                data-dir={dir}
                style={{ '--hero-dur': `${TRANSITION_MS}ms` } as React.CSSProperties}
                aria-hidden="true"
            >
                {heroImages.map((img, i) => (
                    <img
                        key={img.src}
                        src={img.src}
                        alt={t.imageAlts[img.i]}
                        decoding="async"
                        fetchPriority={i === 0 ? 'high' : 'low'}
                        className={`${styles.slide} ${i === index ? styles.active : i === leaving ? styles.leaving : ''} ${
                            leaving !== null && (i === index || i === leaving) ? styles.moving : ''
                        }`}
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

            {picker && (
                <div className={styles.picker} role="group" aria-label="Tipo di passaggio tra le foto">
                    {(Object.keys(TRANSITIONS) as Transition[]).map((tr) => (
                        <button key={tr} aria-pressed={tr === transition} onClick={() => pick(tr)}>
                            {TRANSITIONS[tr]}
                        </button>
                    ))}
                </div>
            )}

            <a href="#villa" className={styles.scrollCue} aria-label={t.scrollAria}>
                <span className={styles.scrollLine} aria-hidden="true" />
            </a>
        </section>
    );
};

export default Hero;
