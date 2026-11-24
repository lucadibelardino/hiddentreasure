import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker, type DateRange } from 'react-day-picker';
import { it, enGB, de, fr } from 'react-day-picker/locale';
import { useLang, useT } from '../i18n';
import {
    formatEuro,
    minNightsFrom,
    quote,
    type Pricing,
    formatDay,
    formatDayShort,
    guestsLabel,
    nightsBetween,
    pickDay,
    startOfToday,
    totalGuests,
    useDisabledDays,
    type Field,
    type Guests,
} from '../booking/availability';
import 'react-day-picker/style.css';
import styles from './BookingSearch.module.css';

const DAY_PICKER_LOCALES = { it, en: enGB, de, fr };
const MAX_INFANTS = 3;

export interface BookingSearchHandle {
    /** Riapre la barra sulle date (pulsante "Modifica" del riepilogo). */
    open: () => void;
}

interface Props {
    range: DateRange | undefined;
    onRangeChange: (r: DateRange | undefined) => void;
    guests: Guests;
    onGuestsChange: (g: Guests) => void;
    blocked: Date[];
    loading: boolean;
    /** Prezzi e notti minime dal Worker (null se non disponibili). */
    pricing: Pricing | null;
    maxGuests: number;
    /** Date complete e pulsante "Verifica" premuto. */
    onSearch: () => void;
    /** Nasconde la barra fissa in basso sul telefono (quando il modulo e' gia' aperto). */
    hideMobileBar?: boolean;
    ref?: React.Ref<BookingSearchHandle>;
}

/** true sotto i 744px: barra in basso e pannello a tutto schermo al posto dei popover. */
function useIsPhone() {
    const [phone, setPhone] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 743px)');
        const update = () => setPhone(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);
    return phone;
}

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l4.5 4.5" />
    </svg>
);

const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
    </svg>
);

/* ── Righe con − e + ─────────────────────────────── */
const Stepper: React.FC<{
    id: string;
    label: string;
    hint: string;
    value: number;
    min: number;
    canAdd: boolean;
    onChange: (n: number) => void;
}> = ({ id, label, hint, value, min, canAdd, onChange }) => {
    const t = useT().search;
    return (
        <div className={styles.stepRow}>
            <div>
                <span className={styles.stepLabel} id={id}>{label}</span>
                <span className={styles.stepHint}>{hint}</span>
            </div>
            <div className={styles.stepper} role="group" aria-labelledby={id}>
                <button type="button" className={styles.stepBtn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={t.fewer(label)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
                </button>
                <output className={styles.stepValue} aria-live="polite">{value}</output>
                <button type="button" className={styles.stepBtn} onClick={() => onChange(value + 1)} disabled={!canAdd} aria-label={t.more(label)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                </button>
            </div>
        </div>
    );
};

const GuestPicker: React.FC<{ guests: Guests; max: number; onChange: (g: Guests) => void }> = ({ guests, max, onChange }) => {
    const t = useT().search;
    const room = totalGuests(guests) < max;
    return (
        <div className={styles.guestPicker}>
            <Stepper id="bs-adults" label={t.adults} hint={t.adultsHint} value={guests.adults} min={1} canAdd={room}
                onChange={(adults) => onChange({ ...guests, adults })} />
            <Stepper id="bs-children" label={t.children} hint={t.childrenHint} value={guests.children} min={0} canAdd={room}
                onChange={(children) => onChange({ ...guests, children })} />
            <Stepper id="bs-infants" label={t.infants} hint={t.infantsHint} value={guests.infants} min={0} canAdd={guests.infants < MAX_INFANTS}
                onChange={(infants) => onChange({ ...guests, infants })} />
            <p className={styles.maxNote}>{t.maxNote(max)}</p>
        </div>
    );
};

/**
 * Barra di ricerca in stile Airbnb: Arrivo · Partenza · Ospiti · Verifica.
 * Computer: pillola con popover sotto. Telefono: barra fissa in basso e pannello a tutto schermo.
 */
const BookingSearch: React.FC<Props> = ({
    range,
    onRangeChange,
    guests,
    onGuestsChange,
    blocked,
    loading,
    pricing,
    maxGuests,
    onSearch,
    hideMobileBar,
    ref,
}) => {
    const lang = useLang();
    const t = useT().search;
    const nightsText = useT().request.nights;
    const phone = useIsPhone();

    const [active, setActive] = useState<Field | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [hover, setHover] = useState<Date | undefined>();

    const wrapRef = useRef<HTMLDivElement>(null);
    const fieldRefs = {
        checkIn: useRef<HTMLButtonElement>(null),
        checkOut: useRef<HTMLButtonElement>(null),
        guests: useRef<HTMLButtonElement>(null),
    };
    const mobileTriggerRef = useRef<HTMLButtonElement | null>(null);
    const sheetRef = useRef<HTMLDivElement>(null);

    const from = range?.from;
    const to = range?.to;
    const complete = !!(from && to);
    const nights = from && to ? nightsBetween(from, to) : 0;

    const pickingCheckOut = (phone ? !!from && !to : active === 'checkOut') && !!from;
    const minNights = from ? minNightsFrom(from, pricing) : 1;
    const disabled = useDisabledDays(from, pickingCheckOut, blocked, minNights);
    const total = from && to ? quote(from, to, pricing) : null;
    /** "6 notti · 1.080 €" (senza prezzo se manca anche una sola notte) */
    const stayText = nights > 0 ? [nightsText(nights), total != null ? formatEuro(total, lang) : ''].filter(Boolean).join(' · ') : '';

    useImperativeHandle(ref, () => ({
        open: () => {
            if (phone) {
                setActive(from && !to ? 'checkOut' : 'checkIn');
                setSheetOpen(true);
            } else {
                wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setActive('checkIn');
                fieldRefs.checkIn.current?.focus({ preventScroll: true });
            }
        },
    }));

    /* ── Chiusura: Esc, clic fuori, fuoco che torna al pulsante ── */
    const closePopover = (returnFocus = true) => {
        const was = active;
        setActive(null);
        setHover(undefined);
        if (returnFocus && was) fieldRefs[was].current?.focus();
    };

    const closeSheet = () => {
        setSheetOpen(false);
        setHover(undefined);
        mobileTriggerRef.current?.focus();
    };

    useEffect(() => {
        if (phone || !active) return;
        const onDown = (e: MouseEvent) => {
            if (!wrapRef.current?.contains(e.target as Node)) {
                setActive(null);
                setHover(undefined);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                fieldRefs[active].current?.focus();
                setActive(null);
                setHover(undefined);
            }
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, phone]);

    useEffect(() => {
        if (!sheetOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSheetOpen(false);
                mobileTriggerRef.current?.focus();
            }
        };
        document.addEventListener('keydown', onKey);
        sheetRef.current?.focus();
        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKey);
        };
    }, [sheetOpen]);

    // Spazio in fondo alla pagina, cosi' la barra fissa non copre il footer
    const barVisible = phone && !hideMobileBar;
    useEffect(() => {
        if (!barVisible) return;
        const previous = document.body.style.paddingBottom;
        document.body.style.paddingBottom = 'calc(80px + env(safe-area-inset-bottom))';
        return () => {
            document.body.style.paddingBottom = previous;
        };
    }, [barVisible]);

    // Aprendo un pannello che esce dallo schermo, la pagina scende quanto basta per vederlo tutto
    // (senza mai far finire la barra sotto l'intestazione del sito)
    const panel = phone ? null : active === 'guests' ? 'guests' : active ? 'calendar' : null;
    useEffect(() => {
        if (!panel) return;
        const frame = requestAnimationFrame(() => {
            const wrap = wrapRef.current;
            const pop = wrap?.querySelector<HTMLElement>('[role="dialog"]');
            if (!wrap || !pop) return;
            const margin = 16;
            const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 76;
            const overflow = pop.getBoundingClientRect().bottom - window.innerHeight + margin;
            const room = wrap.getBoundingClientRect().top - header - margin;
            const delta = Math.min(overflow, room);
            if (delta > 0) {
                const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                window.scrollBy({ top: delta, behavior: reduce ? 'auto' : 'smooth' });
            }
        });
        return () => cancelAnimationFrame(frame);
    }, [panel]);

    // Passando da computer a telefono (o viceversa) si chiude tutto
    useEffect(() => {
        setActive(null);
        setSheetOpen(false);
    }, [phone]);

    /* ── Calendario ── */
    const onDayClick = (day: Date) => {
        const result = pickDay(day, range, phone ? (from && !to ? 'checkOut' : null) : active, blocked, (d) => minNightsFrom(d, pricing));
        onRangeChange(result.range);
        setHover(undefined);
        if (!phone) {
            setActive(result.next);
            fieldRefs[result.next].current?.focus({ preventScroll: true });
        }
    };

    // Il calendario si apre sul primo mese con almeno una notte libera
    const firstFree = useMemo(() => {
        const d = startOfToday();
        const busy = new Set(blocked.map((b) => b.getTime()));
        for (let i = 0; i < 730 && busy.has(d.getTime()); i++) d.setDate(d.getDate() + 1);
        return d;
    }, [blocked]);

    const previewTo = pickingCheckOut && hover && from && hover > from ? hover : undefined;

    const calendar = (months: number) =>
        loading ? (
            <p className={styles.loading}>{t.loading}</p>
        ) : (
            <DayPicker
                mode="range"
                selected={range}
                onSelect={(_, day) => onDayClick(day)}
                onDayMouseEnter={(day) => setHover(day)}
                onDayMouseLeave={() => setHover(undefined)}
                disabled={disabled}
                excludeDisabled={false}
                modifiers={previewTo ? { preview: { from: from!, to: previewTo } } : undefined}
                modifiersClassNames={{ preview: styles.preview }}
                locale={DAY_PICKER_LOCALES[lang]}
                numberOfMonths={months}
                pagedNavigation
                showOutsideDays={false}
                startMonth={startOfToday()}
                defaultMonth={from ?? firstFree}
                className={styles.calendar}
            />
        );

    const checkOutHint = minNights > 1 ? `${t.pickCheckOut} · ${t.minNights(minNights)}` : t.pickCheckOut;
    const calendarHint = !from ? t.pickCheckIn : !to ? checkOutHint : stayText;

    const search = () => {
        if (!complete) {
            if (phone) {
                setSheetOpen(true);
            } else {
                const field: Field = from ? 'checkOut' : 'checkIn';
                setActive(field);
                fieldRefs[field].current?.focus();
            }
            return;
        }
        setActive(null);
        setSheetOpen(false);
        onSearch();
    };

    const clearDates = () => {
        onRangeChange(undefined);
        if (!phone) {
            setActive('checkIn');
            fieldRefs.checkIn.current?.focus();
        }
    };

    /* ── Telefono ── */
    if (phone) {
        const summary = complete
            ? `${formatDayShort(from!, lang)} – ${formatDayShort(to!, lang)} · ${guestsLabel(guests, t)}`
            : `${t.addDate} · ${guestsLabel(guests, t)}`;
        return (
            <>
                <button
                    ref={mobileTriggerRef}
                    type="button"
                    className={styles.mobileTrigger}
                    onClick={() => setSheetOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={sheetOpen}
                >
                    <span className={styles.mobileIcon}><SearchIcon /></span>
                    <span className={styles.mobileText}>
                        <span className={styles.mobileTitle}>{complete ? t.stay : t.whenShort}</span>
                        <span className={styles.mobileSub}>{summary}</span>
                    </span>
                </button>

                {/* Barra e pannello vanno nel body: dentro la hero (animata) "fixed" non si ancorerebbe allo schermo */}
                {!hideMobileBar && !sheetOpen && createPortal(
                    <div className={styles.bottomBar}>
                        <button type="button" className={styles.bottomInfo} onClick={() => setSheetOpen(true)}>
                            {complete ? (
                                <>
                                    <span className={styles.bottomMain}>{stayText}</span>
                                    <span className={styles.bottomSub}>{formatDayShort(from!, lang)} – {formatDayShort(to!, lang)}</span>
                                </>
                            ) : (
                                <>
                                    <span className={styles.bottomMain}>{t.addDate}</span>
                                    <span className={styles.bottomSub}>{guestsLabel(guests, t)}</span>
                                </>
                            )}
                        </button>
                        <button type="button" className={styles.bottomCta} onClick={search}>
                            {complete ? t.search : t.datesNeeded}
                        </button>
                    </div>,
                    document.body,
                )}

                {sheetOpen && createPortal(
                    <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="bs-sheet-title" ref={sheetRef} tabIndex={-1}>
                        <div className={styles.sheetHead}>
                            <button type="button" className={styles.iconBtn} onClick={closeSheet} aria-label={t.close}>
                                <CloseIcon />
                            </button>
                            <h2 id="bs-sheet-title" className={styles.sheetTitle}>{t.when}</h2>
                            <span className={styles.iconBtnSpacer} />
                        </div>

                        <div className={styles.sheetBody}>
                            <section className={styles.sheetCard}>
                                <div className={styles.sheetDates}>
                                    <div className={`${styles.sheetDate} ${!from || (from && to) ? styles.sheetDateActive : ''}`}>
                                        <span className={styles.fieldLabel}>{t.checkIn}</span>
                                        <span className={from ? styles.fieldValue : styles.fieldPlaceholder}>{from ? formatDay(from, lang) : t.addDate}</span>
                                    </div>
                                    <div className={`${styles.sheetDate} ${from && !to ? styles.sheetDateActive : ''}`}>
                                        <span className={styles.fieldLabel}>{t.checkOut}</span>
                                        <span className={to ? styles.fieldValue : styles.fieldPlaceholder}>{to ? formatDay(to, lang) : t.addDate}</span>
                                    </div>
                                </div>
                                <p className={styles.calendarHint} aria-live="polite">{calendarHint}</p>
                                <div className={styles.calendarWrap}>{calendar(1)}</div>
                                <p className={styles.legend}>{t.legend}</p>
                            </section>

                            <section className={styles.sheetCard}>
                                <h3 className={styles.sheetSection}>{t.guests}</h3>
                                <GuestPicker guests={guests} max={maxGuests} onChange={onGuestsChange} />
                            </section>
                        </div>

                        <div className={styles.sheetFoot}>
                            <button type="button" className={styles.linkBtn} onClick={clearDates} disabled={!from}>
                                {t.clear}
                            </button>
                            <button type="button" className={styles.cta} onClick={search} disabled={!complete}>
                                <SearchIcon />
                                <span>{complete ? t.search : t.datesNeeded}</span>
                            </button>
                        </div>
                    </div>,
                    document.body,
                )}
            </>
        );
    }

    /* ── Computer ── */
    const fieldClass = (f: Field) => `${styles.field} ${active === f ? styles.fieldActive : ''}`;
    const toggle = (f: Field) => setActive((cur) => (cur === f ? null : f));

    return (
        <div ref={wrapRef} className={styles.wrap}>
            <div className={`${styles.pill} ${active ? styles.pillOpen : ''}`} role="search" aria-label={t.searchLabel}>
                <button
                    ref={fieldRefs.checkIn}
                    type="button"
                    className={fieldClass('checkIn')}
                    onClick={() => toggle('checkIn')}
                    aria-haspopup="dialog"
                    aria-expanded={active === 'checkIn'}
                >
                    <span className={styles.fieldLabel}>{t.checkIn}</span>
                    <span className={from ? styles.fieldValue : styles.fieldPlaceholder}>{from ? formatDay(from, lang) : t.addDate}</span>
                </button>
                <span className={styles.sep} aria-hidden="true" />
                <button
                    ref={fieldRefs.checkOut}
                    type="button"
                    className={fieldClass('checkOut')}
                    onClick={() => toggle(from ? 'checkOut' : 'checkIn')}
                    aria-haspopup="dialog"
                    aria-expanded={active === 'checkOut'}
                >
                    <span className={styles.fieldLabel}>{t.checkOut}</span>
                    <span className={to ? styles.fieldValue : styles.fieldPlaceholder}>{to ? formatDay(to, lang) : t.addDate}</span>
                </button>
                <span className={styles.sep} aria-hidden="true" />
                <div className={`${fieldClass('guests')} ${styles.fieldLast}`}>
                    <button
                        ref={fieldRefs.guests}
                        type="button"
                        className={styles.fieldInner}
                        onClick={() => toggle('guests')}
                        aria-haspopup="dialog"
                        aria-expanded={active === 'guests'}
                    >
                        <span className={styles.fieldLabel}>{t.guests}</span>
                        <span className={styles.fieldValue}>{guestsLabel(guests, t)}</span>
                    </button>
                    <button type="button" className={`${styles.cta} ${active ? styles.ctaWide : ''}`} onClick={search} aria-label={t.searchLabel}>
                        <SearchIcon />
                        <span className={styles.ctaText}>{t.search}</span>
                    </button>
                </div>
            </div>

            {(active === 'checkIn' || active === 'checkOut') && (
                <div className={`${styles.popover} ${styles.popoverCalendar}`} role="dialog" aria-label={active === 'checkIn' ? t.pickCheckIn : t.pickCheckOut}>
                    <div className={styles.popHead}>
                        <p className={styles.popTitle} aria-live="polite">
                            {nights > 0 ? stayText : active === 'checkIn' ? t.pickCheckIn : from ? checkOutHint : t.pickCheckIn}
                        </p>
                        {from && to && (
                            <p className={styles.popSub}>{formatDay(from, lang)} – {formatDay(to, lang)}</p>
                        )}
                    </div>
                    <div className={styles.calendarWrap}>{calendar(2)}</div>
                    <div className={styles.popFoot}>
                        <span className={styles.legend}>{t.legend}</span>
                        <div className={styles.popActions}>
                            {from && (
                                <button type="button" className={styles.linkBtn} onClick={clearDates}>{t.clear}</button>
                            )}
                            <button type="button" className={styles.closeBtn} onClick={() => closePopover()}>{t.close}</button>
                        </div>
                    </div>
                </div>
            )}

            {active === 'guests' && (
                <div className={`${styles.popover} ${styles.popoverGuests}`} role="dialog" aria-label={t.guests}>
                    <GuestPicker guests={guests} max={maxGuests} onChange={onGuestsChange} />
                </div>
            )}
        </div>
    );
};

export default BookingSearch;
