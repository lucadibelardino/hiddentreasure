import React, { useEffect, useRef } from 'react';
import { MAPS_URL, VILLA_COORDS } from '../data/location';
import { useT } from '../i18n';
import styles from './LocationMap.module.css';

/**
 * Mappa satellitare (Esri World Imagery) con Leaflet: niente chiave API e niente cookie di terze parti.
 * Leaflet si scarica solo quando la sezione sta per entrare nello schermo.
 * Il div della mappa non deve mai cambiare className da React: Leaflet ci
 * aggiunge le sue classi (leaflet-container…) e un re-render le cancellerebbe.
 */
const LocationMap: React.FC = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const dict = useT();
    const t = dict.map;
    const { attribution, openInMaps } = t;

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
                zoom: 15,
                scrollWheelZoom: false,      // la rotella scorre la pagina, non la mappa
                dragging: !L.Browser.mobile  // su telefono un dito scorre la pagina
            });

            // Vista satellitare Esri World Imagery: nessuna chiave API, basta l'attribuzione
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 18,
                attribution: `${attribution} &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a>, Maxar, Earthstar Geographics`
            }).addTo(map);

            const icon = L.divIcon({
                className: styles.pin,
                html: `<span class="${styles.pinDot}"></span>`,
                iconSize: [44, 44],
                iconAnchor: [22, 22]
            });
            L.marker(center, { icon, title: openInMaps, alt: 'Hidden Treasure' })
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
    }, [attribution, openInMaps]);

    return (
        <section id="dove-siamo" className={styles.section} aria-labelledby="dove-siamo-title">
            <div className="container">
                <header className={styles.head}>
                    <p className="eyebrow">{dict.common.place}</p>
                    <h2 id="dove-siamo-title" className={styles.title}>
                        {t.title} <em>{t.titleAccent}</em>
                    </h2>
                </header>
                <div className={styles.frame}>
                    <div ref={mapRef} className={styles.map} role="region" aria-label={t.aria} />
                </div>
            </div>
        </section>
    );
};

export default LocationMap;
