import React, { useEffect, useRef } from 'react';
import { MAPS_URL, VILLA_COORDS } from '../data/location';
import styles from './LocationMap.module.css';

/**
 * Mappa OpenStreetMap con Leaflet: niente chiave API e niente cookie di terze parti.
 * Leaflet si scarica solo quando la sezione sta per entrare nello schermo.
 * Il div della mappa non deve mai cambiare className da React: Leaflet ci
 * aggiunge le sue classi (leaflet-container…) e un re-render le cancellerebbe.
 */
const LocationMap: React.FC = () => {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = mapRef.current;
        if (!el) return;

        let map: import('leaflet').Map | undefined;
        let cancelled = false;

        const load = async () => {
            const [{ default: L }] = await Promise.all([
                import('leaflet'),
                import('leaflet/dist/leaflet.css')
            ]);
            if (cancelled) return;

            const center: [number, number] = [VILLA_COORDS.lat, VILLA_COORDS.lng];
            map = L.map(el, {
                center,
                zoom: 13,
                scrollWheelZoom: false,      // la rotella scorre la pagina, non la mappa
                dragging: !L.Browser.mobile  // su telefono un dito scorre la pagina
            });

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
            }).addTo(map);

            const icon = L.divIcon({
                className: styles.pin,
                html: `<span class="${styles.pinDot}"></span>`,
                iconSize: [44, 44],
                iconAnchor: [22, 22]
            });
            L.marker(center, { icon, title: 'Apri in Google Maps', alt: 'Hidden Treasure' })
                .addTo(map)
                .on('click', () => window.open(MAPS_URL, '_blank', 'noopener'));
        };

        if (!('IntersectionObserver' in window)) {
            load();
            return () => {
                cancelled = true;
                map?.remove();
            };
        }

        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    io.disconnect();
                    load();
                }
            },
            { rootMargin: '400px 0px' }
        );
        io.observe(el);
        return () => {
            cancelled = true;
            io.disconnect();
            map?.remove();
        };
    }, []);

    return (
        <section id="dove-siamo" className={styles.section} aria-label="Dove siamo">
            <div className="container">
                <div className={styles.frame}>
                    <div ref={mapRef} className={styles.map} role="region" aria-label="Mappa con la posizione della villa a Villasimius" />
                </div>
            </div>
        </section>
    );
};

export default LocationMap;
