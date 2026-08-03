import React from 'react';
import useReveal from '../hooks/useReveal';
import styles from './ContactPage.module.css';

/* Il messaggio arriva gia' scritto: chi contatta fa meno fatica
   e noi riceviamo subito periodo e numero di persone. */
const PREFILLED = encodeURIComponent(
    'Salve, vorrei informazioni su Hidden Treasure per il periodo ____, siamo in ____ persone.'
);

const contacts = [
    { label: 'Numero 1', display: '+39 351 808 5256', raw: '393518085256' },
    { label: 'Numero 2', display: '+39 347 713 6981', raw: '393477136981' }
];

const facts = [
    { value: '7 notti', label: 'Soggiorno minimo in alta stagione' },
    { value: 'IT / EN', label: 'Si parla italiano e inglese' },
    { value: 'Diretta', label: 'Nessuna commissione di piattaforma' }
];

const MAPS_URL =
    'https://www.google.com/maps/place/Hidden+treasure+villasimius+(I.U.N.+S0174)/@39.1074963,9.0945192,51316m/data=!3m1!1e3!4m6!3m5!1s0x12e0c33df2d8c7bd:0xe25528c67767b9eb!8m2!3d39.1085644!4d9.5031886!16s%2Fg%2F11sbspqsr8';

const WhatsAppIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const Arrow = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
);

const ContactPage: React.FC = () => {
    const ref = useReveal<HTMLElement>();

    return (
        <main ref={ref} className={styles.page}>
            <div className={`container ${styles.container}`}>

                <header className={styles.header}>
                    <p className="eyebrow">Contatti</p>
                    <h1 className={styles.title}>Rispondiamo <em>noi</em>, non un portale</h1>
                    <p className={styles.subtitle}>
                        Dicci il periodo e quante persone siete: ti diciamo se la villa è libera
                        e quanto costa il soggiorno, senza commissioni di intermediazione.
                    </p>
                </header>

                {/* Canale principale */}
                <section className={`${styles.primary} reveal`} aria-labelledby="wa-title">
                    <div className={styles.primaryHead}>
                        <span className={styles.primaryIcon}><WhatsAppIcon /></span>
                        <div>
                            <p className={styles.primaryEyebrow}>Il modo più rapido</p>
                            <h2 id="wa-title" className={styles.primaryTitle}>Scrivici su WhatsApp</h2>
                        </div>
                    </div>

                    <div className={styles.numbers}>
                        {contacts.map((c) => (
                            <a
                                key={c.raw}
                                href={`https://wa.me/${c.raw}?text=${PREFILLED}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.numberBtn}
                            >
                                <span className={styles.numberValue}>{c.display}</span>
                                <Arrow />
                            </a>
                        ))}
                    </div>

                    <p className={styles.primaryFoot}>
                        Preferisci parlare?{' '}
                        {contacts.map((c, i) => (
                            <React.Fragment key={c.raw}>
                                {i > 0 && <span aria-hidden="true"> · </span>}
                                <a href={`tel:+${c.raw}`} className={styles.telLink}>
                                    Chiama {c.display}
                                </a>
                            </React.Fragment>
                        ))}
                    </p>
                </section>

                {/* Canali secondari */}
                <div className={styles.secondary}>
                    <a href="mailto:gestionehtv@gmail.com" className={`${styles.card} reveal`}>
                        <span className={styles.cardKind}>Email</span>
                        <span className={styles.cardValue}>gestionehtv@gmail.com</span>
                        <span className={styles.cardAction}>Scrivi una mail <Arrow /></span>
                    </a>

                    <a
                        href="https://www.airbnb.it/rooms/38283678"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.card} reveal`}
                        style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
                    >
                        <span className={styles.cardKind}>Airbnb</span>
                        <span className={styles.cardValue}>Recensioni e annuncio</span>
                        <span className={styles.cardAction}>Apri su Airbnb <Arrow /></span>
                    </a>
                </div>

                {/* Informazioni pratiche */}
                <section className={`${styles.facts} reveal`} aria-label="Informazioni pratiche">
                    {facts.map((f) => (
                        <div key={f.value} className={styles.fact}>
                            <p className={styles.factValue}>{f.value}</p>
                            <p className={styles.factLabel}>{f.label}</p>
                        </div>
                    ))}
                </section>

                <p className={styles.where}>
                    Hidden Treasure · Villasimius, Sardegna ·{' '}
                    <a className={styles.mapLink} href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                        Vedi sulla mappa
                    </a>
                </p>
            </div>
        </main>
    );
};

export default ContactPage;
