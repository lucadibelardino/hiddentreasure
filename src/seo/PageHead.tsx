import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { alternates, canonicalUrl, metaFor } from './pages';
import { OG_LOCALES, ROUTES, STRINGS } from '../i18n';

function setMeta(selector: string, attr: string, value: string) {
    const el = document.head.querySelector<HTMLElement>(selector);
    if (el) el.setAttribute(attr, value);
}

/** Aggiorna lingua, titolo, descrizione, canonical e hreflang quando si cambia pagina nel browser. */
const PageHead: React.FC = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        const meta = metaFor(pathname);
        const url = canonicalUrl(meta.page ? meta.path : ROUTES[meta.lang].home);
        document.documentElement.lang = meta.lang;
        document.title = meta.title;
        setMeta('meta[name="description"]', 'content', meta.description);
        setMeta('meta[property="og:title"]', 'content', meta.title);
        setMeta('meta[property="og:description"]', 'content', meta.description);
        setMeta('meta[property="og:url"]', 'content', url);
        setMeta('meta[property="og:locale"]', 'content', OG_LOCALES[meta.lang]);
        setMeta('meta[property="og:image:alt"]', 'content', STRINGS[meta.lang].meta.ogImageAlt);
        setMeta('link[rel="canonical"]', 'href', url);

        document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
        if (meta.page) {
            for (const alt of alternates(meta.page)) {
                const link = document.createElement('link');
                link.rel = 'alternate';
                link.hreflang = alt.hreflang;
                link.href = alt.href;
                document.head.appendChild(link);
            }
        }
    }, [pathname]);

    return null;
};

export default PageHead;
