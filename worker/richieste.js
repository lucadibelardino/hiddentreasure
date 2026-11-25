/*
 * Worker Cloudflare "richieste" — copia di riferimento del codice che gira su Cloudflare.
 * Si pubblica a mano: Workers & Pages → richieste → Edit code → incolla tutto → Deploy.
 *
 * Collegamenti (Settings del Worker):
 *   DB              D1 "hiddentreasure"
 *   EMAIL           send_email (Email Routing)
 *   AIRBNB_ICAL_URL secret: link "Esporta calendario" di Airbnb
 *   SESSION_SECRET  secret: stringa casuale lunga, firma i cookie di accesso
 *   TURNSTILE_SECRET secret: "Secret key" del widget Turnstile (anti-bot)
 *   RESEND_API_KEY  secret FACOLTATIVO: se c'è, la conferma all'ospite parte da Resend
 *                   invece che dal binding EMAIL (vedi inviaConferma)
 * Cron Trigger: 0 * * * *   (sincronizzazione Airbnb ogni ora)
 * Domini: richieste.luca-dibelardino.workers.dev (API pubbliche)
 *         gestione.hiddentreasurevillasimius.com (pagina di gestione, con login)
 */

// Siti che possono chiamare le API pubbliche (CORS)
const ORIGINI = ["https://hiddentreasurevillasimius.com", "http://localhost:5173"];
const DATA = /^\d{4}-\d{2}-\d{2}$/;

const HOST_GESTIONE = "gestione.hiddentreasurevillasimius.com";
const EMAIL_LUCA = "luca.dibelardino@gmail.com";
const MITTENTE = { email: "sito@hiddentreasurevillasimius.com", name: "Hidden Treasure - sito" };

// Conferma di ricezione all'ospite
const MITTENTE_OSPITI = { email: "sito@hiddentreasurevillasimius.com", name: "Hidden Treasure Villasimius" };
const RISPOSTE_A = "gestionehtv@gmail.com"; // dove arriva il "Rispondi" dell'ospite
const CONFERME_PER_INDIRIZZO = 1; // al massimo 1 conferma ogni 24 ore allo stesso indirizzo
const CONFERME_AL_GIORNO = 20;    // oltre 20 richieste in 24 ore sospendiamo le conferme (spam)

// Regole del login
const CIFRE_CODICE = 8;          // 10^8 combinazioni
const MINUTI_CODICE = 10;        // durata di un codice
const TENTATIVI_CODICE = 5;      // errori ammessi per codice
const CODICI_AL_GIORNO = 10;     // codici richiedibili in 24 ore
const GIORNI_SESSIONE = 7;       // durata del cookie
const COOKIE = "__Host-sessione"; // __Host-: solo HTTPS, solo questo dominio, Path=/

// Turnstile: il "non sono un robot" di Cloudflare. La Site key è pubblica,
// la Secret key sta nel secret TURNSTILE_SECRET e non va mai scritta qui.
const TURNSTILE_SITEKEY = "0x4AAAAAAGRhX_xa0_6Ci-QP";
const TURNSTILE_HOST_OK = ["hiddentreasurevillasimius.com", HOST_GESTIONE, "localhost"];

// Limiti del modulo richieste (gli stessi del sito, con un po' di margine)
const MAX_NOME = 120, MAX_EMAIL = 254, MAX_TELEFONO = 40, MAX_MESSAGGIO = 2500, MAX_NOTTI = 90;
const LINGUE = ["it", "en", "de", "fr"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Tutto quello che arriva su gestione.… va alla pagina di gestione (con login)
    if (url.hostname === HOST_GESTIONE) return gestione(request, env, url);

    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ORIGINI.includes(origin) ? origin : ORIGINI[0],
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    const risposta = (dati, stato = 200, extra = {}) =>
      new Response(JSON.stringify(dati), {
        status: stato,
        headers: { ...cors, "Content-Type": "application/json", ...extra },
      });

    // Il browser prima "chiede il permesso" con OPTIONS: rispondiamo sì
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    // Lettura pubblica: prezzi e date occupate (il browser la tiene 5 minuti)
    if (request.method === "GET" && url.pathname === "/calendario") {
      return risposta(await calendario(env), 200, { "Cache-Control": "public, max-age=300" });
    }

    // Nuova richiesta dal modulo del sito
    if (request.method === "POST" && (url.pathname === "/" || url.pathname === "/richiesta")) {
      return nuovaRichiesta(request, env, risposta);
    }

    return risposta({ errore: "Indirizzo non trovato" }, 404);
  },

  // Parte da solo grazie al Cron Trigger
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sincronizzaAirbnb(env));
    ctx.waitUntil(pulizia(env));
  },
};

/* ════════════════════════ API pubbliche ════════════════════════ */

// Legge un valore dalla tabella impostazioni (es. max_ospiti)
async function impostazione(env, chiave, predefinito) {
  const riga = await env.DB.prepare("SELECT valore FROM impostazioni WHERE chiave = ?").bind(chiave).first();
  return riga ? riga.valore : predefinito;
}

async function calendario(env) {
  const oggi = new Date().toISOString().slice(0, 10);
  // batch: tre query in un solo viaggio verso il database
  const [stagioni, giorni, impostazioni] = await env.DB.batch([
    env.DB.prepare("SELECT nome, dal, al, prezzo_notte_eur, min_notti FROM stagioni WHERE al >= ? ORDER BY dal").bind(oggi),
    env.DB.prepare("SELECT data, prezzo_notte_eur, min_notti FROM prezzi_giorno WHERE data >= ? ORDER BY data").bind(oggi),
    env.DB.prepare("SELECT chiave, valore FROM impostazioni"),
  ]);
  const imp = Object.fromEntries(impostazioni.results.map((r) => [r.chiave, Number(r.valore)]));
  const { blocchi } = await blocchiEffettivi(env, oggi);
  return {
    aggiornato: new Date().toISOString(),
    max_ospiti: imp.max_ospiti ?? 6,
    ospiti_inclusi: imp.ospiti_inclusi ?? 2,
    supplemento_ospite_eur: imp.supplemento_ospite_eur ?? 0,
    blocchi: blocchi.map((b) => ({ dal: b.dal, al: b.al })),
    stagioni: stagioni.results,
    prezzi_giorno: giorni.results,
  };
}

/*
 * Notti occupate davvero: i blocchi meno le notti Airbnb che Luca ha sbloccato.
 * Gli sblocchi stanno in una tabella a parte (sblocchi), quindi la sincronizzazione
 * oraria può riscrivere i blocchi Airbnb senza cancellarli.
 * Le PRENOTAZIONI Airbnb non si sbloccano mai: si sbloccano solo le notti
 * "non disponibili" (chiuse a mano su Airbnb o per le sue regole).
 */
const prenotazione = (b) => b.origine === "airbnb" && !/not available|non disponibile|blocked/i.test(b.nota || "");

async function leggiSblocchi(env, daGiorno) {
  try {
    const { results } = await env.DB.prepare("SELECT id, dal, al FROM sblocchi WHERE al > ? ORDER BY dal").bind(daGiorno).all();
    return results;
  } catch {
    return []; // tabella non ancora creata: nessuno sblocco
  }
}

async function blocchiEffettivi(env, daGiorno) {
  const { results } = await env.DB.prepare(
    "SELECT id, dal, al, origine, nota FROM blocchi WHERE al > ? ORDER BY dal"
  ).bind(daGiorno).all();
  const sblocchi = await leggiSblocchi(env, daGiorno);
  const blocchi = [];
  const sbloccati = []; // pezzi di Airbnb liberati da Luca, per mostrarli nella gestione
  for (const b of results) {
    if (b.origine !== "airbnb" || prenotazione(b)) { blocchi.push({ ...b, prenotazione: prenotazione(b) }); continue; }
    // Sottrae gli sblocchi dal blocco, pezzo per pezzo
    let pezzi = [{ dal: b.dal, al: b.al }];
    for (const s of sblocchi) {
      const nuovi = [];
      for (const p of pezzi) {
        if (s.al <= p.dal || s.dal >= p.al) { nuovi.push(p); continue; }
        if (p.dal < s.dal) nuovi.push({ dal: p.dal, al: s.dal });
        if (s.al < p.al) nuovi.push({ dal: s.al, al: p.al });
        sbloccati.push({ dal: s.dal > p.dal ? s.dal : p.dal, al: s.al < p.al ? s.al : p.al });
      }
      pezzi = nuovi;
    }
    for (const p of pezzi) blocchi.push({ ...b, ...p, prenotazione: false });
  }
  return { blocchi, sbloccati, sblocchi };
}

// Chiede a Cloudflare se il token del widget è valido. Ogni token vale una volta sola.
// Senza TURNSTILE_SECRET risponde sempre no: meglio un modulo fermo che uno aperto ai bot.
async function turnstileValido(token, request, env) {
  if (!env.TURNSTILE_SECRET) { console.log("Manca il secret TURNSTILE_SECRET"); return false; }
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  const dati = new FormData();
  dati.append("secret", env.TURNSTILE_SECRET);
  dati.append("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) dati.append("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: dati });
    const esito = await res.json();
    // Il token deve venire da una delle nostre pagine, non da un sito qualsiasi
    return esito.success === true && TURNSTILE_HOST_OK.includes(esito.hostname);
  } catch (e) {
    console.log("Turnstile non raggiungibile:", e.message);
    return false;
  }
}

// Testo dal modulo: deve essere una stringa, senza spazi ai lati e non troppo lungo
const testo = (v, max) => (typeof v === "string" && v.trim().length <= max ? v.trim() : null);
// Nell'oggetto della mail niente "a capo": servirebbero a falsificare intestazioni
const unaRiga = (v) => v.replace(/[\r\n]+/g, " ");

async function nuovaRichiesta(request, env, risposta) {
  let r;
  try { r = await request.json(); } catch { return risposta({ errore: "JSON non valido" }, 400); }

  // Trappola anti-spam: campo nascosto che solo i bot compilano
  if (r.sito) return risposta({ ok: true });

  // Controlli sui campi: tipo, lunghezza, date sensate (il massimo ospiti è nel database)
  const nome = testo(r.nome, MAX_NOME);
  const email = testo(r.email, MAX_EMAIL);
  const telefono = r.telefono == null || r.telefono === "" ? "" : testo(r.telefono, MAX_TELEFONO);
  const messaggio = r.messaggio == null || r.messaggio === "" ? "" : testo(r.messaggio, MAX_MESSAGGIO);
  const lingua = LINGUE.includes(r.lingua) ? r.lingua : "it";
  const ospiti = Number(r.ospiti);
  const maxOspiti = Number(await impostazione(env, "max_ospiti", "6"));
  // "ieri" in UTC: chi è in un fuso più avanti può avere già cambiato giorno
  const ieri = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const notti = DATA.test(r.check_in) && DATA.test(r.check_out)
    ? (Date.parse(r.check_out) - Date.parse(r.check_in)) / 86_400_000 : NaN;
  if (!nome || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || telefono === null || messaggio === null
      || !(notti >= 1 && notti <= MAX_NOTTI) || r.check_in < ieri
      || !Number.isInteger(ospiti) || ospiti < 1 || ospiti > maxOspiti) {
    return risposta({ errore: "Dati mancanti o non validi" }, 400);
  }

  // Solo adesso il controllo anti-bot (costa una chiamata a Cloudflare)
  if (!(await turnstileValido(r.turnstile, request, env))) {
    return risposta({ errore: "Verifica anti-bot non riuscita" }, 403);
  }

  // Le date cadono su un periodo occupato? (dal < partenza E al > arrivo)
  const { blocchi } = await blocchiEffettivi(env, r.check_in);
  const occupato = blocchi.some((b) => b.dal < r.check_out && b.al > r.check_in);
  if (occupato) return risposta({ errore: "Date non disponibili" }, 409);

  // INSERT con i "?": i valori vengono passati a parte, mai incollati nel testo SQL
  await env.DB.prepare(
    `INSERT INTO richieste (nome, email, telefono, check_in, check_out, ospiti, messaggio, lingua)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(nome, email, telefono || null, r.check_in, r.check_out, ospiti, messaggio || null, lingua)
   .run();

  // Notifica via email (se fallisce, la richiesta resta comunque salvata)
  try {
    await env.EMAIL.send({
      from: MITTENTE,
      to: EMAIL_LUCA,
      replyTo: unaRiga(email),
      subject: `Nuova richiesta: ${unaRiga(nome)}, ${r.check_in} → ${r.check_out}`,
      text: `Nome: ${nome}\nEmail: ${email}\nTelefono: ${telefono || "-"}\n` +
            `Arrivo: ${r.check_in}\nPartenza: ${r.check_out}\nOspiti: ${ospiti}\n` +
            `Lingua: ${lingua}\n\nMessaggio:\n${messaggio || "-"}\n\n` +
            `Gestisci: https://${HOST_GESTIONE}`,
    });
  } catch (e) {
    console.log("Email non inviata:", e.message);
  }

  // Conferma all'ospite (se fallisce, la richiesta resta salvata e Luca è avvisato lo stesso)
  const conferma = await inviaConferma(env, { nome, email, lingua, check_in: r.check_in, check_out: r.check_out, notti, ospiti });

  return risposta({ ok: true, conferma });
}

/* ── Conferma di ricezione all'ospite ──
 * Va a un indirizzo scritto da chiunque nel modulo: per non diventare uno strumento
 * per mandare spam a sconosciuti
 *  - parte solo dopo Turnstile e dopo che la richiesta è stata salvata;
 *  - non contiene MAI testo libero dell'ospite (messaggio), solo date e numeri già controllati;
 *  - il nome compare solo se fatto di lettere (niente link o cifre);
 *  - al massimo CONFERME_PER_INDIRIZZO al giorno allo stesso indirizzo,
 *    e nessuna conferma se in 24 ore arrivano più di CONFERME_AL_GIORNO richieste.
 */
async function inviaConferma(env, d) {
  const { stesso, totale } = await env.DB.prepare(
    `SELECT SUM(lower(email) = lower(?)) AS stesso, COUNT(*) AS totale
     FROM richieste WHERE creato_il > datetime('now', '-1 day')`
  ).bind(d.email).first();
  // La richiesta appena salvata è già contata
  if (stesso > CONFERME_PER_INDIRIZZO || totale > CONFERME_AL_GIORNO) return false;

  const t = TESTI_CONFERMA[d.lingua] || TESTI_CONFERMA.it;
  const primo = d.nome.split(/\s+/)[0];
  const nome = /^[\p{L}'’-]{1,30}$/u.test(primo) ? primo : "";
  const data = (iso) => new Date(iso + "T12:00:00Z").toLocaleDateString(t.locale, {
    weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
  const righe = [
    [t.arrivo, data(d.check_in)],
    [t.partenza, data(d.check_out)],
    [t.notti, String(d.notti)],
    [t.ospiti, String(d.ospiti)],
  ];
  const sito = "https://hiddentreasurevillasimius.com" + (d.lingua === "it" ? "" : "/" + d.lingua);

  const text = `${t.ciao(nome)}\n\n${t.intro}\n\n` +
    righe.map(([k, v]) => `${k}: ${v}`).join("\n") +
    `\n\n${t.nonAncora}\n${t.rispondi}\n\n${t.firma}\n${sito}\n\n— \n${t.piede}`;

  const html = `<!doctype html><html lang="${d.lingua}"><body style="margin:0;padding:0;background:#f6f4ef">
<div style="max-width:520px;margin:0 auto;padding:40px 24px;font-family:Georgia,'Times New Roman',serif;color:#1f2a2e">
<p style="margin:0 0 28px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#7a8a8f">Hidden Treasure · Villasimius</p>
<p style="margin:0 0 16px;font-size:20px">${esc(t.ciao(nome))}</p>
<p style="margin:0 0 28px;font-size:16px;line-height:1.6">${esc(t.intro)}</p>
<table role="presentation" style="width:100%;border-collapse:collapse;font-family:Helvetica,Arial,sans-serif;font-size:15px;margin:0 0 28px">
${righe.map(([k, v]) => `<tr><td style="padding:10px 0;border-top:1px solid #e3ded3;color:#7a8a8f">${esc(k)}</td><td style="padding:10px 0;border-top:1px solid #e3ded3;text-align:right">${esc(v)}</td></tr>`).join("\n")}
</table>
<p style="margin:0 0 12px;font-size:16px;line-height:1.6">${esc(t.nonAncora)}</p>
<p style="margin:0 0 28px;font-size:16px;line-height:1.6">${esc(t.rispondi)}</p>
<p style="margin:0 0 40px;font-size:16px">${esc(t.firma).replace(/\n/g, "<br>")}<br><a href="${sito}" style="color:#1f2a2e">hiddentreasurevillasimius.com</a></p>
<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#9aa5a8">${esc(t.piede)}</p>
</div></body></html>`;

  const mail = { to: d.email, subject: t.oggetto, text, html };
  try {
    if (env.RESEND_API_KEY) {
      // Alternativa gratuita: Resend (serve il dominio verificato su resend.com)
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `${MITTENTE_OSPITI.name} <${MITTENTE_OSPITI.email}>`,
          to: [mail.to], reply_to: RISPOSTE_A, subject: mail.subject, text, html,
        }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    } else {
      // Cloudflare Email Sending: richiede dominio "onboarded" in Email Sending + piano Workers Paid.
      // Senza, Cloudflare rifiuta (E_RECIPIENT_PLAN_RESTRICTED / E_RECIPIENT_NOT_ALLOWED) e finiamo nel catch.
      await env.EMAIL.send({ from: MITTENTE_OSPITI, replyTo: RISPOSTE_A, ...mail });
    }
    return true;
  } catch (e) {
    console.log("Conferma all'ospite non inviata:", e.code || "", e.message);
    return false;
  }
}

// Per l'HTML della mail: niente tag dentro i testi
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const TESTI_CONFERMA = {
  it: {
    locale: "it-IT",
    oggetto: "Abbiamo ricevuto la tua richiesta · Hidden Treasure",
    ciao: (n) => (n ? `Ciao ${n},` : "Ciao,"),
    intro: "grazie per averci scritto. Abbiamo ricevuto la tua richiesta per queste date:",
    arrivo: "Arrivo", partenza: "Partenza", notti: "Notti", ospiti: "Ospiti",
    nonAncora: "Non è ancora una prenotazione: controlliamo la disponibilità e ti rispondiamo al più presto.",
    rispondi: "Per qualsiasi domanda puoi rispondere direttamente a questa email.",
    firma: "A presto,\nHidden Treasure Villasimius",
    piede: "Ricevi questa email perché il tuo indirizzo è stato inserito nel modulo richieste del sito. Se non sei stato tu, puoi ignorarla.",
  },
  en: {
    locale: "en-GB",
    oggetto: "We have received your request · Hidden Treasure",
    ciao: (n) => (n ? `Hi ${n},` : "Hi,"),
    intro: "thank you for getting in touch. We have received your request for these dates:",
    arrivo: "Check-in", partenza: "Check-out", notti: "Nights", ospiti: "Guests",
    nonAncora: "This is not a booking yet: we will check availability and get back to you as soon as possible.",
    rispondi: "If you have any questions, just reply to this email.",
    firma: "See you soon,\nHidden Treasure Villasimius",
    piede: "You are receiving this email because your address was entered in the request form on our website. If it wasn't you, you can ignore it.",
  },
  de: {
    locale: "de-DE",
    oggetto: "Wir haben Ihre Anfrage erhalten · Hidden Treasure",
    ciao: (n) => (n ? `Hallo ${n},` : "Hallo,"),
    intro: "vielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage für diese Daten erhalten:",
    arrivo: "Anreise", partenza: "Abreise", notti: "Nächte", ospiti: "Gäste",
    nonAncora: "Dies ist noch keine Buchung: Wir prüfen die Verfügbarkeit und melden uns so bald wie möglich.",
    rispondi: "Bei Fragen antworten Sie einfach auf diese E-Mail.",
    firma: "Bis bald,\nHidden Treasure Villasimius",
    piede: "Sie erhalten diese E-Mail, weil Ihre Adresse im Anfrageformular unserer Website eingegeben wurde. Falls Sie das nicht waren, können Sie sie ignorieren.",
  },
  fr: {
    locale: "fr-FR",
    oggetto: "Nous avons bien reçu votre demande · Hidden Treasure",
    ciao: (n) => (n ? `Bonjour ${n},` : "Bonjour,"),
    intro: "merci de nous avoir écrit. Nous avons bien reçu votre demande pour ces dates :",
    arrivo: "Arrivée", partenza: "Départ", notti: "Nuits", ospiti: "Voyageurs",
    nonAncora: "Ce n'est pas encore une réservation : nous vérifions la disponibilité et nous vous répondons au plus vite.",
    rispondi: "Pour toute question, il vous suffit de répondre à cet e-mail.",
    firma: "À bientôt,\nHidden Treasure Villasimius",
    piede: "Vous recevez cet e-mail parce que votre adresse a été saisie dans le formulaire de demande de notre site. Si ce n'était pas vous, vous pouvez l'ignorer.",
  },
};

/* ════════════════════════ Sincronizzazione Airbnb ════════════════════════ */

// Scarica l'iCal di Airbnb e riscrive i blocchi con origine 'airbnb'
async function sincronizzaAirbnb(env) {
  const res = await fetch(env.AIRBNB_ICAL_URL);
  const testo = await res.text();
  // Se Airbnb risponde male non tocchiamo niente: meglio date vecchie che nessuna data
  if (!res.ok || !testo.includes("BEGIN:VCALENDAR")) {
    console.log("iCal non valido, stato", res.status);
    return;
  }
  const oggi = new Date().toISOString().slice(0, 10);
  const eventi = leggiIcal(testo).filter((e) => e.al > oggi);

  // batch = transazione: o va a buon fine tutto, o non cambia niente
  await env.DB.batch([
    env.DB.prepare("DELETE FROM blocchi WHERE origine = 'airbnb'"),
    ...eventi.map((e) =>
      env.DB.prepare("INSERT OR IGNORE INTO blocchi (dal, al, origine, uid_ical, nota) VALUES (?, ?, 'airbnb', ?, ?)")
        .bind(e.dal, e.al, e.uid || null, e.titolo || null)
    ),
  ]);
  console.log(`Airbnb: ${eventi.length} periodi occupati`);
}

// Legge gli eventi da un file iCal: servono inizio, fine, UID e titolo
function leggiIcal(testo) {
  // Le righe lunghe sono spezzate: la continuazione inizia con uno spazio
  const righe = testo.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const eventi = [];
  let ev = null;
  for (const riga of righe) {
    if (riga === "BEGIN:VEVENT") ev = {};
    else if (riga === "END:VEVENT") {
      if (ev?.dal && ev?.al) eventi.push(ev);
      ev = null;
    } else if (ev) {
      const [chiave, ...resto] = riga.split(":");
      const valore = resto.join(":");
      const nome = chiave.split(";")[0]; // "DTSTART;VALUE=DATE" -> "DTSTART"
      if (nome === "DTSTART") ev.dal = dataIcal(valore);
      if (nome === "DTEND") ev.al = dataIcal(valore);
      if (nome === "UID") ev.uid = valore;
      if (nome === "SUMMARY") ev.titolo = valore; // "Reserved" = prenotazione, "Airbnb (Not available)" = chiuso
    }
  }
  return eventi;
}

// "20270501" -> "2027-05-01"
const dataIcal = (v) => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;

/* ════════════════════════ Gestione (con login) ════════════════════════ */

// Intestazioni di sicurezza per tutte le risposte della gestione
const SICUREZZA = {
  "Cache-Control": "no-store",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'self'; script-src 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; style-src 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'",
};

const json = (dati, stato = 200, extra = {}) =>
  new Response(JSON.stringify(dati), { status: stato, headers: { ...SICUREZZA, "Content-Type": "application/json", ...extra } });

const html = (pagina) =>
  new Response(pagina, { headers: { ...SICUREZZA, "Content-Type": "text/html; charset=utf-8" } });

async function gestione(request, env, url) {
  const { pathname } = url;
  const metodo = request.method;

  // Ogni modifica deve partire da questa pagina (protezione CSRF, insieme a SameSite=Strict)
  if (metodo !== "GET" && request.headers.get("Origin") !== `https://${HOST_GESTIONE}`) {
    return json({ errore: "Origine non valida" }, 403);
  }

  const dentro = await sessioneValida(request, env);

  if (metodo === "GET" && pathname === "/") return html(dentro ? PAGINA_GESTIONE : PAGINA_LOGIN);
  if (metodo === "POST" && pathname === "/login/codice") return mandaCodice(request, env);
  if (metodo === "POST" && pathname === "/login/verifica") return verificaCodice(request, env);
  if (metodo === "POST" && pathname === "/logout") {
    return json({ ok: true }, 200, { "Set-Cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
  }

  if (pathname.startsWith("/api/")) {
    if (!dentro) return json({ errore: "Accesso richiesto" }, 401);
    try {
      return await api(request, env, metodo, pathname);
    } catch (e) {
      console.log("Errore API:", e.message);
      return json({ errore: "Operazione non riuscita" }, 500);
    }
  }

  return json({ errore: "Indirizzo non trovato" }, 404);
}

/* ── Login: codice via email ── */

async function mandaCodice(request, env) {
  // Prima di tutto il controllo anti-bot: senza, chiunque potrebbe esaurire i codici del giorno
  const corpo = await request.json().catch(() => ({}));
  if (!(await turnstileValido(corpo.turnstile, request, env))) {
    return json({ errore: "Verifica anti-bot non riuscita: ricarica la pagina e riprova." }, 403);
  }

  // Limiti: un codice al minuto, CODICI_AL_GIORNO al giorno
  const { ultimo, giorno } = await env.DB.prepare(
    `SELECT
       SUM(creato_il > datetime('now', '-1 minute')) AS ultimo,
       COUNT(*) AS giorno
     FROM login_codici WHERE creato_il > datetime('now', '-1 day')`
  ).first();
  if (ultimo > 0) return json({ errore: "Aspetta un minuto prima di chiedere un altro codice." }, 429);
  if (giorno >= CODICI_AL_GIORNO) return json({ errore: "Troppi codici richiesti oggi. Riprova domani." }, 429);

  // Codice casuale con il generatore crittografico (non Math.random)
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10 ** CIFRE_CODICE;
  const codice = String(n).padStart(CIFRE_CODICE, "0");
  const scade = new Date(Date.now() + MINUTI_CODICE * 60_000).toISOString();

  // Nel database va solo l'impronta del codice, mai il codice in chiaro
  await env.DB.prepare("INSERT INTO login_codici (hash, scade) VALUES (?, ?)")
    .bind(await impronta(codice, env), scade).run();

  // Il codice va SEMPRE e solo alla casella di Luca, scritta qui sopra
  await env.EMAIL.send({
    from: MITTENTE,
    to: EMAIL_LUCA,
    subject: `Codice di accesso: ${codice.slice(0, 4)} ${codice.slice(4)}`,
    text: `Il tuo codice per entrare nella gestione è:\n\n${codice.slice(0, 4)} ${codice.slice(4)}\n\n` +
          `Vale ${MINUTI_CODICE} minuti e si può usare una volta sola.\n` +
          `Se non l'hai chiesto tu, ignora questa email: senza il codice nessuno può entrare.`,
  });
  return json({ ok: true });
}

async function verificaCodice(request, env) {
  let corpo;
  try { corpo = await request.json(); } catch { return json({ errore: "Richiesta non valida" }, 400); }
  const codice = String(corpo.codice || "").replace(/\D/g, "");
  if (codice.length !== CIFRE_CODICE) return json({ errore: `Il codice ha ${CIFRE_CODICE} cifre.` }, 400);

  // Vale solo l'ultimo codice richiesto, se non è scaduto né già usato
  const riga = await env.DB.prepare(
    "SELECT id, hash, tentativi FROM login_codici WHERE usato = 0 AND scade > ? ORDER BY id DESC LIMIT 1"
  ).bind(new Date().toISOString()).first();
  if (!riga) return json({ errore: "Codice scaduto: chiedine uno nuovo." }, 400);
  if (riga.tentativi >= TENTATIVI_CODICE) return json({ errore: "Troppi tentativi: chiedi un nuovo codice." }, 400);

  // Il tentativo si conta PRIMA del confronto, con un'unica istruzione:
  // aumenta solo se c'è ancora posto, così cento tentativi in parallelo non superano il limite
  const conto = await env.DB.prepare(
    "UPDATE login_codici SET tentativi = tentativi + 1 WHERE id = ? AND tentativi < ? AND usato = 0 RETURNING tentativi"
  ).bind(riga.id, TENTATIVI_CODICE).first();
  if (!conto) return json({ errore: "Troppi tentativi: chiedi un nuovo codice." }, 400);

  if (!uguali(await impronta(codice, env), riga.hash)) {
    const restano = TENTATIVI_CODICE - conto.tentativi;
    return json({ errore: restano > 0 ? `Codice sbagliato. Tentativi rimasti: ${restano}.` : "Codice sbagliato: chiedine uno nuovo." }, 400);
  }

  // Il codice si usa una volta sola: se due richieste arrivano insieme, vince solo la prima
  const { meta } = await env.DB.prepare("UPDATE login_codici SET usato = 1 WHERE id = ? AND usato = 0").bind(riga.id).run();
  if (meta.changes !== 1) return json({ errore: "Codice già usato: chiedine uno nuovo." }, 400);
  const scadenza = Date.now() + GIORNI_SESSIONE * 86_400_000;
  const token = `${scadenza}.${await firma(String(scadenza), env)}`;
  return json({ ok: true }, 200, {
    "Set-Cookie": `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${GIORNI_SESSIONE * 86400}`,
  });
}

// Il cookie è "scadenza.firma": chi non conosce SESSION_SECRET non può crearne uno valido
async function sessioneValida(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!token) return false;
  const [scadenza, firmaRicevuta] = token.split(".");
  if (!scadenza || !firmaRicevuta || !(Number(scadenza) > Date.now())) return false;
  return uguali(await firma(scadenza, env), firmaRicevuta);
}

// HMAC-SHA256 con SESSION_SECRET, in base64url
async function firma(testo, env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) throw new Error("SESSION_SECRET mancante o troppo corto");
  const chiave = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", chiave, new TextEncoder().encode(testo)));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Impronta del codice: HMAC con il segreto, così dal database non si risale al codice
const impronta = (codice, env) => firma(`codice:${codice}`, env);

// Confronto a tempo costante: non rivela quanti caratteri sono giusti
function uguali(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ── API della gestione (solo con sessione valida) ── */

const STATI = ["nuova", "confermata", "rifiutata"];
const IMPOSTAZIONI = {
  max_ospiti: { min: 1, max: 30, nome: "Massimo ospiti" },
  ospiti_inclusi: { min: 1, max: 30, nome: "Ospiti compresi nel prezzo" },
  supplemento_ospite_eur: { min: 0, max: 1000, nome: "Supplemento per ospite" },
};

// Toglie le notti da dal ad al (escluso) dai blocchi manuali: un blocco che le
// comprende tutte sparisce, uno che le tocca in parte viene accorciato o diviso in due
async function ritagliaBlocchi(env, dal, al) {
  const { results } = await env.DB.prepare(
    "SELECT id, dal, al, nota FROM blocchi WHERE origine = 'manuale' AND dal < ? AND al > ?"
  ).bind(al, dal).all();
  const ins = env.DB.prepare("INSERT INTO blocchi (dal, al, origine, nota) VALUES (?, ?, 'manuale', ?)");
  const istruzioni = [];
  for (const b of results) {
    istruzioni.push(env.DB.prepare("DELETE FROM blocchi WHERE id = ?").bind(b.id));
    if (b.dal < dal) istruzioni.push(ins.bind(b.dal, dal, b.nota));
    if (b.al > al) istruzioni.push(ins.bind(al, b.al, b.nota));
  }
  return istruzioni;
}

// Come ritagliaBlocchi, ma sulla tabella degli sblocchi di Airbnb
async function ritagliaSblocchi(env, dal, al) {
  const ins = env.DB.prepare("INSERT INTO sblocchi (dal, al) VALUES (?, ?)");
  const istruzioni = [];
  for (const s of await leggiSblocchi(env, "0000-00-00")) {
    if (s.dal >= al || s.al <= dal) continue;
    istruzioni.push(env.DB.prepare("DELETE FROM sblocchi WHERE id = ?").bind(s.id));
    if (s.dal < dal) istruzioni.push(ins.bind(s.dal, dal));
    if (s.al > al) istruzioni.push(ins.bind(al, s.al));
  }
  return istruzioni;
}

// Tutti i giorni da dal ad al compresi, come "AAAA-MM-GG" (null se le date non vanno bene o superano un anno)
function giorniTra(dal, al) {
  if (!DATA.test(dal || "") || !DATA.test(al || "") || al < dal) return null;
  const giorni = [];
  for (let d = new Date(dal + "T00:00:00Z"); d.toISOString().slice(0, 10) <= al; d.setUTCDate(d.getUTCDate() + 1)) {
    giorni.push(d.toISOString().slice(0, 10));
    if (giorni.length > 366) return null;
  }
  return giorni;
}
const numero = (v, min = 0) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min ? n : NaN;
};

async function api(request, env, metodo, pathname) {
  const parti = pathname.split("/").filter(Boolean); // ["api", "stagioni", "3"]
  const [, risorsa, id, azione] = parti;
  const corpo = metodo === "POST" ? await request.json().catch(() => ({})) : {};
  const errore = (msg) => json({ errore: msg }, 400);

  // Tutti i dati della pagina in una volta
  if (metodo === "GET" && risorsa === "dati") {
    const oggi = new Date().toISOString().slice(0, 10);
    const [stagioni, giorni, richieste, impostazioni] = await env.DB.batch([
      env.DB.prepare("SELECT * FROM stagioni ORDER BY dal"),
      env.DB.prepare("SELECT * FROM prezzi_giorno WHERE data >= ? ORDER BY data").bind(oggi),
      env.DB.prepare("SELECT * FROM richieste ORDER BY id DESC LIMIT 200"),
      env.DB.prepare("SELECT chiave, valore FROM impostazioni"),
    ]);
    const { blocchi, sbloccati } = await blocchiEffettivi(env, oggi);
    return json({
      stagioni: stagioni.results,
      prezzi_giorno: giorni.results,
      blocchi,
      sbloccati,
      richieste: richieste.results,
      impostazioni: Object.fromEntries(impostazioni.results.map((r) => [r.chiave, r.valore])),
    });
  }

  // Stagioni: crea (senza id) o modifica (con id)
  if (risorsa === "stagioni" && metodo === "POST") {
    const prezzo = numero(corpo.prezzo_notte_eur, 0);
    const minNotti = numero(corpo.min_notti, 1) ?? 1;
    if (!String(corpo.nome || "").trim() || !DATA.test(corpo.dal) || !DATA.test(corpo.al) || corpo.al < corpo.dal
        || prezzo === null || Number.isNaN(prezzo) || Number.isNaN(minNotti)) {
      return errore("Controlla nome, date (la fine non può venire prima dell'inizio), prezzo e notti minime.");
    }
    if (id) {
      await env.DB.prepare("UPDATE stagioni SET nome = ?, dal = ?, al = ?, prezzo_notte_eur = ?, min_notti = ? WHERE id = ?")
        .bind(corpo.nome.trim(), corpo.dal, corpo.al, prezzo, Math.round(minNotti), Number(id)).run();
    } else {
      await env.DB.prepare("INSERT INTO stagioni (nome, dal, al, prezzo_notte_eur, min_notti) VALUES (?, ?, ?, ?, ?)")
        .bind(corpo.nome.trim(), corpo.dal, corpo.al, prezzo, Math.round(minNotti)).run();
    }
    return json({ ok: true });
  }
  if (risorsa === "stagioni" && metodo === "DELETE" && id) {
    await env.DB.prepare("DELETE FROM stagioni WHERE id = ?").bind(Number(id)).run();
    return json({ ok: true });
  }

  // Giorni speciali: uno o più giorni di fila, dal/al compresi (se un giorno c'è già, viene sostituito)
  if (risorsa === "prezzi_giorno" && metodo === "POST" && !id) {
    const prezzo = numero(corpo.prezzo_notte_eur, 0);
    const minNotti = numero(corpo.min_notti, 1);
    const giorni = giorniTra(corpo.dal || corpo.data, corpo.al || corpo.data);
    if (!giorni || Number.isNaN(prezzo) || Number.isNaN(minNotti) || (prezzo === null && minNotti === null)) {
      return errore("Servono le date (al massimo un anno) e almeno un prezzo o un minimo di notti.");
    }
    const nota = String(corpo.nota || "").trim() || null;
    const ins = env.DB.prepare("INSERT OR REPLACE INTO prezzi_giorno (data, prezzo_notte_eur, min_notti, nota) VALUES (?, ?, ?, ?)");
    await env.DB.batch(giorni.map((g) => ins.bind(g, prezzo, minNotti === null ? null : Math.round(minNotti), nota)));
    return json({ ok: true, giorni: giorni.length });
  }
  // Toglie i giorni speciali in un intervallo (dal/al compresi)
  if (risorsa === "prezzi_giorno" && metodo === "POST" && id === "elimina") {
    if (!DATA.test(corpo.dal) || !DATA.test(corpo.al) || corpo.al < corpo.dal) return errore("Date non valide.");
    await env.DB.prepare("DELETE FROM prezzi_giorno WHERE data BETWEEN ? AND ?").bind(corpo.dal, corpo.al).run();
    return json({ ok: true });
  }
  if (risorsa === "prezzi_giorno" && metodo === "DELETE" && DATA.test(id || "")) {
    await env.DB.prepare("DELETE FROM prezzi_giorno WHERE data = ?").bind(id).run();
    return json({ ok: true });
  }

  // Blocchi manuali (quelli di Airbnb li gestisce la sincronizzazione).
  // dal = prima notte, al = giorno di partenza. Bloccare o sbloccare un periodo
  // ritaglia i blocchi manuali che lo toccano, così non restano sovrapposizioni.
  if (risorsa === "blocchi" && metodo === "POST" && (!id || id === "sblocca" || id === "riblocca")) {
    if (!DATA.test(corpo.dal) || !DATA.test(corpo.al) || corpo.al <= corpo.dal) {
      return errore("Il giorno di partenza deve venire dopo il primo giorno occupato.");
    }
    // Riblocca: toglie gli sblocchi, così tornano a valere le date di Airbnb
    if (id === "riblocca") {
      const istr = await ritagliaSblocchi(env, corpo.dal, corpo.al);
      if (istr.length) await env.DB.batch(istr);
      return json({ ok: true });
    }
    const istruzioni = await ritagliaBlocchi(env, corpo.dal, corpo.al);
    if (id === "sblocca") {
      // Notti Airbnb "non disponibili" nel periodo: si ricorda lo sblocco (le prenotazioni restano)
      const { results } = await env.DB.prepare(
        "SELECT dal, al, origine, nota FROM blocchi WHERE origine = 'airbnb' AND dal < ? AND al > ?"
      ).bind(corpo.al, corpo.dal).all();
      if (results.some((b) => !prenotazione(b))) {
        istruzioni.push(...await ritagliaSblocchi(env, corpo.dal, corpo.al));
        istruzioni.push(env.DB.prepare("INSERT INTO sblocchi (dal, al) VALUES (?, ?)").bind(corpo.dal, corpo.al));
      }
    }
    if (!id) {
      istruzioni.push(env.DB.prepare("INSERT INTO blocchi (dal, al, origine, nota) VALUES (?, ?, 'manuale', ?)")
        .bind(corpo.dal, corpo.al, String(corpo.nota || "").trim() || null));
    }
    if (istruzioni.length) await env.DB.batch(istruzioni);
    return json({ ok: true });
  }
  if (risorsa === "blocchi" && metodo === "DELETE" && id) {
    await env.DB.prepare("DELETE FROM blocchi WHERE id = ? AND origine = 'manuale'").bind(Number(id)).run();
    return json({ ok: true });
  }

  // Stato di una richiesta
  if (risorsa === "richieste" && azione === "stato" && metodo === "POST" && id) {
    if (!STATI.includes(corpo.stato)) return errore("Stato non valido.");
    await env.DB.prepare("UPDATE richieste SET stato = ? WHERE id = ?").bind(corpo.stato, Number(id)).run();
    return json({ ok: true });
  }
  // Elimina una richiesta (cancellazione definitiva, anche per il GDPR)
  if (risorsa === "richieste" && metodo === "DELETE" && id && !azione) {
    await env.DB.prepare("DELETE FROM richieste WHERE id = ?").bind(Number(id)).run();
    return json({ ok: true });
  }

  // Impostazioni: si salvano solo le chiavi conosciute, ognuna con i suoi limiti
  if (risorsa === "impostazioni" && metodo === "POST") {
    const salva = [];
    for (const [chiave, { min, max, nome }] of Object.entries(IMPOSTAZIONI)) {
      if (corpo[chiave] === undefined) continue;
      const v = numero(corpo[chiave], min);
      if (v === null || Number.isNaN(v) || v > max) return errore(nome + ": valore tra " + min + " e " + max + ".");
      salva.push(env.DB.prepare("INSERT OR REPLACE INTO impostazioni (chiave, valore) VALUES (?, ?)").bind(chiave, String(Math.round(v))));
    }
    if (!salva.length) return errore("Niente da salvare.");
    await env.DB.batch(salva);
    return json({ ok: true });
  }

  return json({ errore: "Operazione non trovata" }, 404);
}

/* ════════════════════════ Pagine HTML ════════════════════════ */

const STILE = `
:root{--deep:#102A3A;--sea:#2E7C8A;--brass:#B5854A;--shell:#F7F4EE;--ink:#1A2227;--soft:#5B6670;--line:rgba(26,34,39,.12);--red:#9A3F2B}
*{box-sizing:border-box}
body{margin:0;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--shell)}
h1,h2{font-family:Georgia,"Times New Roman",serif;font-weight:400;color:var(--deep);margin:0}
button,input,select{font:inherit}
button{cursor:pointer}
.btn{border:0;border-radius:999px;padding:.65rem 1.2rem;background:var(--deep);color:#fff;font-weight:600}
.btn:hover{background:var(--sea)}
.btn:disabled{opacity:.6;cursor:progress}
.link{border:0;background:none;padding:.25rem;color:var(--sea);font-weight:600;text-decoration:underline;text-underline-offset:3px}
.link.danger{color:var(--red)}
input,select{width:100%;padding:.6rem .75rem;border:1px solid rgba(26,34,39,.22);border-radius:8px;background:#fff;color:var(--ink)}
input:focus,select:focus{outline:2px solid var(--sea);outline-offset:-1px;border-color:transparent}
label{display:flex;flex-direction:column;gap:.3rem;font-size:.85rem;font-weight:600}
.card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:1.25rem}
.muted{color:var(--soft);font-size:.9rem}
.msg{min-height:1.4em;font-size:.9rem;color:var(--red)}
.msg.ok{color:var(--sea)}
`;

const PAGINA_LOGIN = `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Gestione · Hidden Treasure</title>
<style>${STILE}
main{min-height:100vh;display:grid;place-items:center;padding:1rem}
.card{width:min(400px,100%);display:flex;flex-direction:column;gap:1rem;padding:2rem}
.eyebrow{font-size:.75rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--brass);margin:0}
#codice{font-size:1.5rem;letter-spacing:.3em;text-align:center}
#form{display:flex;flex-direction:column;gap:1rem}
#form[hidden]{display:none}
</style></head>
<body><main><div class="card">
<p class="eyebrow">Hidden Treasure</p>
<h1>Gestione</h1>
<p class="muted" id="testo">Ti mandiamo un codice di accesso alla tua email.</p>
<div class="cf-turnstile" data-sitekey="${TURNSTILE_SITEKEY}" data-language="it" data-callback="pronto" data-expired-callback="scaduto"></div>
<button class="btn" id="manda" disabled>Mandami il codice</button>
<form id="form" hidden>
  <label>Codice ricevuto<input id="codice" inputmode="numeric" autocomplete="one-time-code" maxlength="9" required></label>
  <button class="btn" style="width:100%">Entra</button>
</form>
<p class="msg" id="msg" role="alert"></p>
</div></main>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<script>
const msg = document.getElementById("msg");
const manda = document.getElementById("manda");
// Turnstile chiama queste due funzioni: il pulsante si attiva solo con un token valido
let token = "";
function pronto(t) { token = t; manda.disabled = false; }
function scaduto() { token = ""; manda.disabled = true; }
const post = (url, body) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) })
  .then(async (r) => ({ ok: r.ok, dati: await r.json().catch(() => ({})) }));
document.getElementById("manda").onclick = async (e) => {
  e.target.disabled = true; msg.textContent = "";
  const r = await post("/login/codice", { turnstile: token });
  // Ogni token vale una volta: ne serve uno nuovo per "Mandane un altro"
  scaduto(); window.turnstile?.reset();
  if (!r.ok) { msg.textContent = r.dati.errore || "Errore, riprova."; return; }
  document.getElementById("testo").textContent = "Codice inviato: controlla la tua email (anche lo spam).";
  e.target.textContent = "Mandane un altro";
  e.target.className = "link";
  document.getElementById("form").hidden = false;
  document.getElementById("codice").focus();
};
document.getElementById("form").onsubmit = async (e) => {
  e.preventDefault(); msg.textContent = "";
  const r = await post("/login/verifica", { codice: document.getElementById("codice").value });
  if (r.ok) location.reload(); else msg.textContent = r.dati.errore || "Errore, riprova.";
};
</script></body></html>`;

const STILE_GESTIONE = `
header{position:sticky;top:0;z-index:5;background:var(--shell);border-bottom:1px solid var(--line)}
.top{max-width:1100px;margin:0 auto;padding:.75rem 1rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
nav{max-width:1100px;margin:0 auto;padding:0 1rem;display:flex;gap:.25rem;overflow-x:auto}
nav button{border:0;background:none;padding:.65rem .9rem;border-bottom:2px solid transparent;color:var(--soft);font-weight:600;white-space:nowrap}
nav button[aria-selected=true]{color:var(--deep);border-color:var(--deep)}
main{max-width:1100px;margin:0 auto;padding:1.25rem 1rem 4rem;display:flex;flex-direction:column;gap:1rem}
body.con-barra main{padding-bottom:12rem}
section[hidden],form[hidden],.azioni[hidden],.azioni [hidden]{display:none}
section{display:flex;flex-direction:column;gap:1rem}
h3{margin:0 0 .5rem;font-size:1rem;color:var(--deep);text-transform:capitalize}
.form{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.75rem;align-items:end}
.form .largo{grid-column:span 2}
.table{width:100%;border-collapse:collapse;font-size:.95rem}
.table th{text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;color:var(--soft);padding:.5rem;border-bottom:1px solid var(--line)}
.table td{padding:.6rem .5rem;border-bottom:1px solid var(--line);vertical-align:top}
.table tr:last-child td{border-bottom:0}
.scroll{overflow-x:auto}
.tag{display:inline-block;padding:.1rem .55rem;border-radius:999px;font-size:.8rem;font-weight:600;background:#EEF3F3;color:var(--sea)}
.tag.airbnb{background:#FBEFEA;color:#B4533C}
.tag.manuale{background:#F3EEE4;color:var(--brass)}
.tag.prenotato{background:#F6DCD3;color:var(--red)}
.tag.sbloccato{background:#fff;color:#B4533C;border:1px dashed #E3B5A6}
.vuoto{color:var(--soft);text-align:center;padding:1rem}
.richiesta{display:grid;gap:.25rem}
.richiesta strong{color:var(--deep)}
.stato{display:flex;flex-direction:column;align-items:flex-start;gap:.35rem}
.azioni{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center}
.btn.chiaro{background:#fff;color:var(--deep);border:1px solid var(--deep)}
.btn.chiaro:hover{background:var(--deep);color:#fff}

/* Campo date: un pulsante che apre il calendario */
.scegli{display:flex;align-items:center;gap:.5rem;width:100%;padding:.6rem .75rem;border:1px solid rgba(26,34,39,.22);border-radius:8px;background:#fff;color:var(--ink);text-align:left;font-weight:400}
.scegli::before{content:"";width:16px;height:16px;flex:none;border:2px solid var(--sea);border-radius:3px;border-top-width:5px}
.scegli.vuoto-campo{color:var(--soft)}

/* Calendario: mesi e giorni */
.mesi{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem 2rem}
.griglia{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.gs{font-size:.7rem;font-weight:700;color:var(--soft);text-align:center;padding:.2rem 0}
.g{position:relative;border:0;border-radius:6px;background:#fff;min-height:3.2rem;padding:.2rem .1rem;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:1px;color:var(--ink);font-size:1rem;line-height:1.15}
.g:hover:not(:disabled){outline:2px solid var(--sea);outline-offset:-2px}
.g .p{font-size:.8rem;color:var(--soft)}
.g:disabled{color:#B9C0C5;background:transparent;cursor:default}
.g:disabled .p{display:none}
.g.airbnb{background:#FBEFEA}
.g.airbnb .n{text-decoration:line-through;color:#B4533C}
.g.prenotato .n{color:#9A3F2B}
.g.manuale{background:#F3EEE4}
.g.manuale .n{text-decoration:line-through;color:var(--brass)}
.g.speciale::after{content:"";position:absolute;top:4px;right:4px;width:6px;height:6px;border-radius:50%;background:var(--brass)}
.g.sel{background:var(--sea);color:#fff}
.g.sel .p,.g.sel .n{color:#fff}
.g.estremo{background:var(--deep)}
.g.anteprima{background:#DCEBEC}
.legenda{display:flex;flex-wrap:wrap;gap:.4rem 1rem;font-size:.8rem;color:var(--soft)}
.legenda span{display:inline-flex;align-items:center;gap:.35rem}
.legenda i{width:14px;height:14px;border-radius:4px;display:inline-block}
.legenda .i-sbloccato,.g.sbloccato{background:repeating-linear-gradient(135deg,#fff 0 4px,#FBEFEA 4px 8px)}
.legenda .i-prenotato,.g.prenotato{background:#F6DCD3}
.riga-titolo{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;flex-wrap:wrap}

/* Barra della selezione nel calendario */
#barra{position:fixed;left:0;right:0;bottom:0;z-index:6;background:#fff;border-top:1px solid var(--line);box-shadow:0 -8px 24px rgba(16,42,58,.12)}
#barra[hidden]{display:none}
.barra-in{max-width:1100px;margin:0 auto;padding:1rem;display:flex;flex-direction:column;gap:.75rem}
.barra-in .form{grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}
body.con-barra #toast{bottom:9rem}

/* Finestra del calendario a comparsa */
dialog{border:0;border-radius:18px;padding:0;width:min(720px,calc(100% - 2rem));max-height:calc(100vh - 2rem);box-shadow:0 20px 60px rgba(16,42,58,.3)}
dialog::backdrop{background:rgba(16,42,58,.45)}
.pk{display:flex;flex-direction:column;gap:1rem;padding:1.25rem}
.pk-testa{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}
.x{border:0;background:#EEF0F1;border-radius:50%;width:2.2rem;height:2.2rem;font-size:1.3rem;line-height:1;color:var(--ink)}
.pk-corpo{position:relative}
.pk-nav{position:absolute;top:-.3rem;left:0;right:0;display:flex;justify-content:space-between;pointer-events:none}
.pk-nav button{pointer-events:auto;border:1px solid var(--line);background:#fff;border-radius:50%;width:2rem;height:2rem;font-size:1.1rem;line-height:1;color:var(--deep)}
.pk-nav button:disabled{opacity:.3}
.pk .mesi{grid-template-columns:1fr 1fr}
.pk h3{text-align:center}
.pk .g{min-height:2.6rem}
.pk-piede{display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:1rem}

/* Finestra di conferma */
dialog.domanda{width:min(420px,calc(100% - 2rem))}
.dm{display:flex;flex-direction:column;gap:.75rem;padding:1.75rem 1.5rem 1.5rem;text-align:center;align-items:center}
.dm h2{font-size:1.45rem}
.dm p{margin:0}
.dm label{width:100%;text-align:left}
.dm label[hidden]{display:none}
.dm-icona{width:3.25rem;height:3.25rem;border-radius:50%;display:grid;place-items:center;background:#EEF3F3;color:var(--sea);font:700 1.5rem/1 Georgia,serif}
.dm-icona::before{content:attr(data-segno)}
.domanda.pericolo .dm-icona{background:#F8E9E4;color:var(--red)}
.domanda.pericolo #dm-si{background:var(--red)}
.domanda.pericolo #dm-si:hover{background:#7d3121}
.dm-tasti{display:flex;gap:.6rem;width:100%;margin-top:.5rem}
.dm-tasti .btn{flex:1}
dialog[open]{animation:entra .18s ease-out}
dialog[open]::backdrop{animation:sfuma .18s ease-out}
@keyframes entra{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
@keyframes sfuma{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){dialog[open],dialog[open]::backdrop{animation:none}}
#toast{position:fixed;left:50%;bottom:1rem;z-index:20;transform:translateX(-50%);background:var(--deep);color:#fff;padding:.6rem 1rem;border-radius:999px;font-size:.9rem;opacity:0;transition:opacity .2s;pointer-events:none}
#toast.on{opacity:1}
#toast.err{background:var(--red)}

/* Telefono */
@media (max-width:700px){
  .table thead{display:none}
  .table,.table tbody,.table tr,.table td{display:block;width:100%}
  .table tr{padding:.75rem 0;border-bottom:1px solid var(--line)}
  .table tr:last-child{border-bottom:0}
  .table td{border:0;padding:.2rem 0}
  .card.scroll{padding:.25rem 1rem}
  .form .largo{grid-column:auto}
  .mesi{grid-template-columns:1fr}
  .card{padding:1rem}
  .g{min-height:3rem}
  dialog{width:100%;max-width:100%;max-height:92vh;margin:auto 0 0;border-radius:18px 18px 0 0}
  dialog.domanda{width:100%}
  .dm{padding-bottom:calc(1.5rem + env(safe-area-inset-bottom))}
  .pk .mesi{grid-template-columns:1fr}
  .barra-in{padding:.75rem 1rem;max-height:60vh;overflow-y:auto}
  .barra-in{gap:.5rem}
  .barra-in .riga-titolo{flex-wrap:nowrap;align-items:flex-start}
  #sel-testo{font-size:.9rem}
  .barra-in .azioni .btn{padding:.5rem .9rem;font-size:.9rem}
}
`;

const PAGINA_GESTIONE = `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Gestione · Hidden Treasure</title>
<style>${STILE}${STILE_GESTIONE}</style></head>
<body>
<header>
  <div class="top"><h1>Gestione</h1><button class="link" id="esci">Esci</button></div>
  <nav role="tablist">
    <button role="tab" data-tab="richieste" aria-selected="true">Richieste</button>
    <button role="tab" data-tab="calendario">Calendario</button>
    <button role="tab" data-tab="prezzi">Prezzi</button>
    <button role="tab" data-tab="impostazioni">Impostazioni</button>
  </nav>
</header>
<main>
  <section id="tab-richieste">
    <div class="card scroll"><table class="table"><thead><tr><th>Ricevuta</th><th>Ospite</th><th>Soggiorno</th><th>Messaggio</th><th>Stato</th></tr></thead><tbody id="richieste"></tbody></table></div>
  </section>

  <section id="tab-calendario" hidden>
    <div class="card">
      <div class="riga-titolo">
        <h2>Calendario</h2>
        <div class="legenda">
          <span><i class="i-prenotato"></i>Prenotato su Airbnb</span>
          <span><i style="background:#FBEFEA"></i>Chiuso su Airbnb</span>
          <span><i style="background:#F3EEE4"></i>Bloccato da te</span>
          <span><i class="i-sbloccato"></i>Airbnb sbloccato da te</span>
          <span><i style="background:var(--brass);width:8px;height:8px;border-radius:50%"></i>Giorno speciale</span>
        </div>
      </div>
      <p class="muted">Tocca il primo e l'ultimo giorno di un periodo, poi scegli cosa farne: cambiare prezzo o notti minime, bloccarlo, crearci una stagione. In ogni casella c'è il prezzo a notte; passandoci sopra vedi anche il minimo di notti.</p>
      <div class="mesi" id="panoramica"></div>
    </div>
    <div class="card scroll">
      <h2>Date bloccate</h2>
      <table class="table"><thead><tr><th>Dal</th><th>Al (partenza)</th><th>Origine</th><th>Nota</th><th></th></tr></thead><tbody id="blocchi"></tbody></table>
    </div>
  </section>

  <section id="tab-prezzi" hidden>
    <div class="card">
      <h2 id="titolo-stagione">Nuova stagione</h2>
      <p class="muted">Prezzo a notte per un periodo, primo e ultimo giorno compresi.</p>
      <form class="form" id="form-stagione">
        <label>Nome<input name="nome" required placeholder="Agosto"></label>
        <label class="largo">Periodo<span class="campo-date" data-titolo="Periodo della stagione"><input type="hidden" name="dal"><input type="hidden" name="al"><button type="button" class="scegli"></button></span></label>
        <label>€ a notte<input name="prezzo_notte_eur" type="number" min="0" step="1" required></label>
        <label>Notti minime<input name="min_notti" type="number" min="1" step="1" value="1"></label>
        <div class="azioni"><button class="btn">Salva</button><button type="button" class="link" id="annulla-stagione" hidden>Annulla</button></div>
      </form>
    </div>
    <div class="card scroll"><table class="table"><thead><tr><th>Stagione</th><th>Periodo</th><th>€/notte</th><th>Min. notti</th><th></th></tr></thead><tbody id="stagioni"></tbody></table></div>

    <div class="card">
      <h2>Giorni speciali</h2>
      <p class="muted">Uno o più giorni con prezzo o minimo diverso (es. Ferragosto): vincono sulla stagione. Lascia vuoto ciò che non cambia.</p>
      <form class="form" id="form-giorno">
        <label class="largo">Giorni<span class="campo-date" data-titolo="Giorni speciali"><input type="hidden" name="dal"><input type="hidden" name="al"><button type="button" class="scegli"></button></span></label>
        <label>€ a notte<input name="prezzo_notte_eur" type="number" min="0" step="1"></label>
        <label>Notti minime<input name="min_notti" type="number" min="1" step="1"></label>
        <label>Nota<input name="nota" placeholder="Ferragosto"></label>
        <div><button class="btn">Salva</button></div>
      </form>
    </div>
    <div class="card scroll"><table class="table"><thead><tr><th>Giorni</th><th>€/notte</th><th>Min. notti</th><th>Nota</th><th></th></tr></thead><tbody id="giorni"></tbody></table></div>
    <p class="muted">Notti minime: ogni soggiorno deve durare almeno quanto il minimo più alto tra le notti che comprende.</p>
  </section>

  <section id="tab-impostazioni" hidden>
    <div class="card">
      <h2>Ospiti e supplemento</h2>
      <form class="form" id="form-impostazioni">
        <label>Massimo ospiti (adulti + bambini)<input name="max_ospiti" type="number" min="1" max="30" required></label>
        <label>Ospiti compresi nel prezzo<input name="ospiti_inclusi" type="number" min="1" max="30" required></label>
        <label>Supplemento a notte per ogni ospite in più (€)<input name="supplemento_ospite_eur" type="number" min="0" step="1" required></label>
        <div><button class="btn">Salva</button></div>
      </form>
      <p class="muted" id="esempio"></p>
      <p class="muted">I neonati non contano né per il massimo né per il supplemento.</p>
    </div>
  </section>
</main>

<div id="barra" hidden><div class="barra-in">
  <div class="riga-titolo"><strong id="sel-testo"></strong><button class="link" id="sel-annulla">Annulla</button></div>
  <div class="azioni" id="sel-azioni">
    <button class="btn" id="sel-prezzo">Prezzo e notti minime</button>
    <button class="btn chiaro" id="sel-blocca">Blocca queste notti</button>
    <button class="btn chiaro" id="sel-sblocca">Sblocca</button>
    <button class="link" id="sel-riblocca">Richiudi come su Airbnb</button>
    <span class="muted" id="sel-airbnb"></span>
    <button class="link" id="sel-stagione">Crea una stagione</button>
    <button class="link danger" id="sel-togli">Togli i giorni speciali</button>
  </div>
  <form class="form" id="form-sel" hidden>
    <label>€ a notte<input name="prezzo_notte_eur" type="number" min="0" step="1"></label>
    <label>Notti minime<input name="min_notti" type="number" min="1" step="1"></label>
    <label>Nota<input name="nota" placeholder="Ferragosto"></label>
    <div class="azioni"><button class="btn">Applica ai giorni</button><button type="button" class="link" id="sel-indietro">Indietro</button></div>
  </form>
</div></div>

<dialog id="picker"><div class="pk">
  <div class="pk-testa"><div><strong id="pk-titolo"></strong><div class="muted" id="pk-hint"></div></div><button class="x" id="pk-chiudi" aria-label="Chiudi">×</button></div>
  <div class="pk-corpo">
    <div class="pk-nav"><button id="pk-prec" aria-label="Mese precedente">‹</button><button id="pk-succ" aria-label="Mese successivo">›</button></div>
    <div class="mesi" id="pk-mesi"></div>
  </div>
  <div class="pk-piede"><span id="pk-sel" class="muted"></span><div class="azioni"><button class="link" id="pk-pulisci">Cancella</button><button class="btn" id="pk-ok">Conferma</button></div></div>
</div></dialog>

<dialog id="domanda" class="domanda"><form method="dialog" class="dm">
  <div class="dm-icona" aria-hidden="true"></div>
  <h2 id="dm-titolo"></h2>
  <p class="muted" id="dm-testo"></p>
  <label id="dm-campo-label" hidden><span id="dm-campo-nome"></span><input id="dm-campo" autocomplete="off"></label>
  <div class="dm-tasti"><button type="button" class="btn chiaro" id="dm-no">Annulla</button><button class="btn" id="dm-si" value="si"></button></div>
</form></dialog>

<div id="toast" role="status"></div>
<script>(${scriptGestione.toString()})();</script>
</body></html>`;

/*
 * Il codice della pagina di gestione. Gira nel browser, non nel Worker:
 * viene copiato nella pagina come testo (scriptGestione.toString()).
 * I testi passano sempre da textContent, mai da innerHTML.
 */
function scriptGestione() {
  let dati = null;
  let stagioneInModifica = null;

  /* ── Strumenti ── */
  const $ = (id) => document.getElementById(id);
  function el(tag, props, ...figli) {
    const e = document.createElement(tag);
    Object.assign(e, props || {});
    figli.flat().forEach((f) => e.append(f instanceof Node ? f : document.createTextNode(f == null ? "" : String(f))));
    return e;
  }
  // Date come testo "AAAA-MM-GG", calcolate in UTC così il giorno non slitta mai
  const iso = (d) => d.toISOString().slice(0, 10);
  const piu = (s, n) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
  const giorniFra = (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 864e5);
  const oggi = (() => { const d = new Date(); return iso(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))); })();
  const fmt = (s, anno = true) => s ? new Date(s + "T00:00:00Z").toLocaleDateString("it-IT",
    { weekday: "short", day: "numeric", month: "short", year: anno ? "numeric" : undefined, timeZone: "UTC" }) : "";
  const periodo = (a, b) => a === b ? fmt(a) : fmt(a, a.slice(0, 4) !== b.slice(0, 4)) + " → " + fmt(b);
  const euro = (n) => n == null ? "—" : Number(n).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const giorniTesto = (n) => n === 1 ? "1 giorno" : n + " giorni";
  const telefono = () => matchMedia("(max-width:700px)").matches;

  function toast(testo, errore) {
    const t = $("toast");
    t.textContent = testo; t.className = errore ? "on err" : "on";
    clearTimeout(t._t); t._t = setTimeout(() => (t.className = ""), 2500);
  }
  async function chiama(metodo, url, body) {
    const r = await fetch(url, { method: metodo, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401) { location.reload(); return null; }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { toast(j.errore || "Errore", true); return null; }
    return j;
  }
  const datiForm = (f) => Object.fromEntries(new FormData(f).entries());
  const riga = (...celle) => el("tr", null, celle.map((c) => el("td", null, c)));
  const vuoto = (n, testo) => el("tr", null, el("td", { colSpan: n, className: "vuoto" }, testo));
  const elimina = (testo, fn, etichetta = "Elimina", dettaglio = "") => el("button", {
    className: "link danger",
    onclick: async () => { if (await chiedi({ titolo: testo, testo: dettaglio, si: etichetta, pericolo: etichetta !== "Sblocca" })) fn(); },
  }, etichetta);

  /*
   * Finestra di conferma nella grafica della pagina (al posto di confirm e prompt).
   * Con "campo" chiede anche un testo. Restituisce il testo (o true), null se si annulla.
   */
  function chiedi({ titolo, testo, si = "Conferma", pericolo = false, campo = null, segnaposto = "" }) {
    const d = $("domanda");
    d.classList.toggle("pericolo", pericolo);
    d.querySelector(".dm-icona").dataset.segno = pericolo ? "!" : campo ? "✎" : "?";
    $("dm-titolo").textContent = titolo;
    $("dm-testo").textContent = testo || "";
    $("dm-campo-label").hidden = !campo;
    $("dm-campo-nome").textContent = campo || "";
    $("dm-campo").value = "";
    $("dm-campo").placeholder = segnaposto;
    $("dm-si").textContent = si;
    d.returnValue = "";
    return new Promise((fatto) => {
      d.onclose = () => fatto(d.returnValue === "si" ? (campo ? $("dm-campo").value.trim() : true) : null);
      d.showModal();
      (campo ? $("dm-campo") : $("dm-si")).focus();
    });
  }
  $("dm-no").onclick = () => $("domanda").close();
  $("domanda").addEventListener("click", (e) => { if (e.target === $("domanda")) $("domanda").close(); });

  /* ── Cosa succede in un giorno: prezzo, minimo, blocco ── */
  function info(s) {
    const g = dati.giorni.get(s);
    const st = dati.stagioni.find((x) => x.dal <= s && s <= x.al);
    const b = dati.blocchi.find((x) => x.dal <= s && s < x.al);
    const libero = !b && dati.sbloccati.some((x) => x.dal <= s && s < x.al);
    return {
      prenotato: !!(b && b.prenotazione),
      sbloccato: libero,
      prezzo: g && g.prezzo_notte_eur != null ? g.prezzo_notte_eur : st ? st.prezzo_notte_eur : null,
      min: g && g.min_notti != null ? g.min_notti : st ? st.min_notti : 1,
      speciale: !!g,
      blocco: b ? b.origine : null,
    };
  }

  /* ── Un mese: griglia da lunedì a domenica ── */
  function mese(anno, m, decora) {
    const primo = new Date(Date.UTC(anno, m, 1));
    const quanti = new Date(Date.UTC(anno, m + 1, 0)).getUTCDate();
    const griglia = el("div", { className: "griglia" }, ["L", "M", "M", "G", "V", "S", "D"].map((g) => el("span", { className: "gs" }, g)));
    for (let i = 0; i < (primo.getUTCDay() + 6) % 7; i++) griglia.append(el("span"));
    for (let g = 1; g <= quanti; g++) {
      const s = iso(new Date(Date.UTC(anno, m, g)));
      const b = el("button", { type: "button", className: "g", disabled: s < oggi }, el("span", { className: "n" }, g));
      b.dataset.iso = s;
      decora(s, b);
      griglia.append(b);
    }
    const nome = primo.toLocaleDateString("it-IT", { month: "long", year: "numeric", timeZone: "UTC" });
    return el("div", { className: "mese" }, el("h3", null, nome), griglia);
  }
  function decoraGiorno(s, b) {
    const i = info(s);
    if (i.blocco) b.classList.add(i.blocco);
    if (i.prenotato) b.classList.add("prenotato");
    if (i.sbloccato) b.classList.add("sbloccato");
    if (i.speciale) b.classList.add("speciale");
    b.append(el("span", { className: "p" }, i.prezzo == null ? "–" : "€" + i.prezzo));
    b.title = [fmt(s), i.prezzo == null ? "senza prezzo" : euro(i.prezzo) + " a notte", i.min > 1 ? "minimo " + i.min + " notti" : "",
      i.prenotato ? "prenotato su Airbnb" : i.blocco === "airbnb" ? "chiuso su Airbnb" : i.blocco === "manuale" ? "bloccato da te" : i.sbloccato ? "chiuso su Airbnb, sbloccato da te" : ""].filter(Boolean).join(" · ");
  }
  // Colora la selezione da a a b compresi (b può mancare)
  function evidenzia(contenitore, a, b, classe = "sel") {
    contenitore.querySelectorAll(".g").forEach((x) => {
      const s = x.dataset.iso;
      const dentro = a && s >= a && s <= (b || a);
      x.classList.toggle(classe, !!dentro);
      x.classList.toggle("estremo", !!dentro && classe === "sel" && (s === a || s === (b || a)));
    });
  }

  /* ── Calendario a comparsa per scegliere le date ── */
  const pk = { campo: null, a: null, b: null, mese: null };
  function meseDi(s) { const [y, m] = s.split("-").map(Number); return { y, m: m - 1 }; }
  function apriPicker(campo) {
    pk.campo = campo;
    pk.a = campo.querySelector("[name=dal]").value || null;
    pk.b = campo.querySelector("[name=al]").value || null;
    pk.mese = meseDi(pk.a && pk.a > oggi ? pk.a : oggi);
    $("pk-titolo").textContent = campo.dataset.titolo || "Scegli le date";
    disegnaPicker();
    $("picker").showModal();
  }
  function disegnaPicker() {
    const n = telefono() ? 1 : 2;
    const mesi = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(Date.UTC(pk.mese.y, pk.mese.m + i, 1));
      mesi.push(mese(d.getUTCFullYear(), d.getUTCMonth(), (s, b) => {
        decoraGiorno(s, b);
        b.onclick = () => sceltaPicker(s);
        b.onmouseenter = () => { if (pk.a && !pk.b && s > pk.a) evidenzia($("pk-mesi"), pk.a, s); };
      }));
    }
    $("pk-mesi").replaceChildren(...mesi);
    const ora = meseDi(oggi);
    $("pk-prec").disabled = pk.mese.y === ora.y && pk.mese.m === ora.m;
    aggiornaPicker();
  }
  function aggiornaPicker() {
    evidenzia($("pk-mesi"), pk.a, pk.b);
    $("pk-hint").textContent = !pk.a ? "Tocca il primo giorno." : !pk.b ? "Ora l'ultimo giorno (per un giorno solo, conferma)." : "Fatto: conferma o tocca un altro giorno per ricominciare.";
    const fine = pk.b || pk.a;
    $("pk-sel").textContent = pk.a ? periodo(pk.a, fine) + " · " + giorniTesto(giorniFra(pk.a, fine) + 1) : "";
    $("pk-ok").disabled = !pk.a;
  }
  function sceltaPicker(s) {
    if (!pk.a || pk.b || s < pk.a) { pk.a = s; pk.b = null; } else pk.b = s;
    aggiornaPicker();
  }
  function spostaMese(n) {
    const d = new Date(Date.UTC(pk.mese.y, pk.mese.m + n, 1));
    pk.mese = { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    disegnaPicker();
  }
  $("pk-prec").onclick = () => spostaMese(telefono() ? -1 : -2);
  $("pk-succ").onclick = () => spostaMese(telefono() ? 1 : 2);
  $("pk-chiudi").onclick = () => $("picker").close();
  $("pk-pulisci").onclick = () => { pk.a = pk.b = null; aggiornaPicker(); };
  $("pk-ok").onclick = () => { impostaCampo(pk.campo, pk.a, pk.b || pk.a); $("picker").close(); };
  $("picker").addEventListener("click", (e) => { if (e.target === $("picker")) $("picker").close(); });

  function impostaCampo(campo, dal, al) {
    campo.querySelector("[name=dal]").value = dal || "";
    campo.querySelector("[name=al]").value = al || "";
    const b = campo.querySelector(".scegli");
    b.textContent = dal ? periodo(dal, al) : "Scegli le date";
    b.classList.toggle("vuoto-campo", !dal);
  }
  document.querySelectorAll(".campo-date").forEach((c) => {
    impostaCampo(c, null, null);
    c.querySelector(".scegli").onclick = () => apriPicker(c);
  });

  /* ── Vista calendario con selezione ── */
  const sel = { a: null, b: null };
  function disegnaPanoramica() {
    const ora = meseDi(oggi);
    const mesi = [];
    for (let i = 0; i < 13; i++) {
      const d = new Date(Date.UTC(ora.y, ora.m + i, 1));
      mesi.push(mese(d.getUTCFullYear(), d.getUTCMonth(), (s, b) => {
        decoraGiorno(s, b);
        b.onclick = () => sceltaPanoramica(s);
      }));
    }
    $("panoramica").replaceChildren(...mesi);
    aggiornaSelezione();
  }
  function sceltaPanoramica(s) {
    if (!sel.a || sel.b) { sel.a = s; sel.b = null; }
    else if (s < sel.a) { sel.b = sel.a; sel.a = s; }
    else sel.b = s;
    aggiornaSelezione();
  }
  function aggiornaSelezione() {
    evidenzia($("panoramica"), sel.a, sel.b);
    $("barra").hidden = !sel.a;
    document.body.classList.toggle("con-barra", !!sel.a);
    if (!sel.a) return;
    const a = sel.a, b = sel.b || sel.a;
    const n = giorniFra(a, b) + 1;
    $("sel-testo").textContent = periodo(a, b) + " · " + giorniTesto(n) + (sel.b ? "" : " (tocca l'ultimo giorno per allungare)");
    const primo = info(a);
    const f = $("form-sel");
    f.elements.prezzo_notte_eur.placeholder = primo.prezzo == null ? "" : "ora " + primo.prezzo;
    f.elements.min_notti.placeholder = "ora " + primo.min;
    // Quali notti sono libere, bloccate da Luca o occupate su Airbnb
    const conta = { libere: 0, manuale: 0, airbnb: 0, prenotate: 0, sbloccate: 0 };
    for (let s = a; s <= b; s = piu(s, 1)) {
      const i = info(s);
      if (i.prenotato) conta.prenotate++;
      else if (i.blocco === "airbnb") conta.airbnb++;
      else if (i.blocco === "manuale") conta.manuale++;
      else { conta.libere++; if (i.sbloccato) conta.sbloccate++; }
    }
    const notti = (k) => (k === 1 ? "la notte" : "le " + k + " notti");
    $("sel-blocca").hidden = !conta.libere;
    $("sel-blocca").textContent = conta.libere === n ? (n === 1 ? "Blocca questa notte" : "Blocca queste " + n + " notti") : "Blocca " + notti(conta.libere) + " libere";
    const chiuse = conta.manuale + conta.airbnb;
    $("sel-sblocca").hidden = !chiuse;
    $("sel-sblocca").textContent = chiuse === n ? (n === 1 ? "Sblocca questa notte" : "Sblocca queste " + n + " notti") : "Sblocca " + notti(chiuse) + " bloccate";
    $("sel-riblocca").hidden = !conta.sbloccate;
    $("sel-riblocca").textContent = "Richiudi come su Airbnb";
    $("sel-airbnb").textContent = conta.prenotate ? (conta.prenotate === n ? "Prenotato su Airbnb: non si sblocca." : conta.prenotate + " notti sono prenotate su Airbnb e restano occupate.") : "";
    let speciali = false;
    for (let s = a; s <= b; s = piu(s, 1)) if (dati.giorni.has(s)) { speciali = true; break; }
    $("sel-togli").hidden = !speciali;
  }
  // La barra mostra le azioni; il modulo del prezzo si apre solo quando serve
  function mostraModulo(si) {
    $("form-sel").hidden = !si;
    $("sel-azioni").hidden = si;
    if (si) $("form-sel").elements.prezzo_notte_eur.focus();
  }
  $("sel-prezzo").onclick = () => mostraModulo(true);
  $("sel-indietro").onclick = () => mostraModulo(false);
  const chiudiSelezione = () => { sel.a = sel.b = null; $("form-sel").reset(); mostraModulo(false); aggiornaSelezione(); };
  $("sel-annulla").onclick = chiudiSelezione;
  $("form-sel").onsubmit = async (e) => {
    e.preventDefault();
    const d = datiForm(e.target);
    const r = await chiama("POST", "/api/prezzi_giorno", { ...d, dal: sel.a, al: sel.b || sel.a });
    if (r) { toast("Salvato per " + giorniTesto(r.giorni)); chiudiSelezione(); carica(); }
  };
  $("sel-blocca").onclick = async () => {
    const fine = piu(sel.b || sel.a, 1);
    const nota = await chiedi({
      titolo: "Bloccare queste date?",
      testo: periodo(sel.a, sel.b || sel.a) + ". Sul sito non si potranno prenotare; la partenza resta possibile il " + fmt(fine, false) + ".",
      campo: "Nota (facoltativa)", segnaposto: "Lavori, amici, soggiorno mio…", si: "Blocca",
    });
    if (nota === null) return;
    if (await chiama("POST", "/api/blocchi", { dal: sel.a, al: fine, nota })) { toast("Date bloccate"); chiudiSelezione(); carica(); }
  };
  $("sel-sblocca").onclick = async () => {
    const fine = piu(sel.b || sel.a, 1);
    const ok = await chiedi({
      titolo: "Sbloccare queste date?",
      testo: periodo(sel.a, sel.b || sel.a) + ". Diventano prenotabili sul sito e restano libere anche dopo la sincronizzazione con Airbnb. " +
        "Le notti chiuse su Airbnb restano chiuse su Airbnb: se un ospite le chiede, aprile anche lì prima di confermare. Le prenotazioni Airbnb non si toccano.",
      si: "Sblocca",
    });
    if (!ok) return;
    if (await chiama("POST", "/api/blocchi/sblocca", { dal: sel.a, al: fine })) { toast("Date sbloccate"); chiudiSelezione(); carica(); }
  };
  $("sel-riblocca").onclick = async () => {
    const ok = await chiedi({ titolo: "Richiudere come su Airbnb?", testo: periodo(sel.a, sel.b || sel.a) + ". Le notti che hai sbloccato tornano a seguire il calendario di Airbnb.", si: "Richiudi" });
    if (!ok) return;
    if (await chiama("POST", "/api/blocchi/riblocca", { dal: sel.a, al: piu(sel.b || sel.a, 1) })) { toast("Di nuovo come su Airbnb"); chiudiSelezione(); carica(); }
  };
  $("sel-togli").onclick = async () => {
    if (!(await chiedi({ titolo: "Togliere i giorni speciali?", testo: "In questi giorni tornano a valere i prezzi e i minimi delle stagioni.", si: "Togli", pericolo: true }))) return;
    if (await chiama("POST", "/api/prezzi_giorno/elimina", { dal: sel.a, al: sel.b || sel.a })) { toast("Giorni speciali tolti"); chiudiSelezione(); carica(); }
  };
  $("sel-stagione").onclick = () => {
    const a = sel.a, b = sel.b || sel.a;
    chiudiSelezione();
    fineModifica();
    impostaCampo(document.querySelector("#form-stagione .campo-date"), a, b);
    apriScheda("prezzi");
    $("form-stagione").elements.nome.focus();
  };

  /* ── Caricamento e tabelle ── */
  async function carica() {
    const r = await chiama("GET", "/api/dati");
    if (!r) return;
    dati = { ...r, giorni: new Map(r.prezzi_giorno.map((g) => [g.data, g])) };
    disegnaRichieste(); disegnaStagioni(); disegnaGiorni(); disegnaBlocchi(); disegnaPanoramica();
    const f = $("form-impostazioni");
    f.elements.max_ospiti.value = dati.impostazioni.max_ospiti || 6;
    f.elements.ospiti_inclusi.value = dati.impostazioni.ospiti_inclusi || 2;
    f.elements.supplemento_ospite_eur.value = dati.impostazioni.supplemento_ospite_eur || 0;
    esempio();
  }

  function disegnaRichieste() {
    $("richieste").replaceChildren(...(dati.richieste.length ? dati.richieste.map((r) => {
      const stato = el("select", { onchange: async (e) => { if (await chiama("POST", "/api/richieste/" + r.id + "/stato", { stato: e.target.value })) toast("Stato aggiornato"); } },
        ["nuova", "confermata", "rifiutata"].map((s) => el("option", { value: s, selected: s === (r.stato || "nuova") }, s)));
      const ospite = el("div", { className: "richiesta" },
        el("strong", null, r.nome),
        el("a", { href: "mailto:" + r.email }, r.email),
        r.telefono ? el("a", { href: "tel:" + r.telefono }, r.telefono) : "");
      const notti = giorniFra(r.check_in, r.check_out);
      return riga((r.creato_il || "").slice(0, 16), ospite,
        el("div", { className: "richiesta" }, fmt(r.check_in) + " → " + fmt(r.check_out), el("span", { className: "muted" }, notti + " notti · " + r.ospiti + " ospiti · " + (r.lingua || "").toUpperCase())),
        el("span", { className: "muted", style: "white-space:pre-line" }, r.messaggio || ""),
        el("div", { className: "stato" }, stato,
          elimina("Eliminare la richiesta di " + r.nome + "?", async () => {
            if (await chiama("DELETE", "/api/richieste/" + r.id)) { toast("Richiesta eliminata"); carica(); }
          }, "Elimina", "Nome, contatti e messaggio vengono cancellati per sempre.")));
    }) : [vuoto(5, "Nessuna richiesta per ora.")]));
  }

  function disegnaStagioni() {
    $("stagioni").replaceChildren(...(dati.stagioni.length ? dati.stagioni.map((s) => riga(
      s.nome, periodo(s.dal, s.al), euro(s.prezzo_notte_eur), s.min_notti,
      el("div", { className: "azioni" },
        el("button", { className: "link", onclick: () => modificaStagione(s) }, "Modifica"),
        elimina("Eliminare la stagione " + s.nome + "?", async () => { if (await chiama("DELETE", "/api/stagioni/" + s.id)) { toast("Stagione eliminata"); carica(); } }))
    )) : [vuoto(5, "Nessuna stagione: senza prezzo il sito non mostra il totale.")]));
  }
  function modificaStagione(s) {
    stagioneInModifica = s.id;
    const f = $("form-stagione");
    ["nome", "prezzo_notte_eur", "min_notti"].forEach((k) => (f.elements[k].value = s[k]));
    impostaCampo(f.querySelector(".campo-date"), s.dal, s.al);
    $("titolo-stagione").textContent = "Modifica: " + s.nome;
    $("annulla-stagione").hidden = false;
    f.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function fineModifica() {
    stagioneInModifica = null;
    $("form-stagione").reset();
    impostaCampo(document.querySelector("#form-stagione .campo-date"), null, null);
    $("titolo-stagione").textContent = "Nuova stagione";
    $("annulla-stagione").hidden = true;
  }
  $("annulla-stagione").onclick = fineModifica;

  // I giorni speciali di fila con gli stessi valori diventano una riga sola
  function disegnaGiorni() {
    const gruppi = [];
    for (const g of dati.prezzi_giorno) {
      const u = gruppi[gruppi.length - 1];
      if (u && piu(u.al, 1) === g.data && u.prezzo_notte_eur === g.prezzo_notte_eur && u.min_notti === g.min_notti && u.nota === g.nota) u.al = g.data;
      else gruppi.push({ ...g, dal: g.data, al: g.data });
    }
    $("giorni").replaceChildren(...(gruppi.length ? gruppi.map((g) => riga(
      periodo(g.dal, g.al), euro(g.prezzo_notte_eur), g.min_notti == null ? "—" : g.min_notti, g.nota || "",
      elimina("Togliere i giorni speciali " + periodo(g.dal, g.al) + "?", async () => {
        if (await chiama("POST", "/api/prezzi_giorno/elimina", { dal: g.dal, al: g.al })) { toast("Giorni speciali tolti"); carica(); }
      })
    )) : [vuoto(5, "Nessun giorno speciale.")]));
  }

  function disegnaBlocchi() {
    const sblocca = (dal, al) => async () => { if (await chiama("POST", "/api/blocchi/sblocca", { dal, al })) { toast("Date sbloccate"); carica(); } };
    const righe = [
      ...dati.blocchi.map((b) => ({ ...b, tipo: b.prenotazione ? "prenotato" : b.origine })),
      ...dati.sbloccati.map((b) => ({ ...b, tipo: "sbloccato" })),
    ].sort((x, y) => (x.dal < y.dal ? -1 : 1));
    const etichette = { prenotato: "prenotato su Airbnb", airbnb: "chiuso su Airbnb", manuale: "da te", sito: "dal sito", sbloccato: "sbloccato da te" };
    $("blocchi").replaceChildren(...(righe.length ? righe.map((b) => riga(
      fmt(b.dal), fmt(b.al), el("span", { className: "tag " + b.tipo }, etichette[b.tipo] || b.tipo), b.tipo === "manuale" ? b.nota || "" : "",
      b.tipo === "prenotato" ? el("span", { className: "muted" }, "non si sblocca")
        : b.tipo === "sbloccato"
          ? el("button", { className: "link", onclick: async () => {
              if (await chiama("POST", "/api/blocchi/riblocca", { dal: b.dal, al: b.al })) { toast("Di nuovo come su Airbnb"); carica(); }
            } }, "Richiudi")
          : elimina("Sbloccare " + periodo(b.dal, piu(b.al, -1)) + "?", sblocca(b.dal, b.al), "Sblocca")
    )) : [vuoto(5, "Nessuna data bloccata.")]));
  }

  // Esempio del supplemento con i valori del modulo
  function esempio() {
    const f = $("form-impostazioni");
    const inclusi = Number(f.elements.ospiti_inclusi.value) || 0;
    const supp = Number(f.elements.supplemento_ospite_eur.value) || 0;
    const max = Number(f.elements.max_ospiti.value) || 0;
    const ospiti = Math.min(max, inclusi + 2);
    const extra = Math.max(0, ospiti - inclusi);
    $("esempio").textContent = !supp || !extra
      ? "Senza supplemento il prezzo a notte è lo stesso per qualsiasi numero di ospiti."
      : "Esempio: con " + ospiti + " ospiti e una notte da 150 €, il sito calcola 150 + " + extra + " × " + supp + " = " + (150 + extra * supp) + " € a notte.";
  }
  $("form-impostazioni").oninput = esempio;

  /* ── Moduli ── */
  function invio(id, fn) {
    const f = $(id);
    f.onsubmit = async (e) => {
      e.preventDefault();
      const d = datiForm(f);
      if ("dal" in d && !d.dal) { toast("Scegli le date", true); f.querySelector(".scegli").click(); return; }
      const b = f.querySelector("button.btn"); b.disabled = true;
      try { await fn(d, f); } finally { b.disabled = false; }
    };
  }
  invio("form-stagione", async (d) => {
    const url = "/api/stagioni" + (stagioneInModifica ? "/" + stagioneInModifica : "");
    if (await chiama("POST", url, d)) { toast("Stagione salvata"); fineModifica(); carica(); }
  });
  invio("form-giorno", async (d, f) => {
    const r = await chiama("POST", "/api/prezzi_giorno", d);
    if (r) { toast("Salvato per " + giorniTesto(r.giorni)); f.reset(); impostaCampo(f.querySelector(".campo-date"), null, null); carica(); }
  });
  invio("form-impostazioni", async (d) => { if (await chiama("POST", "/api/impostazioni", d)) { toast("Impostazioni salvate"); carica(); } });

  /* ── Schede ── */
  function apriScheda(nome) {
    document.querySelectorAll("nav button").forEach((x) => x.setAttribute("aria-selected", x.dataset.tab === nome));
    document.querySelectorAll("main section").forEach((s) => (s.hidden = s.id !== "tab-" + nome));
    if (nome !== "calendario" && sel.a) chiudiSelezione();
  }
  document.querySelectorAll("nav button").forEach((b) => (b.onclick = () => apriScheda(b.dataset.tab)));
  $("esci").onclick = async () => { await chiama("POST", "/logout"); location.reload(); };

  carica();
}

/* ════════════════════════ Pulizia automatica (GDPR) ════════════════════════ */

// Per quanti mesi teniamo le richieste dopo la data di partenza richiesta.
// Lo stesso numero è scritto nella privacy policy del sito (src/data/privacy.ts):
// se lo cambi qui, cambialo anche lì.
const MESI_RICHIESTE = 3;

// Parte a ogni Cron Trigger (ogni ora): cancella le richieste che hanno finito il loro scopo
async function pulizia(env) {
  const { meta } = await env.DB.prepare("DELETE FROM richieste WHERE check_out < date('now', ?)")
    .bind(`-${MESI_RICHIESTE} months`).run();
  if (meta.changes) console.log(`Pulizia: ${meta.changes} richieste cancellate`);
}
