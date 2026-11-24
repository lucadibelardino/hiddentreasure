import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LANGS, useLang } from '../i18n';
import { WELCOME_ROUTES, WELCOME_TEXT, type Block, type SecretsText } from '../i18n/welcome';
import { DIRECTIONS_URL } from '../data/location';
import { WORKER_URL } from '../booking/availability';
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

interface SecretItem {
    etichetta: string;
    valore: string;
}

type SecretsState =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'ok'; items: SecretItem[] }
    | { kind: 'wrong' }
    | { kind: 'error' };

/**
 * Wi-Fi e codici: non stanno nel codice del sito (la repo e' pubblica) ma nel
 * database del Worker. L'ospite inserisce il suo codice, oppure arriva da un link
 * con ?codice=..., e il Worker risponde solo se il codice e' valido.
 * Atteso: POST {WORKER_URL}/benvenuto {codice} -> {ok:true, voci:[{etichetta, valore}]}
 */
const WelcomeSecrets: React.FC<{ t: SecretsText }> = ({ t }) => {
    const { search } = useLocation();
    const [code, setCode] = useState('');
    const [state, setState] = useState<SecretsState>({ kind: 'idle' });
    const [copied, setCopied] = useState<number | null>(null);

    const load = async (codice: string) => {
        const clean = codice.trim().toUpperCase();
        if (!clean) return;
        setState({ kind: 'loading' });
        try {
            const res = await fetch(`${WORKER_URL}/benvenuto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codice: clean }),
            });
            if (res.status === 401 || res.status === 403 || res.status === 404) {
                setState({ kind: 'wrong' });
                return;
            }
            const data = await res.json();
            if (!res.ok || !data?.ok || !Array.isArray(data.voci)) throw new Error('risposta non valida');
            setState({ kind: 'ok', items: data.voci });
        } catch {
            setState({ kind: 'error' });
        }
    };

    // Link personale: /benvenuto?codice=AB12CD apre direttamente i dati
    useEffect(() => {
        const fromUrl = new URLSearchParams(search).get('codice');
        if (fromUrl) {
            setCode(fromUrl);
            load(fromUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const copy = async (i: number, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(i);
            setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
        } catch {
            /* appunti non disponibili: il valore resta comunque leggibile */
        }
    };

    if (state.kind === 'ok') {
        return (
            <div className={styles.secrets}>
                <dl className={styles.secretList}>
                    {state.items.map((it, i) => (
                        <div key={i} className={styles.secretRow}>
                            <dt>{it.etichetta}</dt>
                            <dd>
                                <code>{it.valore}</code>
                                <button type="button" className={styles.copy} onClick={() => copy(i, it.valore)}>
                                    {copied === i ? t.copied : t.copy}
                                </button>
                            </dd>
                        </div>
                    ))}
                </dl>
                <button type="button" className={styles.linkBtn} onClick={() => setState({ kind: 'idle' })}>
                    {t.other}
                </button>
            </div>
        );
    }

    return (
        <form
            className={styles.secrets}
            onSubmit={(e) => {
                e.preventDefault();
                load(code);
            }}
        >
            <p>{t.intro}</p>
            <label className={styles.codeLabel} htmlFor="codice-ospite">{t.label}</label>
            <div className={styles.codeRow}>
                <input
                    id="codice-ospite"
                    className={styles.codeInput}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t.placeholder}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={32}
                />
                <button type="submit" className={styles.codeBtn} disabled={state.kind === 'loading' || !code.trim()}>
                    {state.kind === 'loading' ? t.loading : t.submit}
                </button>
            </div>
            {state.kind === 'wrong' && <p className={styles.msg} role="alert">{t.wrong}</p>}
            {state.kind === 'error' && <p className={styles.msg} role="alert">{t.error}</p>}
        </form>
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
                        {s.secrets && <WelcomeSecrets t={t.secrets} />}
                    </section>
                ))}
            </div>
        </main>
    );
};

export default WelcomePage;
