import React, { useState } from 'react';
import { useLang, useT } from '../i18n';
import { formatDay, guestsLabel, nightsBetween, totalGuests, type Guests } from '../booking/availability';
import styles from './RequestForm.module.css';

/** Il Worker Cloudflare che salva la richiesta in D1 e manda la mail di notifica. */
const ENDPOINT = 'https://richieste.luca-dibelardino.workers.dev';
const WHATSAPP = 'https://wa.me/393518085256';

type Status = 'idle' | 'sending' | 'ok' | 'error';

/** Data locale -> "2027-07-15" (senza passare da UTC, che sposterebbe il giorno). */
const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface Props {
    from: Date;
    to: Date;
    guests: Guests;
    /** Riapre la barra per cambiare date o ospiti. */
    onEdit: () => void;
    /** Dopo l'invio, "Invia un'altra richiesta" riparte da zero. */
    onReset: () => void;
}

/** Secondo passo: date e ospiti arrivano dalla barra, qui solo i recapiti. */
const RequestForm: React.FC<Props> = ({ from, to, guests, onEdit, onReset }) => {
    const lang = useLang();
    const t = useT().request;
    const ts = useT().search;

    const [status, setStatus] = useState<Status>('idle');
    const [sentName, setSentName] = useState('');

    const fmt = (d: Date) => formatDay(d, lang);
    const nights = nightsBetween(from, to);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const nome = String(form.get('name') || '').trim();
        // Il Worker conta adulti + bambini; il dettaglio va in testa al messaggio per Luca
        const dettaglio = `Ospiti: ${guests.adults} adulti, ${guests.children} bambini, ${guests.infants} neonati`;
        const testo = String(form.get('message') || '').trim();
        setStatus('sending');
        try {
            const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome,
                    email: String(form.get('email') || '').trim(),
                    telefono: String(form.get('tel') || '').trim(),
                    check_in: toISO(from),
                    check_out: toISO(to),
                    ospiti: totalGuests(guests),
                    messaggio: testo ? `${dettaglio}\n\n${testo}` : dettaglio,
                    lingua: lang,
                    sito: String(form.get('sito') || ''),
                }),
            });
            if (!res.ok) throw new Error(`Risposta ${res.status}`);
            setSentName(nome.split(' ')[0]);
            setStatus('ok');
        } catch (err) {
            console.error('Richiesta non inviata:', err);
            setStatus('error');
        }
    };

    if (status === 'ok') {
        return (
            <div className={styles.done} role="status">
                <span className={styles.doneIcon} aria-hidden="true">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                </span>
                <h2 className={styles.doneTitle}>{t.okTitle}</h2>
                <p className={styles.doneText}>{t.okText(sentName)}</p>
                <p className={styles.doneDates}>
                    {fmt(from)} → {fmt(to)} · {t.nights(nights)}
                </p>
                <button type="button" className={styles.linkBtn} onClick={onReset}>
                    {t.another}
                </button>
            </div>
        );
    }

    const sending = status === 'sending';

    return (
        <form className={styles.form} onSubmit={onSubmit} autoComplete="on">
            {/* ── Riepilogo del soggiorno ─────── */}
            <aside className={`${styles.panel} ${styles.stayPanel}`}>
                <p className={styles.legend}>{ts.stay}</p>

                <div className={styles.summary}>
                    <div className={styles.when}>
                        <span className={styles.whenLabel}>{t.checkIn}</span>
                        <span className={styles.whenValue}>{fmt(from)}</span>
                    </div>
                    <span className={styles.whenArrow} aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </span>
                    <div className={styles.when}>
                        <span className={styles.whenLabel}>{t.checkOut}</span>
                        <span className={styles.whenValue}>{fmt(to)}</span>
                    </div>
                    <span className={styles.nights}>
                        {t.nights(nights)} · {guestsLabel(guests, ts)}
                    </span>
                </div>

                <button type="button" className={styles.linkBtn} onClick={onEdit}>
                    {ts.edit}
                </button>
            </aside>

            {/* ── Dati ─────────────────────────── */}
            <div className={`${styles.panel} ${styles.detailsPanel}`}>
                <p className={styles.legend}>{ts.details}</p>

                <label className={styles.field}>
                    <span className={styles.label}>{t.name}</span>
                    <input
                        className={styles.input}
                        name="name"
                        type="text"
                        autoComplete="name"
                        autoCapitalize="words"
                        enterKeyHint="next"
                        required
                        maxLength={120}
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>{t.email}</span>
                    <input
                        className={styles.input}
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="off"
                        spellCheck={false}
                        enterKeyHint="next"
                        required
                        maxLength={160}
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>
                        {t.phone} <span className={styles.optional}>· {t.optional}</span>
                    </span>
                    <input
                        className={styles.input}
                        name="tel"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        enterKeyHint="next"
                        maxLength={40}
                        placeholder="+39 …"
                    />
                    <span className={styles.hint}>{t.phoneHint}</span>
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>
                        {t.message} <span className={styles.optional}>· {t.optional}</span>
                    </span>
                    <textarea
                        className={`${styles.input} ${styles.textarea}`}
                        name="message"
                        rows={4}
                        maxLength={2000}
                        placeholder={t.messagePlaceholder}
                    />
                </label>

                {/* Trappola anti-spam: invisibile alle persone, i bot la compilano */}
                <div className={styles.trap} aria-hidden="true">
                    <label>
                        Sito web
                        <input name="sito" type="text" tabIndex={-1} autoComplete="off" />
                    </label>
                </div>

                {status === 'error' && (
                    <p className={styles.error} role="alert">
                        {t.errorText}{' '}
                        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                    </p>
                )}

                <button type="submit" className={styles.submit} disabled={sending}>
                    {sending ? t.sending : t.submit}
                </button>
                <p className={styles.note}>{t.note}</p>
            </div>
        </form>
    );
};

export default RequestForm;
