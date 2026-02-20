import React, { useState } from 'react';
import styles from './Contact.module.css';

const Contact: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Thank you for your inquiry! We will get back to you soon.');
        setFormData({ name: '', email: '', message: '' });
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
                            />
                        </div>
                        <button type="submit" className={styles.submitBtn}>Send Inquiry</button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
