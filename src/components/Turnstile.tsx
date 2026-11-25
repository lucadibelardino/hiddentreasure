import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

/**
 * Cloudflare Turnstile: il controllo "non sono un robot", quasi sempre invisibile.
 * La Site key è pubblica (sta anche nel Worker); la Secret key è solo su Cloudflare.
 * Lo script di Cloudflare si scarica solo quando il modulo compare, non a ogni pagina.
 */
export const TURNSTILE_SITEKEY = '0x4AAAAAAGRhX_xa0_6Ci-QP';
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
    render: (el: HTMLElement, opts: Record<string, unknown>) => string;
    reset: (id: string) => void;
    remove: (id: string) => void;
}
declare global {
    interface Window { turnstile?: TurnstileApi }
}

let loading: Promise<TurnstileApi> | null = null;
function loadTurnstile(): Promise<TurnstileApi> {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    loading ??= new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = SCRIPT;
        s.async = true;
        s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile assente')));
        s.onerror = () => { loading = null; reject(new Error('Turnstile non caricato')); };
        document.head.appendChild(s);
    });
    return loading;
}

export interface TurnstileHandle {
    /** Un token vale una volta sola: dopo ogni invio ne serve uno nuovo. */
    reset: () => void;
}

interface Props {
    lang: string;
    /** Riceve il token, oppure '' quando scade o la verifica fallisce. */
    onToken: (token: string) => void;
    className?: string;
}

const Turnstile = forwardRef<TurnstileHandle, Props>(({ lang, onToken, className }, ref) => {
    const box = useRef<HTMLDivElement>(null);
    const id = useRef<string | null>(null);
    // La callback più recente, senza dover ricreare il widget a ogni render
    const cb = useRef(onToken);
    useEffect(() => { cb.current = onToken; }, [onToken]);

    useImperativeHandle(ref, () => ({
        reset: () => {
            cb.current('');
            if (id.current) window.turnstile?.reset(id.current);
        },
    }), []);

    useEffect(() => {
        let alive = true;
        loadTurnstile()
            .then((ts) => {
                if (!alive || !box.current) return;
                id.current = ts.render(box.current, {
                    sitekey: TURNSTILE_SITEKEY,
                    language: lang,
                    callback: (t: string) => cb.current(t),
                    'expired-callback': () => cb.current(''),
                    'error-callback': () => cb.current(''),
                });
            })
            .catch((e) => console.error(e));
        return () => {
            alive = false;
            if (id.current) window.turnstile?.remove(id.current);
            id.current = null;
        };
    }, [lang]);

    return <div ref={box} className={className} />;
});

export default Turnstile;
