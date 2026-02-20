import React, { useState } from 'react';
import styles from './Contact.module.css';
import { supabase } from '../lib/supabase';

const Contact: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) {
            alert('Bookings are currently disabled (missing configuration). Please email us directly.');
            return;
        }
        setStatus('submitting');

        try {
            const { error } = await supabase
                .from('bookings')
                .insert([
                    {
                        name: formData.name,
                        email: formData.email,
                        message: formData.message,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) throw error;

            setStatus('success');
            alert('Thank you for your inquiry! We have received your request.');
            setFormData({ name: '', email: '', message: '' });
        } catch (error) {
            console.error('Error submitting form:', error);
            setStatus('error');
            alert('There was an error sending your message. Please try again or email us directly.');
        } finally {
            setStatus('idle');
        }
    };

    return (
        <section id="contact" className={styles.section}>
            <div className="container">
                <h2 className={styles.title}>Book Your Stay</h2>
                <div className={styles.content}>
                    <div className={styles.info}>
                        <h3>Get in Touch</h3>
                        <p>Ready to experience the hidden treasure of Villasimius? Contact us for rates and availability.</p>
                        <div className={styles.details}>
                            <p><strong>Email:</strong> info@hiddentreasure.com</p>
                            <p><strong>Phone:</strong> +39 123 456 7890</p>
                            <p><strong>Address:</strong> Via del Mare, Villasimius, Sardina</p>
                        </div>
                    </div>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="name">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                disabled={status === 'submitting'}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={status === 'submitting'}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="message">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={5}
                                required
                                disabled={status === 'submitting'}
                            />
                        </div>
                        <button type="submit" className={styles.submitBtn} disabled={status === 'submitting'}>
                            {status === 'submitting' ? 'Sending...' : 'Send Inquiry'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
