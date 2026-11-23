import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { canonicalUrl, metaFor, NOT_FOUND } from './pages';

function setMeta(selector: string, attr: string, value: string) {
    const el = document.head.querySelector<HTMLElement>(selector);
    if (el) el.setAttribute(attr, value);
}

/** Aggiorna titolo, descrizione e canonical quando si cambia pagina nel browser. */
const PageHead: React.FC = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        const meta = metaFor(pathname);
        const url = canonicalUrl(meta === NOT_FOUND ? '/' : meta.path);
        document.title = meta.title;
        setMeta('meta[name="description"]', 'content', meta.description);
        setMeta('meta[property="og:title"]', 'content', meta.title);
        setMeta('meta[property="og:description"]', 'content', meta.description);
        setMeta('meta[property="og:url"]', 'content', url);
        setMeta('link[rel="canonical"]', 'href', url);
    }, [pathname]);

    return null;
};

export default PageHead;
