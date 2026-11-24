import React from 'react';
import { useLang } from '../i18n';
import { LOCALES } from '../i18n/langs';
import { PRIVACY_TEXT } from '../i18n/privacy';
import { PRIVACY } from '../data/privacy';
import styles from './PrivacyPage.module.css';

/** "[testo](indirizzo)" diventa un link; il resto resta testo semplice. */
function withLinks(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const re = /\[([^\]]+)\]\(([^)]+)\)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
        if (m.index > last) parts.push(text.slice(last, m.index));
        const external = m[2].startsWith('http');
        parts.push(
            <a key={m.index} href={m[2]} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {m[1]}
            </a>,
        );
        last = re.lastIndex;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
}

const PrivacyPage: React.FC = () => {
    const lang = useLang();
    const t = PRIVACY_TEXT[lang];
    const updated = new Date(`${PRIVACY.updated}T12:00:00Z`).toLocaleDateString(LOCALES[lang], {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });

    return (
        <main className={styles.page}>
            <div className={`container ${styles.container}`}>
                <p className="eyebrow">{t.eyebrow}</p>
                <h1 className={styles.title}>{t.title}</h1>
                <p className={styles.updated}>{t.updated} {updated}</p>
                <p className={styles.intro}>{t.intro}</p>

                {t.sections.map((s) => (
                    <section key={s.h} className={styles.section}>
                        <h2>{s.h}</h2>
                        {s.body.map((b, i) =>
                            typeof b === 'string' ? (
                                <p key={i}>{withLinks(b)}</p>
                            ) : (
                                <ul key={i}>
                                    {b.list.map((li) => <li key={li}>{withLinks(li)}</li>)}
                                </ul>
                            ),
                        )}
                    </section>
                ))}
            </div>
        </main>
    );
};

export default PrivacyPage;
