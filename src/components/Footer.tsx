import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const MAPS_URL =
    'https://www.google.com/maps/place/Hidden+treasure+villasimius+(I.U.N.+S0174)/@39.1074963,9.0945192,51316m/data=!3m1!1e3!4m6!3m5!1s0x12e0c33df2d8c7bd:0xe25528c67767b9eb!8m2!3d39.1085644!4d9.5031886!16s%2Fg%2F11sbspqsr8';

const Footer: React.FC = () => (
    <footer className={styles.footer}>
        <div className={`container ${styles.inner}`}>

            <div className={styles.brand}>
                <p className={styles.name}>Hidden Treasure</p>
                <p className={styles.claim}>
                    Il giardino finisce dove inizia la spiaggia.<br />
                    Villasimius, Sardegna.
                </p>
            </div>

            <nav className={styles.col} aria-label="Pagine">
                <p className={styles.colTitle}>Pagine</p>
                <Link to="/">Home</Link>
                <Link to="/gallery">Galleria</Link>
                <Link to="/contatti">Contatti</Link>
            </nav>

            <div className={styles.col}>
                <p className={styles.colTitle}>Scrivici</p>
                <a href="https://wa.me/393518085256" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <a href="mailto:gestionehtv@gmail.com">gestionehtv@gmail.com</a>
                <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">Dove siamo</a>
            </div>

            <div className={styles.ctaCol}>
                <p className={styles.colTitle}>Date libere?</p>
                <Link to="/contatti" className={styles.cta}>Chiedi disponibilità</Link>
            </div>
        </div>

        <div className={`container ${styles.bottom}`}>
            <p>© {new Date().getFullYear()} Hidden Treasure Villasimius</p>
            <p className={styles.iun}>I.U.N. S0174</p>
        </div>
    </footer>
);

export default Footer;
