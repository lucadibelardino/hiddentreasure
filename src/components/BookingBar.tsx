import React, { useState, useEffect, useRef } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import "react-day-picker/style.css";
import styles from './BookingBar.module.css';
import { supabase } from '../lib/supabase';

const BookingBar: React.FC = () => {
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const startDate = dateRange?.from || null;
    const endDate = dateRange?.to || null;
    const [adults, setAdults] = useState(2);
    const [infants, setInfants] = useState(0);

    const totalGuests = adults + infants;
    // Popover States
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isGuestOpen, setIsGuestOpen] = useState(false);

    // Data States
    const [blockedDates, setBlockedDates] = useState<Date[]>([]);

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [errors, setErrors] = useState({ name: '', email: '' });
    const [selectionError, setSelectionError] = useState<string | null>(null);

    const PRICE_PER_NIGHT = 250;

    // Click outside to close popovers
    const calendarRef = useRef<HTMLDivElement>(null);
    const guestRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isCalendarOpen || isGuestOpen) {
                // If they clicked inside the popover base, do nothing
                if (popoverRef.current && popoverRef.current.contains(event.target as Node)) {
                    return;
                }

                // Clicking outside closes whatever is open
                setIsCalendarOpen(false);
                setIsGuestOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Blocked Dates
    useEffect(() => {
        const fetchBlockedDates = async () => {
            if (!supabase) return;
            const { data, error } = await supabase.from('blocked_dates').select('check_in, check_out');

            if (error) {
                console.error('Error fetching blocked dates:', error);
                return;
            }

            if (data) {
                const dates: Date[] = [];
                data.forEach((booking: any) => {
                    const start = new Date(booking.check_in);
                    const end = new Date(booking.check_out);
                    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
                        dates.push(new Date(dt));
                    }
                });
                setBlockedDates(dates);
            }
        };
        fetchBlockedDates();
    }, []);

    const calculateTotal = () => {
        if (!startDate || !endDate) return 0;
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays * PRICE_PER_NIGHT;
    };

    const validateInput = () => {
        let isValid = true;
        const newErrors = { name: '', email: '' };

        if (!/^[a-zA-Z\s]{2,50}$/.test(formData.name)) {
            newErrors.name = 'Please enter a valid name (letters only).';
            isValid = false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address.';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleDateChange = (range: DateRange | undefined) => {
        setSelectionError(null);

        const newStart = range?.from;
        const newEnd = range?.to;

        // Validation: Check if range includes any blocked date
        if (newStart && newEnd && blockedDates.length > 0) {
            let isBlocked = false;
            // Iterate through range
            for (let dt = new Date(newStart); dt <= newEnd; dt.setDate(dt.getDate() + 1)) {
                const time = dt.getTime();
                if (blockedDates.some((blocked: Date) => {
                    return Math.abs(blocked.getTime() - time) < 24 * 60 * 60 * 1000 && blocked.getDate() === dt.getDate();
                })) {
                    isBlocked = true;
                    break;
                }
            }

            if (isBlocked) {
                setSelectionError("Selected dates include unavailable days.");
                // If invalid, keep only the start date or reset
                setDateRange({ from: newStart, to: undefined });
                return;
            }
        }

        setDateRange(range);

        if (newStart && newEnd) {
            // Give user a brief moment to see the selected end date
            setTimeout(() => {
                setIsCalendarOpen(false);
                setIsGuestOpen(true);
            }, 350);
        }
    };

    const toggleCalendar = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsCalendarOpen(!isCalendarOpen);
        setIsGuestOpen(false);
    };

    const toggleGuest = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsGuestOpen(!isGuestOpen);
        setIsCalendarOpen(false);
    };

    const updateAdults = (operation: 'inc' | 'dec') => {
        if (operation === 'inc' && totalGuests < 6) setAdults((prev: number) => prev + 1);
        if (operation === 'dec' && adults > 1) setAdults((prev: number) => prev - 1);
    };

    const updateInfants = (operation: 'inc' | 'dec') => {
        if (operation === 'inc' && totalGuests < 6) setInfants((prev: number) => prev + 1);
        if (operation === 'dec' && infants > 0) setInfants((prev: number) => prev - 1);
    };

    const handleBookClick = () => {
        if (!startDate || !endDate) {
            alert("Please select check-in and check-out dates.");
            setIsCalendarOpen(true);
            return;
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateInput()) return;
        if (!supabase) { alert("Config missing"); return; }

        setStatus('submitting');
        try {
            const { error } = await supabase.from('bookings').insert([{
                name: formData.name,
                email: formData.email,
                message: formData.message,
                check_in: startDate,
                check_out: endDate,
                guests: totalGuests,
                total_price: calculateTotal(),
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;
            setStatus('success');
            setTimeout(() => {
                setIsModalOpen(false);
                setStatus('idle');
                setDateRange(undefined);
                setFormData({ name: '', email: '', message: '' });
                setAdults(2);
                setInfants(0);
            }, 3000);
        } catch (err) {
            console.error(err);
            setStatus('error');
            alert("Error submitting request.");
        }
    };
    return (
        <>
            <div className={styles.bar}>
                {/* Unified Date Trigger */}
                <div className={`${styles.field} ${styles.dateField}`} onClick={toggleCalendar} ref={calendarRef}>
                    <label>Dates</label>
                    <div className={styles.displayRow}>
                        <span className={!startDate ? styles.placeholder : ''}>
                            {startDate ? startDate.toLocaleDateString() : 'Add dates'}
                        </span>
                        <span className={styles.arrow}>➜</span>
                        <span className={!endDate ? styles.placeholder : ''}>
                            {endDate ? endDate.toLocaleDateString() : 'Add dates'}
                        </span>
                    </div>
                </div>

                <div className={styles.divider}></div>

                <div className={styles.field} onClick={toggleGuest} ref={guestRef}>
                    <label>Guests</label>
                    <div className={styles.displayRow}>
                        <span>
                            {adults} Adult{adults > 1 ? 'i' : 'o'}
                            {infants > 0 ? `, ${infants} Neona${infants > 1 ? 'ti' : 'to'}` : ''}
                        </span>
                    </div>
                </div>

                <button className={styles.searchBtn} onClick={handleBookClick}>
                    Check Availability
                </button>

                {/* SHARED POPOVER TRANSITION */}
                <div
                    ref={popoverRef}
                    className={`${styles.popoverBase} ${isCalendarOpen ? styles.calendarOpen : isGuestOpen ? styles.guestOpen : ''}`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Calendar Content */}
                    <div className={`${styles.popoverContent} ${isCalendarOpen ? styles.active : styles.inactive}`}>
                        {selectionError && (
                            <div className={styles.inlineError}>
                                {selectionError}
                            </div>
                        )}
                        <DayPicker
                            mode="range"
                            selected={dateRange}
                            onSelect={handleDateChange}
                            numberOfMonths={2}
                            disabled={[
                                { before: new Date() },
                                ...blockedDates
                            ]}
                            className={styles.customCalendar}
                        />
                    </div>

                    {/* Guest Content */}
                    <div className={`${styles.popoverContent} ${isGuestOpen ? styles.active : styles.inactive}`}>
                        <div className={styles.guestContentStack}>
                            {/* Adults */}
                            <div className={styles.guestRow}>
                                <div>
                                    <h4>Adulti</h4>
                                    <p>Età 13+</p>
                                </div>
                                <div className={styles.guestControls}>
                                    <button
                                        className={styles.roundBtn}
                                        onClick={() => updateAdults('dec')}
                                        disabled={adults <= 1}
                                    >-</button>
                                    <span className={styles.guestCount}>{adults}</span>
                                    <button
                                        className={styles.roundBtn}
                                        onClick={() => updateAdults('inc')}
                                        disabled={totalGuests >= 6}
                                    >+</button>
                                </div>
                            </div>
                            {/* Infants */}
                            <div className={styles.guestRow}>
                                <div>
                                    <h4>Bambini</h4>
                                    <p>Sotto i 2 anni</p>
                                </div>
                                <div className={styles.guestControls}>
                                    <button
                                        className={styles.roundBtn}
                                        onClick={() => updateInfants('dec')}
                                        disabled={infants <= 0}
                                    >-</button>
                                    <span className={styles.guestCount}>{infants}</span>
                                    <button
                                        className={styles.roundBtn}
                                        onClick={() => updateInfants('inc')}
                                        disabled={totalGuests >= 6}
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>×</button>
                        {status === 'success' ? (
                            <div className={styles.successMessage}>
                                <h3>Request Sent! 🌊</h3>
                                <p>We'll confirm your booking at <strong>{formData.email}</strong> shortly.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <h3>Complete Request</h3>
                                <p className={styles.modalDescription}>You won't be charged yet.</p>

                                <div className={styles.summary}>
                                    <div className={styles.summaryRow}>
                                        <span>Dates</span>
                                        <span>{startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}</span>
                                    </div>
                                    <div className={styles.summaryRow}>
                                        <span>Guests</span>
                                        <span>{totalGuests} Persone ({adults} Adulti, {infants} Bambini)</span>
                                    </div>
                                    <div className={styles.summaryRow}>
                                        <span>Total</span>
                                        <span>€{calculateTotal().toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Name</label>
                                    <input
                                        type="text" required value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Full Name"
                                    />
                                    {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Email</label>
                                    <input
                                        type="email" required value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="Email Address"
                                    />
                                    {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Message</label>
                                    <textarea
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                                <button type="submit" className={styles.confirmBtn} disabled={status === 'submitting'}>
                                    {status === 'submitting' ? 'Sending...' : 'Send Request'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )
            }
        </>
    );
};

export default BookingBar;
