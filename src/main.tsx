import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { langFromPath } from './i18n/langs'
// Font serviti dal nostro dominio (niente Google Fonts: non passiamo l'IP dei visitatori a Google)
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/cormorant-garamond/600-italic.css'
import '@fontsource/karla/300.css'
import '@fontsource/karla/400.css'
import '@fontsource/karla/500.css'
import '@fontsource/karla/600.css'
import '@fontsource/karla/700.css'
import './styles/global.css'

// I vecchi indirizzi con il cancelletto (/#/gallery) diventano indirizzi puliti (/gallery).
let redirected = false
if (window.location.hash.startsWith('#/')) {
  const path = window.location.hash.slice(1)
  window.history.replaceState(null, '', path)
  redirected = true
}

const container = document.getElementById('root')!
const app = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

// Le pagine sono pre-renderizzate in fase di build: React riprende l'HTML esistente.
// Se la lingua dell'HTML non e' quella dell'indirizzo (il 404.html unico, in italiano,
// servito sotto /en/...), la pagina si ridisegna da capo nella lingua giusta.
const sameLang = document.documentElement.lang === langFromPath(window.location.pathname)
if (container.hasChildNodes() && !redirected && sameLang) {
  ReactDOM.hydrateRoot(container, app)
} else {
  container.textContent = ''
  ReactDOM.createRoot(container).render(app)
}
