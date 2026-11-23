/* eslint-disable react-refresh/only-export-components -- entry di build, non usato dal dev server */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App';

/** Usato solo in fase di build (scripts/prerender.js) per generare l'HTML statico. */
export function render(url: string): string {
    return renderToString(
        <React.StrictMode>
            <StaticRouter location={url}>
                <App />
            </StaticRouter>
        </React.StrictMode>,
    );
}

export { PAGES, NOT_FOUND, canonicalUrl } from './seo/pages';
