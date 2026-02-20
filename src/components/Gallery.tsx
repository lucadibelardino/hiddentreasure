import React from 'react';
import styles from './Gallery.module.css';

const images = [
    'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=800', // Interior
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800', // Bedroom
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800', // Bathroom
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800', // Beach
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800', // Garden
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800', // Patio
];

const Gallery: React.FC = () => {
    return (
        <section id="gallery" className={styles.section}>
            <div className="container">
                <h2 className={styles.title}>Gallery</h2>
                <div className={styles.grid}>
                    {images.map((src, index) => (
                        <div key={index} className={styles.item}>
                            <img src={src} alt={`Gallery image ${index + 1}`} loading="lazy" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Gallery;
