/**
 * Dati usati nella privacy policy (src/i18n/privacy.ts).
 * I periodi di conservazione devono coincidere con quelli del Worker
 * (worker/richieste.js, funzione pulizia): se ne cambi uno, cambia anche l'altro.
 */
export const PRIVACY = {
    /** Chi decide come e perché si usano i dati (il "titolare del trattamento"). */
    controller: 'DA_COMPLETARE nome e cognome',
    address: 'DA_COMPLETARE indirizzo',
    email: 'gestionehtv@gmail.com',
    /** Richieste dal modulo: cancellate in automatico N mesi dopo la data di partenza. */
    requestMonths: 12,
    /** Ultimo aggiornamento della policy (AAAA-MM-GG). */
    updated: '2026-11-25',
};
