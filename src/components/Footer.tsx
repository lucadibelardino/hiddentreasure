import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import { MAPS_URL } from '../data/location';
import { ROUTES, useLang, useT } from '../i18n';

const Footer: React.FC = () => {
    const lang = useLang();
    const dict = useT();
    const t = dict.footer;
    const h = dict.header;
    const r = ROUTES[lang];
    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.inner}`}>

                <div className={styles.brand}>
                    <p className={styles.name}>Hidden Treasure</p>
                    <p className={styles.claim}>
                        {t.claim}<br />
                        {t.place}
                    </p>
                </div>

                <nav className={styles.col} aria-label={t.pages}>
                    <p className={styles.colTitle}>{t.pages}</p>
                    <Link to={r.home}>{h.home}</Link>
                    <Link to={r.gallery}>{h.gallery}</Link>
                    <Link to={r.reviews}>{h.reviews}</Link>
                    <Link to={r.contact}>{h.contact}</Link>
                </nav>

                <div className={styles.col}>
                    <p className={styles.colTitle}>{t.writeUs}</p>
                    <a href="https://wa.me/393518085256" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                    <a href="mailto:gestionehtv@gmail.com">gestionehtv@gmail.com</a>
                    <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">{t.whereWeAre}</a>
                </div>

                <div className={styles.ctaCol}>
                    <p className={styles.colTitle}>{t.freeDates}</p>
                    <Link to={r.contact} className={styles.cta}>{t.askAvailability}</Link>
                </div>
            </div>

            <div className={`container ${styles.bottom}`}>
                <p>© {new Date().getFullYear()} Hidden Treasure Villasimius</p>
                <p className={styles.legal}>
                    <Link to={r.privacy}>{t.privacy}</Link>
                    <span className={styles.iun}>I.U.N. S0174</span>
                </p>
            </div>
        </footer>
    );
};

export default Footer;
