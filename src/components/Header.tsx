import React, { useState, useEffect } from 'react';
import styles from './Header.module.css';

const Header: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
            <div className={`container ${styles.container}`}>
                <div className={styles.logo}>Hidden Treasure</div>
                <nav className={styles.nav}>
                    <a href="#hero" className={styles.link}>Home</a>
                    <a href="#features" className={styles.link}>The Villa</a>
                    <a href="#gallery" className={styles.link}>Gallery</a>
                    <a href="#contact" className={styles.btn}>Book Now</a>
                </nav>
            </div>
        </header>
    );
};

export default Header;
