/**
 * Dopo `vite build`, genera un file HTML completo per ogni pagina del sito
 * (dist/index.html, dist/gallery.html, ...) con il contenuto gia' renderizzato
 * e titolo, descrizione e canonical propri. GitHub Pages serve /gallery
 * da gallery.html, quindi gli indirizzi restano puliti.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js');

const { render, PAGES, NOT_FOUND, canonicalUrl } = await import(pathToFileURL(ssrEntry).href);
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
    const url = canonicalUrl(meta === NOT_FOUND ? '/' : meta.path);

    let html = template;
    html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`, '<title>');
    html = replaceOnce(html, /<meta name="description"[\s\S]*?\/>/, `<meta name="description" content="${description}" />`, 'meta description');
    html = replaceOnce(html, /<meta property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${title}" />`, 'og:title');
    html = replaceOnce(html, /<meta property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${description}" />`, 'og:description');
    html = replaceOnce(html, /<meta property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${url}" />`, 'og:url');
    html = replaceOnce(html, /<link rel="canonical"[\s\S]*?\/>/, `<link rel="canonical" href="${url}" />`, 'canonical');
    if (noindex) {
        html = replaceOnce(html, /<meta name="robots"[\s\S]*?\/>/, '<meta name="robots" content="noindex, follow" />', 'meta robots');
        html = html.replace(/\s*<link rel="canonical"[\s\S]*?\/>/, '');
    }
    html = replaceOnce(html, '<div id="root"></div>', `<div id="root">${render(meta.path)}</div>`, '<div id="root">');
    return html;
}

for (const meta of PAGES) {
    const file = meta.path === '/' ? 'index.html' : `${meta.path.slice(1)}.html`;
    fs.writeFileSync(path.join(dist, file), buildPage(meta));
    console.log(`prerender: ${meta.path} -> dist/${file}`);
}

fs.writeFileSync(path.join(dist, '404.html'), buildPage(NOT_FOUND, { noindex: true }));
console.log('prerender: 404 -> dist/404.html');

fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true });
