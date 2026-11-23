import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LANGS, LANG_NAMES, ROUTES, pageFromPath, useLang, useT, type Lang } from '../i18n';
import styles from './Header.module.css';

/** Selettore lingua: porta alla stessa pagina nell'altra lingua. */
const LanguageSwitcher: React.FC<{ onPick?: () => void; variant: 'desk' | 'mobile' }> = ({ onPick, variant }) => {
    const lang = useLang();
    const t = useT().header;
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);
    const page = pageFromPath(pathname) ?? 'home';
    const hrefFor = (l: Lang) => ROUTES[l][page];

    // Chiude la tendina con un clic fuori o con Esc
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDown);
        window.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            window.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const pick = () => { setOpen(false); onPick?.(); };

    if (variant === 'mobile') {
        return (
            <nav className={styles.mobileLangs} aria-label={t.chooseLanguage}>
                {LANGS.map((l) => (
                    <Link
                        key={l}
                        to={hrefFor(l)}
                        hrefLang={l}
                        lang={l}
                        aria-current={l === lang ? 'true' : undefined}
                        aria-label={LANG_NAMES[l]}
                        onClick={pick}
                    >
                        {l.toUpperCase()}
                    </Link>
                ))}
            </nav>
        );
    }

    return (
        <div className={styles.lang} ref={boxRef}>
            <button
                type="button"
                className={styles.langBtn}
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="lang-menu"
                aria-label={`${t.language}: ${LANG_NAMES[lang]}`}
            >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
                </svg>
                <span>{lang.toUpperCase()}</span>
            </button>
            <ul id="lang-menu" className={styles.langMenu} hidden={!open}>
                {LANGS.map((l) => (
                    <li key={l}>
                        <Link
                            to={hrefFor(l)}
                            hrefLang={l}
                            lang={l}
                            aria-current={l === lang ? 'true' : undefined}
                            onClick={pick}
                        >
                            <span className={styles.langCode}>{l.toUpperCase()}</span>
                            {LANG_NAMES[l]}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

/* Avviso in inglese sotto il selettore lingua: compare una volta per sessione
   sulle pagine in italiano, sparisce da solo dopo 4 secondi o con la X. */
const HINT_DELAY_MS = 800;
const HINT_VISIBLE_MS = 4000;
const HINT_KEY = 'ht-lang-hint-seen';

const LangHint: React.FC = () => {
    const lang = useLang();
    const { pathname } = useLocation();
    const [visible, setVisible] = useState(false);
    const page = pageFromPath(pathname) ?? 'home';

    useEffect(() => {
        if (lang !== 'it') return;
        try {
            if (sessionStorage.getItem(HINT_KEY)) return;
            sessionStorage.setItem(HINT_KEY, '1');
        } catch { /* storage bloccato: l'avviso compare comunque */ }
        const show = window.setTimeout(() => setVisible(true), HINT_DELAY_MS);
        return () => window.clearTimeout(show);
        // Solo al primo caricamento: cambiare pagina non lo fa ricomparire
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!visible) return;
        const hide = window.setTimeout(() => setVisible(false), HINT_VISIBLE_MS);
        return () => window.clearTimeout(hide);
    }, [visible]);

    // Se si passa a un'altra lingua l'avviso non serve piu'
    if (!visible || lang !== 'it') return null;

    return (
        <div className={styles.hint} role="status" lang="en">
            <svg className={styles.hintIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
            </svg>
            <p className={styles.hintText}>
                This site is also available in{' '}
                <Link to={ROUTES.en[page]} hrefLang="en" onClick={() => setVisible(false)}>English</Link>,{' '}
                <Link to={ROUTES.de[page]} hrefLang="de" lang="de" onClick={() => setVisible(false)}>Deutsch</Link> and{' '}
                <Link to={ROUTES.fr[page]} hrefLang="fr" lang="fr" onClick={() => setVisible(false)}>Français</Link>.
            </p>
            <button type="button" className={styles.hintClose} onClick={() => setVisible(false)} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                </svg>
            </button>
            <span className={styles.hintTimer} style={{ animationDuration: `${HINT_VISIBLE_MS}ms` }} aria-hidden="true" />
        </div>
    );
};

const Header: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const panelRef = useRef<HTMLElement>(null);
    const burgerRef = useRef<HTMLButtonElement>(null);

    const lang = useLang();
    const dict = useT();
    const t = dict.header;
    const routes = ROUTES[lang];
    const isHome = pageFromPath(location.pathname) === 'home';
    // Testo chiaro solo quando c'e' davvero la hero scura dietro.
    // Su Galleria, Recensioni e Contatti il fondo e' chiaro: l'header e' sempre solido.
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
            navigate(routes.home);
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
        if (!isHome) navigate(routes.home);
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
                <button className={styles.logo} onClick={goHome} aria-label={t.homeAria}>
                    <span className={styles.logoMark} aria-hidden="true" />
                    <span className={styles.logoText}>Hidden Treasure</span>
                </button>

                <nav className={styles.deskNav} aria-label={t.navAria}>
                    <a href={routes.home} className={styles.link} onClick={(e) => goToSection(e, 'hero')}>{t.home}</a>
                    <a href={`${routes.home}#villa`} className={styles.link} onClick={(e) => goToSection(e, 'villa')}>{t.villa}</a>
                    <a href={routes.gallery} className={styles.link} onClick={(e) => goTo(e, routes.gallery)}>{t.gallery}</a>
                    <a href={routes.reviews} className={styles.link} onClick={(e) => goTo(e, routes.reviews)}>{t.reviews}</a>
                    <a href={routes.contact} className={styles.link} onClick={(e) => goTo(e, routes.contact)}>{t.contact}</a>
                    <a href={routes.contact} className={styles.cta} onClick={(e) => goTo(e, routes.contact)}>{t.book}</a>
                    <LanguageSwitcher variant="desk" />
                </nav>

                <button
                    ref={burgerRef}
                    className={styles.burger}
                    onClick={() => setMenuOpen(true)}
                    aria-label={t.openMenu}
                    aria-expanded={menuOpen}
                    aria-controls="menu-mobile"
                >
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                </button>

                <LangHint />
            </div>

            {/* Menu mobile a tutto schermo */}
            <div
                id="menu-mobile"
                className={`${styles.mobileMenu} ${menuOpen ? styles.open : ''}`}
                hidden={!menuOpen}
            >
                <button className={styles.closeMenu} onClick={() => setMenuOpen(false)} aria-label={t.closeMenu}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </button>

                <nav className={styles.mobileNav} aria-label={t.navMobileAria}>
                    <a href={routes.home} onClick={(e) => goToSection(e, 'hero')}>{t.home}</a>
                    <a href={`${routes.home}#villa`} onClick={(e) => goToSection(e, 'villa')}>{t.villa}</a>
                    <a href={routes.gallery} onClick={(e) => goTo(e, routes.gallery)}>{t.gallery}</a>
                    <a href={routes.reviews} onClick={(e) => goTo(e, routes.reviews)}>{t.reviews}</a>
                    <a href={routes.contact} onClick={(e) => goTo(e, routes.contact)}>{t.contact}</a>
                </nav>

                <a href={routes.contact} className={styles.mobileCta} onClick={(e) => goTo(e, routes.contact)}>
                    {t.bookStay}
                </a>

                <LanguageSwitcher variant="mobile" onPick={() => setMenuOpen(false)} />

                <p className={styles.mobileMeta}>{dict.common.place}</p>
            </div>
        </header>
    );
};

export default Header;
