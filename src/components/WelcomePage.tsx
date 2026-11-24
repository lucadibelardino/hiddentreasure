import React from 'react';
import { Link } from 'react-router-dom';
import { LANGS, useLang } from '../i18n';
import { WELCOME_ROUTES, WELCOME_TEXT, type Block } from '../i18n/welcome';
import { DIRECTIONS_URL } from '../data/location';
import styles from './WelcomePage.module.css';

/**
 * "[testo](indirizzo)" diventa un link, "{{testo}}" un segnaposto da compilare
 * (evidenziato, cosi' si vede subito cosa manca). DIRECTIONS = indicazioni stradali.
 */
function rich(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const re = /\[([^\]]+)\]\(([^)]+)\)|\{\{([^}]+)\}\}/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
        if (m.index > last) parts.push(text.slice(last, m.index));
        if (m[3]) {
            parts.push(<mark key={m.index} className={styles.todo}>{m[3]}</mark>);
        } else {
            const href = m[2] === 'DIRECTIONS' ? DIRECTIONS_URL : m[2];
            const external = href.startsWith('http');
            parts.push(
                <a key={m.index} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    {m[1]}
                </a>,
            );
        }
        last = re.lastIndex;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
}

const BlockView: React.FC<{ b: Block }> = ({ b }) => {
    if (typeof b === 'string') return <p>{rich(b)}</p>;
    if ('list' in b) return <ul>{b.list.map((li, i) => <li key={i}>{rich(li)}</li>)}</ul>;
    return (
        <div className={styles.tableWrap}>
            <table className={styles.table}>
                <thead>
                    <tr>{b.table.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
                </thead>
                <tbody>
                    {b.table.rows.map((r, i) => (
                        <tr key={i}>
                            {r.map((c, j) => (j === 0 ? <th key={j} scope="row">{rich(c)}</th> : <td key={j}>{rich(c)}</td>))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const WelcomePage: React.FC = () => {
    const lang = useLang();
    const t = WELCOME_TEXT[lang];

    return (
        <main className={styles.page}>
            <div className={`container ${styles.container}`}>
                <nav className={styles.langs} aria-label="Language">
                    {LANGS.map((l) => (
                        <Link key={l} to={WELCOME_ROUTES[l]} hrefLang={l} lang={l} aria-current={l === lang ? 'true' : undefined}>
                            {l.toUpperCase()}
                        </Link>
                    ))}
                </nav>

                <p className="eyebrow">{t.eyebrow}</p>
                <h1 className={styles.title}>{t.title}</h1>
                <p className={styles.intro}>{t.intro}</p>

                <nav className={styles.toc} aria-label={t.contents}>
                    {t.sections.map((s) => (
                        <a key={s.id} href={`#${s.id}`}>{s.nav}</a>
                    ))}
                </nav>

                {t.sections.map((s) => (
                    <section key={s.id} id={s.id} className={styles.section}>
                        <h2>{s.h}</h2>
                        {s.body.map((b, i) => <BlockView key={i} b={b} />)}
                    </section>
                ))}
            </div>
        </main>
    );
};

export default WelcomePage;
