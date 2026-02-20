import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styles from './BookingBar.module.css';
import { supabase } from '../lib/supabase';

const BookingBar: React.FC = () => {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [guests, setGuests] = useState(2);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    // Strict Input States
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [errors, setErrors] = useState({ name: '', email: '' });

    const PRICE_PER_NIGHT = 250;

    const calculateTotal = () => {
        if (!startDate || !endDate) return 0;
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays * PRICE_PER_NIGHT;
    };

    const validateInput = () => {
        let isValid = true;
        const newErrors = { name: '', email: '' };

        // Name: Letters and spaces only, 2-50 chars
        if (!/^[a-zA-Z\s]{2,50}$/.test(formData.name)) {
            newErrors.name = 'Please enter a valid name (letters only).';
            isValid = false;
        }

        // Email: Standard Simple Regex
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address.';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleBookClick = () => {
        if (!startDate || !endDate) {
            alert("Please select check-in and check-out dates.");
            return;
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateInput()) return;

        if (!supabase) {
            alert("Booking disabled: Missing Supabase configuration.");
            return;
        }

        setStatus('submitting');
        try {
            const { error } = await supabase.from('bookings').insert([{
                name: formData.name,
                email: formData.email, // Validated email
                message: formData.message, // React escapes this automatically against XSS
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
                setStartDate(null);
                setEndDate(null);
                setFormData({ name: '', email: '', message: '' });
                setGuests(2);
            }, 3000);
        } catch (err) {
            console.error(err);
            setStatus('error');
            alert("Something went wrong. Please try again.");
        }
    };

    const handleGuestChange = (val: number) => {
        if (val >= 1 && val <= 6) {
            setGuests(val);
        }
    };

    return (
        <>
            <div className={styles.bar}>
                <div className={styles.field}>
                    <label>Check-in</label>
                    <DatePicker
                        selected={startDate}
                        onChange={(date: Date | null) => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        placeholderText="Add dates"
                        className={styles.input}
                        shouldCloseOnSelect={false} /* Keep open to allow easier range selection flow */
                    />
                </div>
                <div className={styles.divider}></div>
                <div className={styles.field}>
                    <label>Check-out</label>
                    <DatePicker
                        selected={endDate}
                        onChange={(date: Date | null) => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate || new Date()}
                        placeholderText="Add dates"
                        className={styles.input}
                    />
                </div>
                <div className={styles.divider}></div>
                <div className={styles.field}>
                    <label>Guests</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="number"
                            min="1"
                            max="6"
                            value={guests}
                            onChange={(e) => handleGuestChange(parseInt(e.target.value))}
                            className={styles.input}
                            onKeyDown={(e) => e.preventDefault()} // Prevent typing, forced to use spinner or logic
                        />
                    </div>
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
                                <p>We have received your booking request.</p>
                                <p>You will receive a confirmation email at <strong>{formData.email}</strong> shortly.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <h3>Complete your Request</h3>
                                <p className={styles.modalDescription}>You won't be charged yet.</p>

                                <div className={styles.summary}>
                                    <div className={styles.summaryRow}>
                                        <span>Dates</span>
                                        <span>{startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}</span>
                                    </div>
                                    <div className={styles.summaryRow}>
                                        <span>Guests</span>
                                        <span>{guests} guest{guests > 1 ? 's' : ''}</span>
                                    </div>
                                    <div className={styles.summaryRow}>
                                        <span>Total Est.</span>
                                        <span>€{calculateTotal().toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Mario Rossi"
                                    />
                                    {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="name@example.com"
                                    />
                                    {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Message (Optional)</label>
                                    <textarea
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                <button type="submit" className={styles.confirmBtn} disabled={status === 'submitting'}>
                                    {status === 'submitting' ? 'Processing...' : 'Send Request'}
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
