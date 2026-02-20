import React from 'react';
import BookingBar from './BookingBar';
import styles from './Hero.module.css';

const Hero: React.FC = () => {
    return (
        <section id="hero" className={styles.hero}>
            <div className={styles.overlay}></div>
            <div className={styles.content}>
                <h1 className={styles.title}>Hidden Treasure</h1>
                <p className={styles.subtitle}>A minimalist sanctuary in Villasimius</p>
                <BookingBar />
            </div>
        </section>
    );
};

export default Hero;
