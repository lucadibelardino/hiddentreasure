import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styles from './BookingBar.module.css';
import { supabase } from '../lib/supabase';

const BookingBar: React.FC = () => {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [guests, setGuests] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const PRICE_PER_NIGHT = 250;

    const calculateTotal = () => {
        if (!startDate || !endDate) return 0;
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays * PRICE_PER_NIGHT;
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
        if (!supabase) {
            alert("Booking disabled: Missing Supabase configuration.");
            return;
        }

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
                setStartDate(null);
                setEndDate(null);
                setFormData({ name: '', email: '', message: '' });
            }, 2000);
        } catch (err) {
            console.error(err);
            setStatus('error');
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
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={guests}
                        onChange={(e) => setGuests(parseInt(e.target.value))}
                        className={styles.input}
                    />
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
                                <h3>Request Sent!</h3>
                                <p>We'll be in touch shortly to confirm your stay.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <h3>Confirm Booking Request</h3>
                                <div className={styles.summary}>
                                    <p><strong>Dates:</strong> {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}</p>
                                    <p><strong>Guests:</strong> {guests}</p>
                                    <p><strong>Total:</strong> €{calculateTotal()}</p>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Email</label>
                                    <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Message (Optional)</label>
                                    <textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} />
                                </div>
                                <button type="submit" className={styles.confirmBtn} disabled={status === 'submitting'}>
                                    {status === 'submitting' ? 'Sending...' : 'Request to Book'}
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
