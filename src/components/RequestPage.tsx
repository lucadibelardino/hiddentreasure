import React from 'react';
import RequestForm from './RequestForm';
import { useT } from '../i18n';
import styles from './RequestForm.module.css';

/** Pagina di prova del modulo di richiesta (/provabanner): non e' nel menu ne' nella sitemap. */
const RequestPage: React.FC = () => {
    const t = useT().request;
    return (
        <main className={styles.page}>
            <div className={`container ${styles.container}`}>
                <header className={styles.header}>
                    <p className="eyebrow">{t.eyebrow}</p>
                    <h1 className={styles.title}>
                        {t.title}
                        <em>{t.titleAccent}</em>
                    </h1>
                    <p className={styles.subtitle}>{t.subtitle}</p>
                </header>
                <RequestForm />
            </div>
        </main>
    );
};

export default RequestPage;
