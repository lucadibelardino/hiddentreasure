# Hidden Treasure Villasimius

Sito della villa Hidden Treasure a Villasimius (Sardegna): presentazione, galleria
fotografica, calendario delle disponibilità e contatti per la prenotazione diretta.

## Stack

- **React 19 + TypeScript**, build con **Vite**
- **React Router** (HashRouter, richiesto da GitHub Pages)
- **Supabase** per le date già occupate (tabella `blocked_dates`)
- **react-day-picker** per il calendario
- CSS Modules + variabili in `src/styles/variables.css`

## Sviluppo

```bash
npm install
npm run dev      # server locale
npm run build    # controllo tipi + build di produzione in dist/
npm run lint
```

Servono due variabili d'ambiente in `.env.local`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Senza queste variabili il sito funziona lo stesso: il calendario si apre, ma senza
le date occupate.

## Struttura

```
src/
  components/     Header, Hero, BookingBar, Features, GalleryPage, ContactPage, Footer
  hooks/          useReveal — animazioni allo scroll con IntersectionObserver
  lib/            client Supabase
  styles/         variabili di design e stili globali
public/images/    hero/ (slideshow) e gallery/ (galleria)
```

## Design

Tipografia **Fraunces** (titoli) + **Karla** (testo). La palette è in
`src/styles/variables.css`: petrolio `--c-deep`, turchese `--c-sea`,
ottone `--c-brass` su fondo `--c-shell`. Toccando quelle variabili
cambia il colore di tutto il sito.

## Deploy

Ogni push su `main` fa partire `.github/workflows/deploy.yml`, che builda e
pubblica su GitHub Pages. La cartella `dist/` versionata non viene usata dalla CI.

Un secondo workflow (`sync-calendar.yml`) sincronizza le date occupate dai
calendari iCal delle piattaforme verso Supabase.
