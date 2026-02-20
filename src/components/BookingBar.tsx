import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styles from './BookingBar.module.css';
import { supabase } from '../lib/supabase';

const BookingBar: React.FC = () => {
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [startDate, endDate] = dateRange;
    const [guests, setGuests] = useState(2);

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

    const PRICE_PER_NIGHT = 250;

    // Click outside to close popovers
    const calendarRef = useRef<HTMLDivElement>(null);
    const guestRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setIsCalendarOpen(false);
            }
            if (guestRef.current && !guestRef.current.contains(event.target as Node)) {
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

    const handleDateChange = (update: [Date | null, Date | null]) => {
        setDateRange(update);
        // Optional: Auto-close if needed, but per user request we might want to keep it open
        // until they click outside or click "check availability"
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

    const updateGuests = (operation: 'inc' | 'dec') => {
        if (operation === 'inc' && guests < 6) setGuests(prev => prev + 1);
        if (operation === 'dec' && guests > 1) setGuests(prev => prev - 1);
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
                guests: guests,
                total_price: calculateTotal(),
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;
            setStatus('success');
            setTimeout(() => {
                setIsModalOpen(false);
                setStatus('idle');
                setDateRange([null, null]);
                setFormData({ name: '', email: '', message: '' });
                setGuests(2);
            }, 3000);
        } catch (err) {
            console.error(err);
            setStatus('error');
            alert("Error submitting request.");
        }
    };

    const renderDayContents = (day: number) => {
        return (
            <div className={styles.dayContainer}>
                <span className={styles.dayNumber}>{day}</span>
                <span className={styles.dayPrice}>€{PRICE_PER_NIGHT}</span>
            </div>
        );
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

                    {isCalendarOpen && (
                        <div className={styles.calendarWrapper} onClick={e => e.stopPropagation()}>
                            <DatePicker
                                selected={startDate}
                                onChange={handleDateChange}
                                startDate={startDate}
                                endDate={endDate}
                                selectsRange
                                inline
                                monthsShown={2}
                                minDate={new Date()}
                                excludeDates={blockedDates}
                                renderDayContents={renderDayContents}
                                calendarClassName={styles.customCalendar}
                            />
                        </div>
                    )}
                </div>

                <div className={styles.divider}></div>

                {/* Guest Trigger */}
                <div className={styles.field} onClick={toggleGuest} ref={guestRef}>
                    <label>Guests</label>
                    <div className={styles.displayRow}>
                        <span>{guests} Guest{guests > 1 ? 's' : ''}</span>
                    </div>

                    {isGuestOpen && (
                        <div className={styles.guestPopover} onClick={e => e.stopPropagation()}>
                            <div className={styles.guestRow}>
                                <div>
                                    <h4>Adults</h4>
                                    <p>ages 13 or above</p>
                                </div>
                                <div className={styles.guestControls}>
                                    <button
                                        className={styles.roundBtn}
                                        onClick={() => updateGuests('dec')}
                                        disabled={guests <= 1}
                                    >-</button>
                                    <span className={styles.guestCount}>{guests}</span>
                                    <button
                                        className={styles.roundBtn}
                                        onClick={() => updateGuests('inc')}
                                        disabled={guests >= 6}
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <button className={styles.searchBtn} onClick={handleBookClick}>
                    Check Availability
                </button>
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
                                        <span>{guests} People</span>
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
            )}
        </>
    );
};

export default BookingBar;
