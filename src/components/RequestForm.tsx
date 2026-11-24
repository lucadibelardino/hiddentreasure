import React, { useEffect, useMemo, useState } from 'react';
import { DayPicker, type DateRange, type Matcher } from 'react-day-picker';
import { it, enGB, de, fr } from 'react-day-picker/locale';
import { LOCALES, useLang, useT } from '../i18n';
import 'react-day-picker/style.css';
import styles from './RequestForm.module.css';

/** Il Worker Cloudflare che salva la richiesta in D1 e manda la mail di notifica. */
const ENDPOINT = 'https://richieste.luca-dibelardino.workers.dev';
const MAX_GUESTS = 10;
const WHATSAPP = 'https://wa.me/393518085256';
const DAY_PICKER_LOCALES = { it, en: enGB, de, fr };

type Status = 'idle' | 'sending' | 'ok' | 'error';

interface Availability {
    blocked: { from: string; to: string }[];
}

/** Data locale -> "2027-07-15" (senza passare da UTC, che sposterebbe il giorno). */
const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

const nightsBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000);

const RequestForm: React.FC = () => {
    const lang = useLang();
    const t = useT().request;

    const [blocked, setBlocked] = useState<Date[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<DateRange | undefined>();
    const [guests, setGuests] = useState(2);
    const [status, setStatus] = useState<Status>('idle');
    const [datesError, setDatesError] = useState(false);
    const [sentName, setSentName] = useState('');

    // Notti occupate, dal calendario Airbnb sincronizzato (public/availability.json)
    useEffect(() => {
        const controller = new AbortController();
        fetch(`${import.meta.env.BASE_URL}availability.json`, { signal: controller.signal, cache: 'no-cache' })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
            .then((data: Availability) => {
                const nights: Date[] = [];
                data.blocked?.forEach(({ from, to }) => {
                    const end = new Date(`${to}T00:00:00`);
                    // "to" e' il giorno di partenza: quella notte e' di nuovo libera
                    for (const d = new Date(`${from}T00:00:00`); d < end; d.setDate(d.getDate() + 1)) {
                        nights.push(new Date(d));
                    }
                });
                setBlocked(nights);
            })
            .catch((err) => {
                if (err.name !== 'AbortError') console.error('Date occupate non disponibili:', err);
            })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, []);

    /*
     * Quali giorni si possono cliccare.
     * - Arrivo: qualsiasi notte libera da oggi in poi.
     * - Partenza: dopo l'arrivo e fino alla prima notte occupata compresa,
     *   perche' si puo' partire la mattina in cui arriva qualcun altro.
     */
    const disabled = useMemo<Matcher[]>(() => {
        const today = startOfToday();
        if (range?.from && !range.to) {
            const from = range.from;
            const nextBusy = blocked.find((d) => d > from);
            return nextBusy ? [{ before: from }, { after: nextBusy }] : [{ before: from }];
        }
        return [{ before: today }, ...blocked];
    }, [blocked, range]);

    const onSelect = (next: DateRange | undefined, day: Date) => {
        setDatesError(false);
        // Con un periodo gia' completo, un nuovo clic riparte da un nuovo arrivo
        if (range?.from && range.to) {
            setRange({ from: day, to: undefined });
            return;
        }
        // Stesso giorno due volte: resta solo l'arrivo
        if (next?.from && next.to && toISO(next.from) === toISO(next.to)) {
            setRange({ from: next.from, to: undefined });
            return;
        }
        setRange(next);
    };

    /* "dom 10 gen" -> "Dom 10 gen" */
    const fmt = (d: Date) => {
        const s = d.toLocaleDateString(LOCALES[lang], { weekday: 'short', day: 'numeric', month: 'short' });
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const nights = range?.from && range.to ? nightsBetween(range.from, range.to) : 0;

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!range?.from || !range.to) {
            setDatesError(true);
            document.getElementById('rf-dates')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        const form = new FormData(e.currentTarget);
        const nome = String(form.get('name') || '').trim();
        setStatus('sending');
        try {
            const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome,
                    email: String(form.get('email') || '').trim(),
                    telefono: String(form.get('tel') || '').trim(),
                    check_in: toISO(range.from),
                    check_out: toISO(range.to),
                    ospiti: guests,
                    messaggio: String(form.get('message') || '').trim(),
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
                {range?.from && range.to && (
                    <p className={styles.doneDates}>
                        {fmt(range.from)} → {fmt(range.to)} · {t.nights(nights)}
                    </p>
                )}
                <button type="button" className={styles.linkBtn} onClick={() => { setStatus('idle'); setRange(undefined); }}>
                    {t.another}
                </button>
            </div>
        );
    }

    const sending = status === 'sending';

    return (
        <form className={styles.form} onSubmit={onSubmit} autoComplete="on">
            {/* ── Date ─────────────────────────── */}
            <fieldset id="rf-dates" className={`${styles.panel} ${styles.datesPanel}`}>
                <legend className={styles.legend}>{t.datesLabel}</legend>

                <div className={styles.summary} aria-live="polite">
                    <div className={`${styles.when} ${range?.from && !range.to ? styles.whenActive : ''}`}>
                        <span className={styles.whenLabel}>{t.checkIn}</span>
                        <span className={styles.whenValue}>{range?.from ? fmt(range.from) : '—'}</span>
                    </div>
                    <span className={styles.whenArrow} aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </span>
                    <div className={styles.when}>
                        <span className={styles.whenLabel}>{t.checkOut}</span>
                        <span className={styles.whenValue}>{range?.to ? fmt(range.to) : '—'}</span>
                    </div>
                    <span className={styles.nights}>
                        {nights > 0 ? t.nights(nights) : range?.from ? t.pickCheckOut : t.pickDates}
                    </span>
                </div>

                <div className={styles.calendarWrap}>
                    {loading ? (
                        <p className={styles.loading}>{t.loading}</p>
                    ) : (
                        <DayPicker
                            mode="range"
                            selected={range}
                            onSelect={onSelect}
                            disabled={disabled}
                            locale={DAY_PICKER_LOCALES[lang]}
                                                        showOutsideDays={false}
                            startMonth={startOfToday()}
                            className={styles.calendar}
                        />
                    )}
                </div>

                <div className={styles.datesFoot}>
                    {datesError ? (
                        <p className={styles.error} role="alert">{t.missingDates}</p>
                    ) : <span />}
                    {range?.from && (
                        <button type="button" className={styles.linkBtn} onClick={() => setRange(undefined)}>
                            {t.clearDates}
                        </button>
                    )}
                </div>
            </fieldset>

            {/* ── Dati ─────────────────────────── */}
            <div className={`${styles.panel} ${styles.detailsPanel}`}>
                <div className={styles.guests}>
                    <div>
                        <span className={styles.label} id="rf-guests-label">{t.guests}</span>
                        <span className={styles.hint}>{t.guestsHint}</span>
                    </div>
                    <div className={styles.stepper} role="group" aria-labelledby="rf-guests-label">
                        <button type="button" className={styles.stepBtn} onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1} aria-label={t.fewer}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /></svg>
                        </button>
                        <output className={styles.stepValue} aria-live="polite">{guests}</output>
                        <button type="button" className={styles.stepBtn} onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))} disabled={guests >= MAX_GUESTS} aria-label={t.more}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        </button>
                    </div>
                </div>

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
