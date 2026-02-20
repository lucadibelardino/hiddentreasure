import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Gallery from './components/Gallery';
import Contact from './components/Contact';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="app">
      <Header />
      <Hero />
      <Features />
      <Gallery />
      <Gallery />
      {/* <Contact /> Replaced by BookingBar */}
      <Footer />
    </div>
  );
};

export default App;
