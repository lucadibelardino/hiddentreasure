import React from 'react';
import styles from './Features.module.css';

const featuresList = [
    { title: "3 Bedrooms", description: "Spacious and filled with natural light." },
    { title: "2 Bathrooms", description: "Modern fittings with rain showers." },
    { title: "Private Garden", description: "A lush oasis for relaxation." },
    { title: "Beach Access", description: "Just a 5-minute walk to the sea." },
    { title: "Air Conditioning", description: "Climate control in every room." },
    { title: "Fast Wi-Fi", description: "Stay connected while you unwind." }
];

const Features: React.FC = () => {
    return (
        <section id="features" className={styles.section}>
            <div className="container">
                <h2 className={styles.title}>The Villa</h2>
                <div className={styles.grid}>
                    {featuresList.map((feature, index) => (
                        <div key={index} className={styles.card}>
                            <h3 className={styles.cardTitle}>{feature.title}</h3>
                            <p className={styles.cardDescription}>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
