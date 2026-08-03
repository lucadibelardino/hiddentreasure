import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Header.module.css';

const Header: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const panelRef = useRef<HTMLElement>(null);
    const burgerRef = useRef<HTMLButtonElement>(null);

    const isHome = location.pathname === '/';
    // Testo chiaro solo quando c'e' davvero la hero scura dietro.
    // Su Galleria e Contatti il fondo e' chiaro: l'header e' sempre solido.
    const transparent = isHome && !scrolled;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Blocca lo scroll del body quando il menu mobile e' aperto
    useEffect(() => {
        if (!menuOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previous; };
    }, [menuOpen]);

    // Esc chiude il menu e riporta il fuoco sul burger
    useEffect(() => {
        if (!menuOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMenuOpen(false);
                burgerRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [menuOpen]);

    const goToSection = (e: React.MouseEvent, sectionId: string) => {
        e.preventDefault();
        setMenuOpen(false);
        const scrollToIt = () => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        if (!isHome) {
            navigate('/');
            window.setTimeout(scrollToIt, 120);
        } else {
            scrollToIt();
        }
    };

    const goTo = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        setMenuOpen(false);
        navigate(path);
    };

    const goHome = () => {
        setMenuOpen(false);
        if (!isHome) navigate('/');
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <header
            ref={panelRef}
            className={[
                styles.header,
                transparent ? styles.transparent : styles.solid,
                menuOpen ? styles.menuIsOpen : ''
            ].join(' ')}
        >
            <div className={`container ${styles.inner}`}>
                <button className={styles.logo} onClick={goHome} aria-label="Hidden Treasure — vai alla home">
                    <span className={styles.logoMark} aria-hidden="true" />
                    <span className={styles.logoText}>Hidden Treasure</span>
                </button>

                <nav className={styles.deskNav} aria-label="Principale">
                    <a href="#hero" className={styles.link} onClick={(e) => goToSection(e, 'hero')}>Home</a>
                    <a href="#villa" className={styles.link} onClick={(e) => goToSection(e, 'villa')}>La Villa</a>
                    <a href="/gallery" className={styles.link} onClick={(e) => goTo(e, '/gallery')}>Galleria</a>
                    <a href="/contatti" className={styles.cta} onClick={(e) => goTo(e, '/contatti')}>Prenota</a>
                </nav>

                <button
                    ref={burgerRef}
                    className={styles.burger}
                    onClick={() => setMenuOpen(true)}
                    aria-label="Apri il menu"
                    aria-expanded={menuOpen}
                    aria-controls="menu-mobile"
                >
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                </button>
            </div>

            {/* Menu mobile a tutto schermo */}
            <div
                id="menu-mobile"
                className={`${styles.mobileMenu} ${menuOpen ? styles.open : ''}`}
                hidden={!menuOpen}
            >
                <button className={styles.closeMenu} onClick={() => setMenuOpen(false)} aria-label="Chiudi il menu">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </button>

                <nav className={styles.mobileNav} aria-label="Principale mobile">
                    <a href="#hero" onClick={(e) => goToSection(e, 'hero')}>Home</a>
                    <a href="#villa" onClick={(e) => goToSection(e, 'villa')}>La Villa</a>
                    <a href="/gallery" onClick={(e) => goTo(e, '/gallery')}>Galleria</a>
                    <a href="/contatti" onClick={(e) => goTo(e, '/contatti')}>Contatti</a>
                </nav>

                <a href="/contatti" className={styles.mobileCta} onClick={(e) => goTo(e, '/contatti')}>
                    Prenota il soggiorno
                </a>

                <p className={styles.mobileMeta}>Villasimius · Sardegna</p>
            </div>
        </header>
    );
};

export default Header;
