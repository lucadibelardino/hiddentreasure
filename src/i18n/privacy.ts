/**
 * Testo della privacy e cookie policy, in ogni lingua.
 * Nei paragrafi, [testo](indirizzo) diventa un link. I dati variabili (titolare,
 * email, mesi di conservazione) stanno in src/data/privacy.ts.
 */
import { PRIVACY as P } from '../data/privacy';
import type { Lang } from './langs';

export type Block = string | { list: string[] };
export interface Section {
    h: string;
    body: Block[];
}
export interface PrivacyText {
    eyebrow: string;
    title: string;
    updated: string;
    intro: string;
    sections: Section[];
}

const mail = `[${P.email}](mailto:${P.email})`;

const it: PrivacyText = {
    eyebrow: 'Privacy e cookie',
    title: 'Come trattiamo i tuoi dati',
    updated: 'Ultimo aggiornamento:',
    intro:
        'Questa pagina spiega quali dati personali raccoglie il sito hiddentreasurevillasimius.com, perché, per quanto tempo li teniamo e quali sono i tuoi diritti, secondo il Regolamento europeo 2016/679 (GDPR).',
    sections: [
        {
            h: 'Chi è il titolare',
            body: [
                `Il titolare del trattamento è ${P.controller}. Per qualsiasi domanda sui tuoi dati scrivi a ${mail}.`,
            ],
        },
        {
            h: 'Richieste di disponibilità',
            body: [
                'Quando ci mandi una richiesta dal modulo del sito raccogliamo:',
                {
                    list: [
                        'nome, email e, se lo indichi, telefono;',
                        'date di arrivo e partenza, numero di ospiti e il tuo messaggio;',
                        'la lingua in cui hai usato il sito.',
                    ],
                },
                'Li usiamo solo per risponderti e prepararti un preventivo. La base giuridica è la richiesta che ci fai prima di un eventuale contratto di locazione (art. 6.1.b GDPR). Nome ed email servono per poterti rispondere: senza, la richiesta non può partire.',
                `Le richieste vengono cancellate in automatico ${P.requestMonths} mesi dopo la data di partenza indicata. L'email di notifica che riceviamo e la corrispondenza con te le conserviamo al massimo ${P.emailMonths} mesi. Se il soggiorno si conclude, i dati necessari al contratto e agli obblighi di legge (fiscali e di pubblica sicurezza) sono conservati per il tempo previsto dalla legge.`,
            ],
        },
        {
            h: 'Se ci contatti in altro modo',
            body: [
                "Se ci scrivi su WhatsApp, per email o ci chiami, usiamo i dati che ci dai solo per risponderti. WhatsApp è un servizio di Meta, che tratta i dati secondo la propria informativa. Se prenoti tramite Airbnb, i dati della prenotazione sono gestiti anche da Airbnb secondo la sua informativa.",
            ],
        },
        {
            h: 'Navigazione sul sito',
            body: [
                "Come ogni sito, per mostrarti le pagine i server ricevono il tuo indirizzo IP e i dati tecnici del browser. Li trattiamo per legittimo interesse (art. 6.1.f GDPR), cioè per far funzionare il sito e proteggerlo da abusi. Non ti profiliamo.",
                'I caratteri tipografici sono serviti dal nostro sito, non da servizi esterni.',
                'Per sapere quante persone visitano il sito e da dove arrivano usiamo Cloudflare Web Analytics. Non usa cookie, non salva nulla sul tuo dispositivo e non ti segue su altri siti: ci mostra solo numeri complessivi (visite, pagine, Paese, sito di provenienza). Lo facciamo per legittimo interesse, per migliorare il sito.',
                "La mappa in fondo alla home carica le immagini satellitari dai server di Esri quando la mappa diventa visibile. Esri riceve così il tuo indirizzo IP, ma non salva cookie. Lo facciamo per legittimo interesse, per mostrarti dove si trova la villa.",
            ],
        },
        {
            h: 'Chi ci aiuta a trattare i dati',
            body: [
                'Usiamo alcuni fornitori che trattano i dati per nostro conto, solo per gli scopi descritti qui:',
                {
                    list: [
                        'GitHub (GitHub Inc.): ospita il sito;',
                        'Cloudflare (Cloudflare Inc.): riceve e conserva le richieste del modulo, invia le email di notifica, gestisce il dominio e le statistiche anonime delle visite;',
                        'Google (Gmail): la casella dove riceviamo le notifiche e le tue email;',
                        'Esri: immagini satellitari della mappa.',
                    ],
                },
                "Alcuni di questi fornitori hanno sede negli Stati Uniti. Il trasferimento avviene sulla base del Data Privacy Framework UE-USA o delle clausole contrattuali standard approvate dalla Commissione europea. Non vendiamo né cediamo i tuoi dati a nessuno.",
            ],
        },
        {
            h: 'Cookie',
            body: [
                'Il sito non usa cookie: né di profilazione, né di statistica, né di terze parti. Per questo non vedi nessun banner.',
                "Usiamo solo una memoria tecnica del browser (sessionStorage) per ricordare che hai già visto l'avviso sulle altre lingue, così non te lo mostriamo a ogni pagina. Si cancella da sola quando chiudi la scheda.",
            ],
        },
        {
            h: 'I tuoi diritti',
            body: [
                `Puoi chiederci in ogni momento di accedere ai tuoi dati, correggerli, cancellarli, limitarne l'uso, riceverli in un formato leggibile o opporti al loro trattamento (art. 15-21 GDPR). Basta scrivere a ${mail}: ti rispondiamo entro un mese.`,
                'Se ritieni che i tuoi dati siano trattati in modo non corretto puoi presentare reclamo al [Garante per la protezione dei dati personali](https://www.garanteprivacy.it) o all’autorità del Paese in cui vivi.',
                'Non prendiamo decisioni automatizzate sulla base dei tuoi dati.',
            ],
        },
        {
            h: 'Modifiche',
            body: ['Se cambiamo il modo in cui trattiamo i dati aggiorniamo questa pagina e la data qui sopra.'],
        },
    ],
};

const en: PrivacyText = {
    eyebrow: 'Privacy and cookies',
    title: 'How we handle your data',
    updated: 'Last updated:',
    intro:
        'This page explains what personal data the website hiddentreasurevillasimius.com collects, why, how long we keep it and what your rights are, under the EU General Data Protection Regulation 2016/679 (GDPR).',
    sections: [
        {
            h: 'Who is responsible',
            body: [
                `The data controller is ${P.controller}. For any question about your data, write to ${mail}.`,
            ],
        },
        {
            h: 'Availability requests',
            body: [
                'When you send us a request through the form on the website we collect:',
                {
                    list: [
                        'your name, email and, if you give it, phone number;',
                        'arrival and departure dates, number of guests and your message;',
                        'the language you used the website in.',
                    ],
                },
                'We use them only to reply to you and prepare a quote. The legal basis is the request you make before a possible rental contract (Art. 6(1)(b) GDPR). We need your name and email to be able to reply: without them the request cannot be sent.',
                `Requests are deleted automatically ${P.requestMonths} months after the requested departure date. We keep the notification email we receive and our correspondence with you for no more than ${P.emailMonths} months. If you go on to stay with us, the data needed for the contract and for legal obligations (tax and police registration) is kept for as long as the law requires.`,
            ],
        },
        {
            h: 'If you contact us another way',
            body: [
                'If you write to us on WhatsApp, by email or call us, we use the details you give us only to reply to you. WhatsApp is a Meta service that processes data under its own privacy policy. If you book through Airbnb, the booking data is also handled by Airbnb under its own privacy policy.',
            ],
        },
        {
            h: 'Browsing the website',
            body: [
                'Like any website, to show you the pages the servers receive your IP address and technical data about your browser. We process them on the basis of legitimate interest (Art. 6(1)(f) GDPR), that is to run the website and protect it from abuse. We do not profile you.',
                'The fonts are served from our own website, not from external services.',
                'To know how many people visit the website and where they come from we use Cloudflare Web Analytics. It uses no cookies, stores nothing on your device and does not track you across other websites: it only shows us aggregate figures (visits, pages, country, referring website). We do this on the basis of legitimate interest, to improve the website.',
                'The map at the bottom of the home page loads satellite images from Esri servers when it comes into view. Esri therefore receives your IP address, but sets no cookies. We do this on the basis of legitimate interest, to show you where the villa is.',
            ],
        },
        {
            h: 'Who helps us process the data',
            body: [
                'We use a few providers that process data on our behalf, only for the purposes described here:',
                {
                    list: [
                        'GitHub (GitHub Inc.): hosts the website;',
                        'Cloudflare (Cloudflare Inc.): receives and stores form requests, sends notification emails, manages the domain and the anonymous visit statistics;',
                        'Google (Gmail): the mailbox where we receive notifications and your emails;',
                        'Esri: satellite images for the map.',
                    ],
                },
                'Some of these providers are based in the United States. Transfers rely on the EU-US Data Privacy Framework or on the standard contractual clauses approved by the European Commission. We never sell or pass on your data to anyone.',
            ],
        },
        {
            h: 'Cookies',
            body: [
                'The website uses no profiling, statistics or third-party cookies, which is why you see no cookie banner.',
                'We only use a technical browser storage (sessionStorage) to remember that you have already seen the notice about other languages, so it does not appear on every page. It is cleared automatically when you close the tab.',
            ],
        },
        {
            h: 'Your rights',
            body: [
                `You can ask us at any time to access, correct or delete your data, restrict its use, receive it in a readable format or object to its processing (Art. 15-21 GDPR). Just write to ${mail}: we reply within one month.`,
                'If you believe your data is not being handled correctly, you can lodge a complaint with the Italian data protection authority, the [Garante per la protezione dei dati personali](https://www.garanteprivacy.it), or with the authority of the country where you live.',
                'We do not make automated decisions based on your data.',
            ],
        },
        {
            h: 'Changes',
            body: ['If we change how we handle data we will update this page and the date above.'],
        },
    ],
};

const de: PrivacyText = {
    eyebrow: 'Datenschutz und Cookies',
    title: 'Wie wir mit Ihren Daten umgehen',
    updated: 'Zuletzt aktualisiert:',
    intro:
        'Diese Seite erklärt, welche personenbezogenen Daten die Website hiddentreasurevillasimius.com erhebt, warum, wie lange wir sie aufbewahren und welche Rechte Sie nach der Datenschutz-Grundverordnung (EU) 2016/679 (DSGVO) haben.',
    sections: [
        {
            h: 'Verantwortlicher',
            body: [
                `Verantwortlich für die Datenverarbeitung ist ${P.controller}. Bei Fragen zu Ihren Daten schreiben Sie an ${mail}.`,
            ],
        },
        {
            h: 'Verfügbarkeitsanfragen',
            body: [
                'Wenn Sie uns über das Formular auf der Website eine Anfrage senden, erheben wir:',
                {
                    list: [
                        'Name, E-Mail-Adresse und, falls angegeben, Telefonnummer;',
                        'An- und Abreisedatum, Anzahl der Gäste und Ihre Nachricht;',
                        'die Sprache, in der Sie die Website genutzt haben.',
                    ],
                },
                'Wir verwenden diese Daten ausschließlich, um Ihnen zu antworten und ein Angebot zu erstellen. Rechtsgrundlage ist Ihre Anfrage vor einem möglichen Mietvertrag (Art. 6 Abs. 1 lit. b DSGVO). Name und E-Mail-Adresse brauchen wir, um antworten zu können: ohne sie kann die Anfrage nicht gesendet werden.',
                `Anfragen werden ${P.requestMonths} Monate nach dem angefragten Abreisedatum automatisch gelöscht. Die Benachrichtigungs-E-Mail, die wir erhalten, und unsere Korrespondenz mit Ihnen bewahren wir höchstens ${P.emailMonths} Monate auf. Kommt ein Aufenthalt zustande, bewahren wir die für den Vertrag und die gesetzlichen Pflichten (Steuern und polizeiliche Gästemeldung) nötigen Daten so lange auf, wie das Gesetz es vorschreibt.`,
            ],
        },
        {
            h: 'Wenn Sie uns anders kontaktieren',
            body: [
                'Wenn Sie uns per WhatsApp oder E-Mail schreiben oder anrufen, verwenden wir Ihre Angaben nur, um Ihnen zu antworten. WhatsApp ist ein Dienst von Meta, der Daten nach seiner eigenen Datenschutzerklärung verarbeitet. Wenn Sie über Airbnb buchen, werden die Buchungsdaten auch von Airbnb nach dessen Datenschutzerklärung verarbeitet.',
            ],
        },
        {
            h: 'Besuch der Website',
            body: [
                'Wie bei jeder Website erhalten die Server Ihre IP-Adresse und technische Angaben zu Ihrem Browser, um Ihnen die Seiten anzuzeigen. Wir verarbeiten sie auf Grundlage unseres berechtigten Interesses (Art. 6 Abs. 1 lit. f DSGVO), um die Website zu betreiben und vor Missbrauch zu schützen. Wir erstellen keine Profile.',
                'Die Schriftarten werden von unserer eigenen Website geladen, nicht von externen Diensten.',
                'Um zu wissen, wie viele Menschen die Website besuchen und woher sie kommen, nutzen wir Cloudflare Web Analytics. Der Dienst verwendet keine Cookies, speichert nichts auf Ihrem Gerät und verfolgt Sie nicht über andere Websites: Er zeigt uns nur Gesamtzahlen (Besuche, Seiten, Land, verweisende Website). Das geschieht auf Grundlage unseres berechtigten Interesses, die Website zu verbessern.',
                'Die Karte unten auf der Startseite lädt Satellitenbilder von Servern der Firma Esri, sobald sie sichtbar wird. Esri erhält dabei Ihre IP-Adresse, setzt aber keine Cookies. Das geschieht auf Grundlage unseres berechtigten Interesses, Ihnen die Lage der Villa zu zeigen.',
            ],
        },
        {
            h: 'Wer uns bei der Verarbeitung hilft',
            body: [
                'Wir nutzen einige Dienstleister, die Daten in unserem Auftrag und nur für die hier beschriebenen Zwecke verarbeiten:',
                {
                    list: [
                        'GitHub (GitHub Inc.): Hosting der Website;',
                        'Cloudflare (Cloudflare Inc.): Empfang und Speicherung der Formularanfragen, Versand der Benachrichtigungs-E-Mails, Verwaltung der Domain und anonyme Besucherstatistik;',
                        'Google (Gmail): das Postfach, in dem wir Benachrichtigungen und Ihre E-Mails erhalten;',
                        'Esri: Satellitenbilder der Karte.',
                    ],
                },
                'Einige dieser Dienstleister haben ihren Sitz in den USA. Die Übermittlung erfolgt auf Grundlage des EU-US Data Privacy Framework oder der von der Europäischen Kommission genehmigten Standardvertragsklauseln. Wir verkaufen Ihre Daten nicht und geben sie an niemanden weiter.',
            ],
        },
        {
            h: 'Cookies',
            body: [
                'Die Website verwendet keine Cookies zu Profiling-, Statistik- oder Drittanbieterzwecken. Deshalb sehen Sie kein Cookie-Banner.',
                'Wir nutzen nur einen technischen Speicher des Browsers (sessionStorage), um uns zu merken, dass Sie den Hinweis auf die anderen Sprachen schon gesehen haben, damit er nicht auf jeder Seite erscheint. Er wird automatisch gelöscht, wenn Sie den Tab schließen.',
            ],
        },
        {
            h: 'Ihre Rechte',
            body: [
                `Sie können jederzeit Auskunft über Ihre Daten verlangen, sie berichtigen oder löschen lassen, ihre Verarbeitung einschränken, sie in einem lesbaren Format erhalten oder der Verarbeitung widersprechen (Art. 15-21 DSGVO). Schreiben Sie einfach an ${mail}: Wir antworten innerhalb eines Monats.`,
                'Wenn Sie meinen, dass Ihre Daten nicht korrekt verarbeitet werden, können Sie sich bei der italienischen Datenschutzbehörde, dem [Garante per la protezione dei dati personali](https://www.garanteprivacy.it), oder bei der Behörde Ihres Wohnsitzlandes beschweren.',
                'Wir treffen keine automatisierten Entscheidungen auf Grundlage Ihrer Daten.',
            ],
        },
        {
            h: 'Änderungen',
            body: ['Wenn wir den Umgang mit Daten ändern, aktualisieren wir diese Seite und das Datum oben.'],
        },
    ],
};

const fr: PrivacyText = {
    eyebrow: 'Confidentialité et cookies',
    title: 'Comment nous traitons vos données',
    updated: 'Dernière mise à jour :',
    intro:
        'Cette page explique quelles données personnelles le site hiddentreasurevillasimius.com collecte, pourquoi, combien de temps nous les conservons et quels sont vos droits, conformément au Règlement européen 2016/679 (RGPD).',
    sections: [
        {
            h: 'Responsable du traitement',
            body: [
                `Le responsable du traitement est ${P.controller}. Pour toute question sur vos données, écrivez à ${mail}.`,
            ],
        },
        {
            h: 'Demandes de disponibilité',
            body: [
                'Lorsque vous nous envoyez une demande par le formulaire du site, nous collectons :',
                {
                    list: [
                        'votre nom, votre e-mail et, si vous l’indiquez, votre téléphone ;',
                        'les dates d’arrivée et de départ, le nombre de voyageurs et votre message ;',
                        'la langue dans laquelle vous avez utilisé le site.',
                    ],
                },
                'Nous les utilisons uniquement pour vous répondre et vous préparer un devis. La base juridique est la demande que vous faites avant un éventuel contrat de location (art. 6.1.b RGPD). Le nom et l’e-mail sont nécessaires pour vous répondre : sans eux, la demande ne peut pas être envoyée.',
                `Les demandes sont supprimées automatiquement ${P.requestMonths} mois après la date de départ demandée. Nous conservons l’e-mail de notification que nous recevons et nos échanges avec vous pendant ${P.emailMonths} mois au maximum. Si le séjour a lieu, les données nécessaires au contrat et aux obligations légales (fiscales et déclaration des voyageurs à la police) sont conservées pendant la durée prévue par la loi.`,
            ],
        },
        {
            h: 'Si vous nous contactez autrement',
            body: [
                'Si vous nous écrivez sur WhatsApp, par e-mail ou nous appelez, nous utilisons vos coordonnées uniquement pour vous répondre. WhatsApp est un service de Meta, qui traite les données selon sa propre politique de confidentialité. Si vous réservez via Airbnb, les données de la réservation sont aussi traitées par Airbnb selon sa politique.',
            ],
        },
        {
            h: 'Navigation sur le site',
            body: [
                'Comme pour tout site, pour vous afficher les pages les serveurs reçoivent votre adresse IP et des données techniques sur votre navigateur. Nous les traitons sur la base de notre intérêt légitime (art. 6.1.f RGPD), pour faire fonctionner le site et le protéger des abus. Nous ne vous profilons pas.',
                'Les polices de caractères sont servies par notre propre site, pas par des services externes.',
                'Pour savoir combien de personnes visitent le site et d’où elles viennent, nous utilisons Cloudflare Web Analytics. Il n’utilise aucun cookie, n’enregistre rien sur votre appareil et ne vous suit pas sur d’autres sites : il nous montre seulement des chiffres globaux (visites, pages, pays, site d’origine). Nous le faisons sur la base de notre intérêt légitime, pour améliorer le site.',
                'La carte en bas de la page d’accueil charge des images satellite depuis les serveurs d’Esri lorsqu’elle devient visible. Esri reçoit ainsi votre adresse IP, mais ne dépose aucun cookie. Nous le faisons sur la base de notre intérêt légitime, pour vous montrer où se trouve la villa.',
            ],
        },
        {
            h: 'Qui nous aide à traiter les données',
            body: [
                'Nous faisons appel à quelques prestataires qui traitent les données pour notre compte, uniquement pour les finalités décrites ici :',
                {
                    list: [
                        'GitHub (GitHub Inc.) : héberge le site ;',
                        'Cloudflare (Cloudflare Inc.) : reçoit et conserve les demandes du formulaire, envoie les e-mails de notification, gère le domaine et les statistiques anonymes de visite ;',
                        'Google (Gmail) : la boîte où nous recevons les notifications et vos e-mails ;',
                        'Esri : images satellite de la carte.',
                    ],
                },
                'Certains de ces prestataires sont établis aux États-Unis. Le transfert repose sur le Data Privacy Framework UE-États-Unis ou sur les clauses contractuelles types approuvées par la Commission européenne. Nous ne vendons ni ne cédons vos données à personne.',
            ],
        },
        {
            h: 'Cookies',
            body: [
                'Le site n’utilise aucun cookie de profilage, de statistiques ou de tiers : c’est pourquoi vous ne voyez aucun bandeau cookies.',
                'Nous utilisons seulement un stockage technique du navigateur (sessionStorage) pour retenir que vous avez déjà vu l’avis sur les autres langues, afin qu’il ne s’affiche pas sur chaque page. Il s’efface tout seul quand vous fermez l’onglet.',
            ],
        },
        {
            h: 'Vos droits',
            body: [
                `Vous pouvez à tout moment nous demander d’accéder à vos données, de les rectifier, de les effacer, d’en limiter l’usage, de les recevoir dans un format lisible ou de vous opposer à leur traitement (art. 15 à 21 RGPD). Il suffit d’écrire à ${mail} : nous répondons sous un mois.`,
                'Si vous estimez que vos données ne sont pas traitées correctement, vous pouvez introduire une réclamation auprès de l’autorité italienne, le [Garante per la protezione dei dati personali](https://www.garanteprivacy.it), ou de l’autorité du pays où vous vivez (en France, la CNIL).',
                'Nous ne prenons aucune décision automatisée à partir de vos données.',
            ],
        },
        {
            h: 'Modifications',
            body: ['Si nous changeons notre façon de traiter les données, nous mettons à jour cette page et la date ci-dessus.'],
        },
    ],
};

export const PRIVACY_TEXT: Record<Lang, PrivacyText> = { it, en, de, fr };
