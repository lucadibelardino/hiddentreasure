/*
 * Worker Cloudflare "richieste" — copia di riferimento del codice che gira su Cloudflare.
 * Si pubblica a mano: Workers & Pages → richieste → Edit code → incolla tutto → Deploy.
 *
 * Collegamenti (Settings del Worker):
 *   DB              D1 "hiddentreasure"
 *   EMAIL           send_email (Email Routing)
 *   AIRBNB_ICAL_URL secret: link "Esporta calendario" di Airbnb
 *   SESSION_SECRET  secret: stringa casuale lunga, firma i cookie di accesso
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

// Regole del login
const CIFRE_CODICE = 8;          // 10^8 combinazioni
const MINUTI_CODICE = 10;        // durata di un codice
const TENTATIVI_CODICE = 5;      // errori ammessi per codice
const CODICI_AL_GIORNO = 10;     // codici richiedibili in 24 ore
const GIORNI_SESSIONE = 30;      // durata del cookie

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
  const [blocchi, stagioni, giorni] = await env.DB.batch([
    env.DB.prepare("SELECT dal, al FROM blocchi WHERE al > ? ORDER BY dal").bind(oggi),
    env.DB.prepare("SELECT nome, dal, al, prezzo_notte_eur, min_notti FROM stagioni WHERE al >= ? ORDER BY dal").bind(oggi),
    env.DB.prepare("SELECT data, prezzo_notte_eur, min_notti FROM prezzi_giorno WHERE data >= ? ORDER BY data").bind(oggi),
  ]);
  return {
    aggiornato: new Date().toISOString(),
    max_ospiti: Number(await impostazione(env, "max_ospiti", "6")),
    blocchi: blocchi.results,
    stagioni: stagioni.results,
    prezzi_giorno: giorni.results,
  };
}

async function nuovaRichiesta(request, env, risposta) {
  let r;
  try { r = await request.json(); } catch { return risposta({ errore: "JSON non valido" }, 400); }

  // Trappola anti-spam: campo nascosto che solo i bot compilano
  if (r.sito) return risposta({ ok: true });

  // Controlli minimi, con il massimo ospiti preso dal database
  const maxOspiti = Number(await impostazione(env, "max_ospiti", "6"));
  if (!r.nome || !r.email?.includes("@") || !DATA.test(r.check_in) || !DATA.test(r.check_out)
      || r.check_out <= r.check_in || !(r.ospiti >= 1 && r.ospiti <= maxOspiti)) {
    return risposta({ errore: "Dati mancanti o non validi" }, 400);
  }

  // Le date cadono su un periodo occupato? (dal < partenza E al > arrivo)
  const occupato = await env.DB.prepare("SELECT 1 FROM blocchi WHERE dal < ? AND al > ? LIMIT 1")
    .bind(r.check_out, r.check_in).first();
  if (occupato) return risposta({ errore: "Date non disponibili" }, 409);

  // INSERT con i "?": i valori vengono passati a parte, mai incollati nel testo SQL
  await env.DB.prepare(
    `INSERT INTO richieste (nome, email, telefono, check_in, check_out, ospiti, messaggio, lingua)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(r.nome, r.email, r.telefono || null, r.check_in, r.check_out, r.ospiti, r.messaggio || null, r.lingua || "it")
   .run();

  // Notifica via email (se fallisce, la richiesta resta comunque salvata)
  try {
    await env.EMAIL.send({
      from: MITTENTE,
      to: EMAIL_LUCA,
      replyTo: r.email,
      subject: `Nuova richiesta: ${r.nome}, ${r.check_in} → ${r.check_out}`,
      text: `Nome: ${r.nome}\nEmail: ${r.email}\nTelefono: ${r.telefono || "-"}\n` +
            `Arrivo: ${r.check_in}\nPartenza: ${r.check_out}\nOspiti: ${r.ospiti}\n` +
            `Lingua: ${r.lingua || "it"}\n\nMessaggio:\n${r.messaggio || "-"}\n\n` +
            `Gestisci: https://${HOST_GESTIONE}`,
    });
  } catch (e) {
    console.log("Email non inviata:", e.message);
  }

  return risposta({ ok: true });
}

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
      env.DB.prepare("INSERT OR IGNORE INTO blocchi (dal, al, origine, uid_ical) VALUES (?, ?, 'airbnb', ?)")
        .bind(e.dal, e.al, e.uid || null)
    ),
  ]);
  console.log(`Airbnb: ${eventi.length} periodi occupati`);
}

// Legge gli eventi da un file iCal: servono solo inizio, fine e UID
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
  "Content-Security-Policy": "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'",
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
  if (metodo === "POST" && pathname === "/login/codice") return mandaCodice(env);
  if (metodo === "POST" && pathname === "/login/verifica") return verificaCodice(request, env);
  if (metodo === "POST" && pathname === "/logout") {
    return json({ ok: true }, 200, { "Set-Cookie": "sessione=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0" });
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

async function mandaCodice(env) {
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

  // Il tentativo si conta PRIMA del confronto
  await env.DB.prepare("UPDATE login_codici SET tentativi = tentativi + 1 WHERE id = ?").bind(riga.id).run();

  if (!uguali(await impronta(codice, env), riga.hash)) {
    const restano = TENTATIVI_CODICE - riga.tentativi - 1;
    return json({ errore: restano > 0 ? `Codice sbagliato. Tentativi rimasti: ${restano}.` : "Codice sbagliato: chiedine uno nuovo." }, 400);
  }

  await env.DB.prepare("UPDATE login_codici SET usato = 1 WHERE id = ?").bind(riga.id).run();
  const scadenza = Date.now() + GIORNI_SESSIONE * 86_400_000;
  const token = `${scadenza}.${await firma(String(scadenza), env)}`;
  return json({ ok: true }, 200, {
    "Set-Cookie": `sessione=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${GIORNI_SESSIONE * 86400}`,
  });
}

// Il cookie è "scadenza.firma": chi non conosce SESSION_SECRET non può crearne uno valido
async function sessioneValida(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.split(/;\s*/).find((c) => c.startsWith("sessione="))?.slice(9);
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
    const [stagioni, giorni, blocchi, richieste, impostazioni] = await env.DB.batch([
      env.DB.prepare("SELECT * FROM stagioni ORDER BY dal"),
      env.DB.prepare("SELECT * FROM prezzi_giorno WHERE data >= ? ORDER BY data").bind(oggi),
      env.DB.prepare("SELECT id, dal, al, origine, nota FROM blocchi WHERE al > ? ORDER BY dal").bind(oggi),
      env.DB.prepare("SELECT * FROM richieste ORDER BY id DESC LIMIT 200"),
      env.DB.prepare("SELECT chiave, valore FROM impostazioni"),
    ]);
    return json({
      stagioni: stagioni.results,
      prezzi_giorno: giorni.results,
      blocchi: blocchi.results,
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

  // Prezzi per un singolo giorno (se il giorno c'è già, viene sostituito)
  if (risorsa === "prezzi_giorno" && metodo === "POST") {
    const prezzo = numero(corpo.prezzo_notte_eur, 0);
    const minNotti = numero(corpo.min_notti, 1);
    if (!DATA.test(corpo.data) || Number.isNaN(prezzo) || Number.isNaN(minNotti) || (prezzo === null && minNotti === null)) {
      return errore("Serve una data e almeno un prezzo o un minimo di notti.");
    }
    await env.DB.prepare("INSERT OR REPLACE INTO prezzi_giorno (data, prezzo_notte_eur, min_notti, nota) VALUES (?, ?, ?, ?)")
      .bind(corpo.data, prezzo, minNotti === null ? null : Math.round(minNotti), String(corpo.nota || "").trim() || null).run();
    return json({ ok: true });
  }
  if (risorsa === "prezzi_giorno" && metodo === "DELETE" && DATA.test(id || "")) {
    await env.DB.prepare("DELETE FROM prezzi_giorno WHERE data = ?").bind(id).run();
    return json({ ok: true });
  }

  // Blocchi manuali (quelli di Airbnb li gestisce la sincronizzazione)
  if (risorsa === "blocchi" && metodo === "POST") {
    if (!DATA.test(corpo.dal) || !DATA.test(corpo.al) || corpo.al <= corpo.dal) {
      return errore("Il giorno di partenza deve venire dopo il primo giorno occupato.");
    }
    await env.DB.prepare("INSERT INTO blocchi (dal, al, origine, nota) VALUES (?, ?, 'manuale', ?)")
      .bind(corpo.dal, corpo.al, String(corpo.nota || "").trim() || null).run();
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

  // Impostazioni (per ora solo il massimo ospiti)
  if (risorsa === "impostazioni" && metodo === "POST") {
    const max = numero(corpo.max_ospiti, 1);
    if (!max || Number.isNaN(max) || max > 30) return errore("Massimo ospiti tra 1 e 30.");
    await env.DB.prepare("INSERT OR REPLACE INTO impostazioni (chiave, valore) VALUES ('max_ospiti', ?)")
      .bind(String(Math.round(max))).run();
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
<button class="btn" id="manda">Mandami il codice</button>
<form id="form" hidden>
  <label>Codice ricevuto<input id="codice" inputmode="numeric" autocomplete="one-time-code" maxlength="9" required></label>
  <button class="btn" style="width:100%">Entra</button>
</form>
<p class="msg" id="msg" role="alert"></p>
</div></main>
<script>
const msg = document.getElementById("msg");
const post = (url, body) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) })
  .then(async (r) => ({ ok: r.ok, dati: await r.json().catch(() => ({})) }));
document.getElementById("manda").onclick = async (e) => {
  e.target.disabled = true; msg.textContent = "";
  const r = await post("/login/codice");
  e.target.disabled = false;
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

const PAGINA_GESTIONE = `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Gestione · Hidden Treasure</title>
<style>${STILE}
header{position:sticky;top:0;z-index:5;background:var(--shell);border-bottom:1px solid var(--line)}
.top{max-width:1100px;margin:0 auto;padding:.75rem 1rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
nav{max-width:1100px;margin:0 auto;padding:0 1rem;display:flex;gap:.25rem;overflow-x:auto}
nav button{border:0;background:none;padding:.65rem .9rem;border-bottom:2px solid transparent;color:var(--soft);font-weight:600;white-space:nowrap}
nav button[aria-selected=true]{color:var(--deep);border-color:var(--deep)}
main{max-width:1100px;margin:0 auto;padding:1.25rem 1rem 4rem;display:flex;flex-direction:column;gap:1rem}
section[hidden]{display:none}
section{display:flex;flex-direction:column;gap:1rem}
.form{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.75rem;align-items:end}
.table{width:100%;border-collapse:collapse;font-size:.95rem}
.table th{text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;color:var(--soft);padding:.5rem;border-bottom:1px solid var(--line)}
.table td{padding:.6rem .5rem;border-bottom:1px solid var(--line);vertical-align:top}
.table tr:last-child td{border-bottom:0}
.scroll{overflow-x:auto}
.tag{display:inline-block;padding:.1rem .55rem;border-radius:999px;font-size:.8rem;font-weight:600;background:#EEF3F3;color:var(--sea)}
.tag.airbnb{background:#FBEFEA;color:#B4533C}
.tag.manuale{background:#F3EEE4;color:var(--brass)}
.vuoto{color:var(--soft);text-align:center;padding:1rem}
.richiesta{display:grid;gap:.25rem}
.richiesta strong{color:var(--deep)}
.azioni{display:flex;gap:.25rem;flex-wrap:wrap}
/* Telefono: ogni riga diventa una scheda */
@media (max-width:700px){
  .table thead{display:none}
  .table,.table tbody,.table tr,.table td{display:block;width:100%}
  .table tr{padding:.75rem 0;border-bottom:1px solid var(--line)}
  .table tr:last-child{border-bottom:0}
  .table td{border:0;padding:.2rem 0}
  .card.scroll{padding:.25rem 1rem}
}
#toast{position:fixed;left:50%;bottom:1rem;transform:translateX(-50%);background:var(--deep);color:#fff;padding:.6rem 1rem;border-radius:999px;font-size:.9rem;opacity:0;transition:opacity .2s;pointer-events:none}
#toast.on{opacity:1}
#toast.err{background:var(--red)}
</style></head>
<body>
<header>
  <div class="top"><h1>Gestione</h1><button class="link" id="esci">Esci</button></div>
  <nav role="tablist">
    <button role="tab" data-tab="richieste" aria-selected="true">Richieste</button>
    <button role="tab" data-tab="prezzi">Prezzi</button>
    <button role="tab" data-tab="blocchi">Date bloccate</button>
    <button role="tab" data-tab="impostazioni">Impostazioni</button>
  </nav>
</header>
<main>
  <section id="tab-richieste">
    <div class="card scroll"><table class="table"><thead><tr><th>Ricevuta</th><th>Ospite</th><th>Soggiorno</th><th>Messaggio</th><th>Stato</th></tr></thead><tbody id="richieste"></tbody></table></div>
  </section>

  <section id="tab-prezzi" hidden>
    <div class="card">
      <h2 id="titolo-stagione">Nuova stagione</h2>
      <p class="muted">Prezzo a notte per un periodo. Inizio e fine sono compresi. Le notti minime valgono per chi arriva in quel periodo.</p>
      <form class="form" id="form-stagione">
        <label>Nome<input name="nome" required placeholder="Agosto"></label>
        <label>Dal<input name="dal" type="date" required></label>
        <label>Al (compreso)<input name="al" type="date" required></label>
        <label>€ a notte<input name="prezzo_notte_eur" type="number" min="0" step="1" required></label>
        <label>Notti minime<input name="min_notti" type="number" min="1" step="1" value="1"></label>
        <div class="azioni"><button class="btn">Salva</button><button type="button" class="link" id="annulla-stagione" hidden>Annulla</button></div>
      </form>
    </div>
    <div class="card scroll"><table class="table"><thead><tr><th>Stagione</th><th>Periodo</th><th>€/notte</th><th>Min. notti</th><th></th></tr></thead><tbody id="stagioni"></tbody></table></div>

    <div class="card">
      <h2>Giorni speciali</h2>
      <p class="muted">Un singolo giorno con prezzo o minimo diverso (es. Ferragosto). Vince sulla stagione. Lascia vuoto ciò che non cambia.</p>
      <form class="form" id="form-giorno">
        <label>Giorno<input name="data" type="date" required></label>
        <label>€ a notte<input name="prezzo_notte_eur" type="number" min="0" step="1"></label>
        <label>Notti minime<input name="min_notti" type="number" min="1" step="1"></label>
        <label>Nota<input name="nota" placeholder="Ferragosto"></label>
        <div><button class="btn">Salva</button></div>
      </form>
    </div>
    <div class="card scroll"><table class="table"><thead><tr><th>Giorno</th><th>€/notte</th><th>Min. notti</th><th>Nota</th><th></th></tr></thead><tbody id="giorni"></tbody></table></div>
  </section>

  <section id="tab-blocchi" hidden>
    <div class="card">
      <h2>Blocca delle date</h2>
      <p class="muted">Per amici, lavori o soggiorni tuoi. Le date di Airbnb arrivano da sole ogni ora.</p>
      <form class="form" id="form-blocco">
        <label>Prima notte occupata<input name="dal" type="date" required></label>
        <label>Giorno di partenza<input name="al" type="date" required></label>
        <label>Nota<input name="nota" placeholder="Lavori in giardino"></label>
        <div><button class="btn">Blocca</button></div>
      </form>
    </div>
    <div class="card scroll"><table class="table"><thead><tr><th>Dal</th><th>Al (partenza)</th><th>Origine</th><th>Nota</th><th></th></tr></thead><tbody id="blocchi"></tbody></table></div>
  </section>

  <section id="tab-impostazioni" hidden>
    <div class="card">
      <h2>Impostazioni</h2>
      <form class="form" id="form-impostazioni">
        <label>Massimo ospiti (adulti + bambini)<input name="max_ospiti" type="number" min="1" max="30" required></label>
        <div><button class="btn">Salva</button></div>
      </form>
    </div>
  </section>
</main>
<div id="toast" role="status"></div>
<script>
let dati = null;
let stagioneInModifica = null;

/* Crea un elemento: i testi passano sempre da textContent, mai da innerHTML */
function el(tag, props, ...figli) {
  const e = document.createElement(tag);
  Object.assign(e, props || {});
  figli.flat().forEach((f) => e.append(f instanceof Node ? f : document.createTextNode(f == null ? "" : String(f))));
  return e;
}
const fmt = (iso) => iso ? new Date(iso + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "";
const euro = (n) => n == null ? "—" : n.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
function toast(testo, errore) {
  const t = document.getElementById("toast");
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
const elimina = (testo, fn) => el("button", { className: "link danger", onclick: () => confirm(testo) && fn() }, "Elimina");

async function carica() {
  dati = await chiama("GET", "/api/dati");
  if (!dati) return;
  disegnaRichieste(); disegnaStagioni(); disegnaGiorni(); disegnaBlocchi();
  document.querySelector("#form-impostazioni [name=max_ospiti]").value = dati.impostazioni.max_ospiti || 6;
}

function disegnaRichieste() {
  const tb = document.getElementById("richieste");
  tb.replaceChildren(...(dati.richieste.length ? dati.richieste.map((r) => {
    const stato = el("select", { onchange: async (e) => { if (await chiama("POST", "/api/richieste/" + r.id + "/stato", { stato: e.target.value })) toast("Stato aggiornato"); } },
      ["nuova", "confermata", "rifiutata"].map((s) => el("option", { value: s, selected: s === (r.stato || "nuova") }, s)));
    const ospite = el("div", { className: "richiesta" },
      el("strong", null, r.nome),
      el("a", { href: "mailto:" + r.email }, r.email),
      r.telefono ? el("a", { href: "tel:" + r.telefono }, r.telefono) : "");
    const notti = Math.round((new Date(r.check_out) - new Date(r.check_in)) / 864e5);
    return riga((r.creato_il || "").slice(0, 16), ospite,
      el("div", { className: "richiesta" }, fmt(r.check_in) + " → " + fmt(r.check_out), el("span", { className: "muted" }, notti + " notti · " + r.ospiti + " ospiti · " + (r.lingua || "").toUpperCase())),
      el("span", { className: "muted", style: "white-space:pre-line" }, r.messaggio || ""), stato);
  }) : [vuoto(5, "Nessuna richiesta per ora.")]));
}

function disegnaStagioni() {
  const tb = document.getElementById("stagioni");
  tb.replaceChildren(...(dati.stagioni.length ? dati.stagioni.map((s) => riga(
    s.nome, fmt(s.dal) + " → " + fmt(s.al), euro(s.prezzo_notte_eur), s.min_notti,
    el("div", { className: "azioni" },
      el("button", { className: "link", onclick: () => modificaStagione(s) }, "Modifica"),
      elimina("Eliminare la stagione " + s.nome + "?", async () => { if (await chiama("DELETE", "/api/stagioni/" + s.id)) { toast("Stagione eliminata"); carica(); } }))
  )) : [vuoto(5, "Nessuna stagione: senza prezzo il sito non mostra il totale.")]));
}

function modificaStagione(s) {
  stagioneInModifica = s.id;
  const f = document.getElementById("form-stagione");
  ["nome", "dal", "al", "prezzo_notte_eur", "min_notti"].forEach((k) => (f.elements[k].value = s[k]));
  document.getElementById("titolo-stagione").textContent = "Modifica: " + s.nome;
  document.getElementById("annulla-stagione").hidden = false;
  f.scrollIntoView({ behavior: "smooth", block: "center" });
}
function fineModifica() {
  stagioneInModifica = null;
  document.getElementById("form-stagione").reset();
  document.getElementById("titolo-stagione").textContent = "Nuova stagione";
  document.getElementById("annulla-stagione").hidden = true;
}
document.getElementById("annulla-stagione").onclick = fineModifica;

function disegnaGiorni() {
  const tb = document.getElementById("giorni");
  tb.replaceChildren(...(dati.prezzi_giorno.length ? dati.prezzi_giorno.map((g) => riga(
    fmt(g.data), euro(g.prezzo_notte_eur), g.min_notti ?? "—", g.nota || "",
    elimina("Eliminare il prezzo del " + fmt(g.data) + "?", async () => { if (await chiama("DELETE", "/api/prezzi_giorno/" + g.data)) { toast("Giorno eliminato"); carica(); } })
  )) : [vuoto(5, "Nessun giorno speciale.")]));
}

function disegnaBlocchi() {
  const tb = document.getElementById("blocchi");
  tb.replaceChildren(...(dati.blocchi.length ? dati.blocchi.map((b) => riga(
    fmt(b.dal), fmt(b.al), el("span", { className: "tag " + b.origine }, b.origine), b.nota || "",
    b.origine === "manuale"
      ? elimina("Sbloccare queste date?", async () => { if (await chiama("DELETE", "/api/blocchi/" + b.id)) { toast("Date sbloccate"); carica(); } })
      : el("span", { className: "muted" }, "da Airbnb")
  )) : [vuoto(5, "Nessuna data bloccata.")]));
}

/* Moduli */
function invio(id, fn) {
  const f = document.getElementById(id);
  f.onsubmit = async (e) => {
    e.preventDefault();
    const b = f.querySelector("button.btn"); b.disabled = true;
    try { await fn(datiForm(f), f); } finally { b.disabled = false; }
  };
}
invio("form-stagione", async (d) => {
  const url = "/api/stagioni" + (stagioneInModifica ? "/" + stagioneInModifica : "");
  if (await chiama("POST", url, d)) { toast("Stagione salvata"); fineModifica(); carica(); }
});
invio("form-giorno", async (d, f) => { if (await chiama("POST", "/api/prezzi_giorno", d)) { toast("Giorno salvato"); f.reset(); carica(); } });
invio("form-blocco", async (d, f) => { if (await chiama("POST", "/api/blocchi", d)) { toast("Date bloccate"); f.reset(); carica(); } });
invio("form-impostazioni", async (d) => { if (await chiama("POST", "/api/impostazioni", d)) { toast("Impostazioni salvate"); carica(); } });

/* Schede */
document.querySelectorAll("nav button").forEach((b) => (b.onclick = () => {
  document.querySelectorAll("nav button").forEach((x) => x.setAttribute("aria-selected", x === b));
  document.querySelectorAll("main section").forEach((s) => (s.hidden = s.id !== "tab-" + b.dataset.tab));
}));
document.getElementById("esci").onclick = async () => { await chiama("POST", "/logout"); location.reload(); };

carica();
</script></body></html>`;
