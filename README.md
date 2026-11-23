# Hidden Treasure Villasimius

Sito della villa Hidden Treasure a Villasimius (Sardegna): presentazione, galleria
fotografica, calendario delle disponibilità e contatti per la prenotazione diretta.

## Lingue

Il sito è in italiano (lingua principale, alla radice: `/`, `/gallery`, `/recensioni`,
`/contatti`) e in inglese (`/en/`), tedesco (`/de/`) e francese (`/fr/`), con indirizzi
tradotti (es. `/de/galerie`, `/fr/avis`).

- Indirizzi delle pagine per lingua: `src/i18n/langs.ts`.
- Tutti i testi, compresi titoli e descrizioni per Google: `src/i18n/strings.ts`.
- Traduzioni delle recensioni: campo `i18n` di ogni recensione in `src/data/reviews.json`
  (se manca, nelle altre lingue compare il testo italiano).
- Parole chiave del filtro recensioni per lingua: `src/data/reviewKeywords.ts`.

In fase di build `scripts/prerender.js` genera una pagina HTML per ogni pagina in ogni
lingua, con `lang`, hreflang e canonical corretti, e la `sitemap.xml` completa.
