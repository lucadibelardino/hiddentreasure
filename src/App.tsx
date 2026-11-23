import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import LocationMap from './components/LocationMap';
import GalleryPage from './components/GalleryPage';
import ContactPage from './components/ContactPage';
import ReviewsPage from './components/ReviewsPage';
import Footer from './components/Footer';
import PageHead from './seo/PageHead';

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
        <LocationMap />
    </>
);

const NotFound: React.FC = () => (
    <main className="notFound">
        <div className="container">
            <p className="eyebrow">Errore 404</p>
            <h1>Questa pagina non esiste</h1>
            <p>Il link potrebbe essere vecchio. Torna alla home o guarda le fotografie della villa.</p>
            <div className="notFoundActions">
                <Link to="/">Torna alla home</Link>
                <Link to="/gallery">Vedi la galleria</Link>
            </div>
        </div>
    </main>
);

const App: React.FC = () => (
    <>
        <a className="skipLink" href="#main">Vai al contenuto</a>
        <PageHead />
        <Header />
        <ScrollToTop />
        <div id="main">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/recensioni" element={<ReviewsPage />} />
                <Route path="/contatti" element={<ContactPage />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </div>
        <Footer />
    </>
);

export default App;
