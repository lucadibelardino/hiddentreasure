import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
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
if (container.hasChildNodes() && !redirected) {
  ReactDOM.hydrateRoot(container, app)
} else {
  container.textContent = ''
  ReactDOM.createRoot(container).render(app)
}
