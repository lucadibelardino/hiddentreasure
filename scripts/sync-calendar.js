import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import ical from 'node-ical';

// L'unica credenziale necessaria: l'URL iCal di Airbnb, che arriva dal secret.
const AIRBNB_ICAL_URL = process.env.CALENDAR_KEY;

// Il file finisce in public/, quindi viene copiato in dist/ dalla build
// e servito da GitHub Pages come una qualsiasi risorsa statica.
const OUTPUT = path.join(process.cwd(), 'public', 'availability.json');

if (!AIRBNB_ICAL_URL) {
    console.error('Manca CALENDAR_KEY. Controlla il secret del repository e il blocco env: nel workflow.');
    process.exit(1);
}

/**
 * Data in formato YYYY-MM-DD.
 * Gli eventi Airbnb sono giornate intere: leggere i componenti invece di usare
 * toISOString() evita che un fuso orario sposti una prenotazione di un giorno.
 * Il workflow forza comunque TZ=UTC.
 */
function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function sync() {
    console.log("Scarico l'iCal da Airbnb...");
    const events = await ical.async.fromURL(AIRBNB_ICAL_URL);

    const today = toISODate(new Date());
    const blocked = [];
    let skipped = 0;

    for (const key of Object.keys(events)) {
        const event = events[key];
        if (event.type !== 'VEVENT' || !event.start || !event.end) continue;

        const from = toISODate(event.start);
        // "to" e' il giorno di partenza: la casa torna libera, quindi
        // e' un estremo escluso. Chi legge il file deve trattarlo cosi'.
        const to = toISODate(event.end);

        if (to < today) { skipped++; continue; }

        blocked.push({ from, to });
    }

    blocked.sort((a, b) => a.from.localeCompare(b.from));

    console.log(`Trovati ${blocked.length} periodi occupati (${skipped} gia' passati, ignorati).`);

    // Nessun dato dell'ospite finisce nel file: solo le date.
    const payload = { updatedAt: new Date().toISOString(), source: 'airbnb', blocked };
    const next = JSON.stringify(payload, null, 2) + '\n';

    // Confronto ignorando updatedAt: se le date non cambiano non ha senso
    // generare un commit e una nuova pubblicazione del sito.
    let changed = true;
    try {
        const current = JSON.parse(await readFile(OUTPUT, 'utf8'));
        changed = JSON.stringify(current.blocked) !== JSON.stringify(blocked);
    } catch {
        console.log('Nessun file precedente: lo creo.');
    }

    if (!changed) {
        console.log('Le date sono identiche a quelle gia' + "'" + ' pubblicate: non aggiorno nulla.');
        return;
    }

    await writeFile(OUTPUT, next, 'utf8');
    console.log(`Scritto ${OUTPUT}`);
}

sync().catch((err) => {
    console.error('Errore durante la sincronizzazione:', err);
    process.exit(1);
});
