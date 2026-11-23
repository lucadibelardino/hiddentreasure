/**
 * Dopo `vite build`, genera un file HTML completo per ogni pagina del sito in
 * ogni lingua (dist/index.html, dist/gallery.html, dist/en/index.html,
 * dist/de/galerie.html, ...) con il contenuto gia' renderizzato e lingua,
 * titolo, descrizione, canonical e hreflang propri. GitHub Pages serve
 * /gallery da gallery.html e /en/ da en/index.html: gli indirizzi restano puliti.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js');

const { render, PAGES, NOT_FOUND, canonicalUrl, alternates, OG_LOCALES, STRINGS, DEFAULT_LANG } = await import(pathToFileURL(ssrEntry).href);
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function replaceOnce(html, regex, replacement, label) {
    const found = typeof regex === 'string' ? html.includes(regex) : regex.test(html);
    if (!found) throw new Error(`prerender: non trovo ${label} in index.html`);
    return html.replace(regex, replacement);
}

function buildPage(meta, { noindex = false } = {}) {
    const title = escapeHtml(meta.title);
    const description = escapeHtml(meta.description);
    const url = canonicalUrl(meta.page ? meta.path : '/');

    let html = template;
    html = replaceOnce(html, /<html lang="[^"]*">/, `<html lang="${meta.lang}">`, '<html lang>');
    html = replaceOnce(html, /<meta property="og:locale"[\s\S]*?\/>/, `<meta property="og:locale" content="${OG_LOCALES[meta.lang]}" />`, 'og:locale');
    html = replaceOnce(html, /<meta property="og:image:alt"[\s\S]*?\/>/, `<meta property="og:image:alt" content="${escapeHtml(STRINGS[meta.lang].meta.ogImageAlt)}" />`, 'og:image:alt');
    if (meta.lang !== DEFAULT_LANG) {
        // Le parole chiave sono in italiano: nelle altre lingue non servono
        html = html.replace(/\s*<meta name="keywords"[\s\S]*?\/>/, '');
    }
    html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`, '<title>');
    html = replaceOnce(html, /<meta name="description"[\s\S]*?\/>/, `<meta name="description" content="${description}" />`, 'meta description');
    html = replaceOnce(html, /<meta property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${title}" />`, 'og:title');
    html = replaceOnce(html, /<meta property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${description}" />`, 'og:description');
    html = replaceOnce(html, /<meta property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${url}" />`, 'og:url');
    const hreflang = meta.page
        ? alternates(meta.page).map((a) => `\n  <link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`).join('')
        : '';
    html = replaceOnce(html, /<link rel="canonical"[\s\S]*?\/>/, `<link rel="canonical" href="${url}" />${hreflang}`, 'canonical');
    if (noindex) {
        html = replaceOnce(html, /<meta name="robots"[\s\S]*?\/>/, '<meta name="robots" content="noindex, follow" />', 'meta robots');
        html = html.replace(/\s*<link rel="canonical"[\s\S]*?\/>/, '');
    }
    html = replaceOnce(html, '<div id="root"></div>', `<div id="root">${render(meta.path)}</div>`, '<div id="root">');
    return html;
}

for (const meta of PAGES) {
    const file = meta.path.endsWith('/') ? `${meta.path.slice(1)}index.html` : `${meta.path.slice(1)}.html`;
    fs.mkdirSync(path.dirname(path.join(dist, file)), { recursive: true });
    fs.writeFileSync(path.join(dist, file), buildPage(meta));
    console.log(`prerender: ${meta.path} -> dist/${file}`);
}

// Un solo 404.html per tutto il sito (lo impone GitHub Pages), in italiano:
// sotto /en/, /de/ e /fr/ il browser lo ridisegna nella lingua giusta (src/main.tsx).
fs.writeFileSync(path.join(dist, '404.html'), buildPage(NOT_FOUND, { noindex: true }));
console.log('prerender: 404 -> dist/404.html');

// Sitemap con tutte le pagine in tutte le lingue, ciascuna con le sue versioni alternative
const urls = PAGES.map((meta) => {
    const links = alternates(meta.page)
        .map((a) => `\n    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`)
        .join('');
    return `  <url>\n    <loc>${canonicalUrl(meta.path)}</loc>${links}\n  </url>`;
});
fs.writeFileSync(
    path.join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
);
console.log(`prerender: sitemap.xml con ${urls.length} indirizzi`);

fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true });
