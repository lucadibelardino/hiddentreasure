import React from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
    return (
        <footer className={styles.footer}>
            <div className="container">
                <div className={styles.content}>
                    <div className={styles.brand}>
                        <h3>Hidden Treasure</h3>
                        <p>Villasimius, Sardinia</p>
                    </div>
                    <div className={styles.links}>
                        <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
                        <a href="mailto:info@hiddentreasure.com">Email Us</a>
                    </div>
                </div>
                <div className={styles.copyright}>
                    &copy; {new Date().getFullYear()} Hidden Treasure Villasimius. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
