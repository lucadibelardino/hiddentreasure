import React, { useEffect, useRef, useState } from 'react';
import useReveal from '../hooks/useReveal';
import { DIRECTIONS_URL, MAPS_URL, VILLA_COORDS } from '../data/location';
import styles from './LocationMap.module.css';

const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` } as React.CSSProperties);

const places = [
    { label: 'Il mare', value: 'A fine prato', note: 'La spiaggia semiprivata inizia dove finisce il giardino.' },
    { label: 'Villasimius', value: 'Pochi minuti', note: 'Il centro del paese, con negozi e ristoranti, è a circa 4 km.' },
    { label: 'Cagliari', value: 'Circa un’ora', note: 'In auto dall’aeroporto di Cagliari-Elmas, lungo la costa.' }
];

/**
 * Mappa OpenStreetMap con Leaflet: niente chiave API e niente cookie di terze parti.
 * Leaflet viene scaricato solo quando la sezione sta per entrare nello schermo,
 * così non pesa sul caricamento della home.
 */
const useLeafletMap = (container: React.RefObject<HTMLDivElement | null>) => {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const el = container.current;
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
                zoom: 14,
                scrollWheelZoom: false,      // la rotella scorre la pagina, non la mappa
                dragging: !L.Browser.mobile, // su telefono si scorre la pagina con un dito
                attributionControl: true
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
            L.marker(center, { icon, title: 'Hidden Treasure', alt: 'Hidden Treasure, la villa' })
                .addTo(map)
                .bindTooltip('Hidden Treasure', { direction: 'top', offset: [0, -14], permanent: true, className: styles.tooltip });

            setReady(true);
        };

        if (!('IntersectionObserver' in window)) {
            load();
        } else {
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
        }

        return () => {
            cancelled = true;
            map?.remove();
        };
    }, [container]);

    return ready;
};

const LocationMap: React.FC = () => {
    const ref = useReveal<HTMLElement>();
    const mapRef = useRef<HTMLDivElement>(null);
    const ready = useLeafletMap(mapRef);

    return (
        <section id="dove-siamo" ref={ref} className={styles.section} aria-labelledby="dove-siamo-title">
            <div className="container">
                <header className={styles.head}>
                    <p className="eyebrow reveal">Dove siamo</p>
                    <h2 id="dove-siamo-title" className={`${styles.title} reveal`} style={delay(60)}>
                        Villasimius, <em>sulla costa sud-est</em> della Sardegna
                    </h2>
                </header>

                <div className={styles.grid}>
                    <div className={`${styles.mapFrame} reveal`} style={delay(120)}>
                        <div
                            ref={mapRef}
                            className={`${styles.map} ${ready ? styles.mapReady : ''}`}
                            role="region"
                            aria-label="Mappa con la posizione della villa"
                        />
                        {!ready && (
                            <a className={styles.placeholder} href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                                Caricamento mappa…
                            </a>
                        )}
                    </div>

                    <div className={styles.info}>
                        <dl className={styles.places}>
                            {places.map((p, i) => (
                                <div key={p.label} className={`${styles.place} reveal`} style={delay(160 + i * 60)}>
                                    <dt className={styles.placeLabel}>{p.label}</dt>
                                    <dd className={styles.placeBody}>
                                        <span className={styles.placeValue}>{p.value}</span>
                                        <span className={styles.placeNote}>{p.note}</span>
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        <div className={`${styles.actions} reveal`} style={delay(340)}>
                            <a className={styles.primary} href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">
                                Indicazioni stradali
                            </a>
                            <a className={styles.secondary} href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                                Apri in Google Maps
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LocationMap;
