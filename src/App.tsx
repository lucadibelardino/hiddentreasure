import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import ReviewsHighlight from './components/ReviewsHighlight';
import LocationMap from './components/LocationMap';
import GalleryPage from './components/GalleryPage';
import ContactPage from './components/ContactPage';
import ReviewsPage from './components/ReviewsPage';
import PrivacyPage from './components/PrivacyPage';
import WelcomePage from './components/WelcomePage';
import { WELCOME_ROUTES } from './i18n/welcome';
import Footer from './components/Footer';
import PageHead from './seo/PageHead';
import { LANGS, DEFAULT_LANG, ROUTES, useLang, useT, type PageKey } from './i18n';

/** Ogni cambio pagina riparte dall'alto, tranne quando si punta a una sezione. */
const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }, [pathname]);
    return null;
};

const HomePage: React.FC = () => (
    <>
        <Hero />
        <Features />
        <ReviewsHighlight />
        <LocationMap />
    </>
);

const NotFound: React.FC = () => {
    const lang = useLang();
    const t = useT().notFound;
    return (
        <main className="notFound">
            <div className="container">
                <p className="eyebrow">{t.eyebrow}</p>
                <h1>{t.title}</h1>
                <p>{t.text}</p>
                <div className="notFoundActions">
                    <Link to={ROUTES[lang].home}>{t.home}</Link>
                    <Link to={ROUTES[lang].gallery}>{t.gallery}</Link>
                </div>
            </div>
        </main>
    );
};

const PAGE_ELEMENTS: Record<PageKey, React.ReactElement> = {
    home: <HomePage />,
    gallery: <GalleryPage />,
    reviews: <ReviewsPage />,
    contact: <ContactPage />,
    privacy: <PrivacyPage />,
};

/* Ogni pagina esiste in ogni lingua: /gallery, /en/gallery, /de/galerie, /fr/galerie... */
const routes = LANGS.flatMap((lang) => [
    // Guida per gli ospiti: fuori dal menu e dalla sitemap, noindex (src/i18n/welcome.ts)
    <Route key={`${lang}-welcome`} path={WELCOME_ROUTES[lang]} element={<WelcomePage />} />,
    ...(Object.keys(PAGE_ELEMENTS) as PageKey[]).map((page) => (
        <Route key={`${lang}-${page}`} path={ROUTES[lang][page]} element={PAGE_ELEMENTS[page]} />
    )),
    ...(lang === DEFAULT_LANG ? [] : [<Route key={`${lang}-404`} path={`/${lang}/*`} element={<NotFound />} />]),
]);

const App: React.FC = () => {
    const t = useT();
    const lang = useLang();
    return (
        <>
            <a className="skipLink" href="#main">{t.common.skipLink}</a>
            <PageHead />
            <Header />
            <ScrollToTop />
            {/* key={lang}: cambiando lingua le pagine ripartono da zero, cosi' le animazioni
                di comparsa (useReveal) agganciano i nuovi elementi */}
            <div id="main" key={lang}>
                <Routes>
                    {routes}
                    {/* Vecchia pagina di prova: ora la barra e' nella home */}
                    <Route path="/provabanner" element={<Navigate to={ROUTES[DEFAULT_LANG].home} replace />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </div>
            <Footer />
        </>
    );
};

export default App;
