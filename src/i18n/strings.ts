/**
 * Tutti i testi dell'interfaccia, in ogni lingua.
 * L'italiano e' la lingua di riferimento: le altre devono avere le stesse chiavi
 * (TypeScript segnala quelle mancanti).
 */
import type { Lang } from './langs';

const it = {
    meta: {
        home: {
            title: 'Hidden Treasure | Villa sul Mare a Villasimius, Sardegna',
            description:
                'Villa in affitto a Villasimius con il giardino che finisce sulla spiaggia. Terrazza con vista a 270°, spiaggia semiprivata, 4-6 posti letto. Prenota diretto e risparmia.',
        },
        gallery: {
            title: 'Foto della villa | Hidden Treasure Villasimius',
            description:
                'Le fotografie della villa Hidden Treasure a Villasimius: terrazza panoramica, giardino sulla spiaggia, interni, camere e il mare del sud Sardegna.',
        },
        reviews: {
            title: 'Recensioni degli ospiti | Hidden Treasure Villasimius',
            description:
                'Cosa dicono gli ospiti della villa Hidden Treasure a Villasimius: 4,91 su Airbnb e 5,0 su Google. Leggi le recensioni vere di chi ci ha soggiornato.',
        },
        contact: {
            title: 'Contatti e prenotazioni | Hidden Treasure Villasimius',
            description:
                'Prenota direttamente la villa Hidden Treasure a Villasimius: scrivici su WhatsApp, chiamaci o mandaci una email. Ti rispondiamo noi, senza intermediari.',
        },
        privacy: {
            title: 'Privacy e cookie | Hidden Treasure Villasimius',
            description:
                'Come il sito della villa Hidden Treasure a Villasimius tratta i dati personali: richieste di disponibilità, conservazione, fornitori, cookie e i tuoi diritti.',
        },
        notFound: {
            title: 'Pagina non trovata | Hidden Treasure Villasimius',
            description: 'Questa pagina non esiste. Torna alla home della villa Hidden Treasure a Villasimius.',
        },
        ogImageAlt: 'La villa Hidden Treasure affacciata sul mare di Villasimius',
    },

    common: {
        skipLink: 'Vai al contenuto',
        place: 'Villasimius · Sardegna',
    },

    header: {
        homeAria: 'Hidden Treasure — vai alla home',
        navAria: 'Principale',
        navMobileAria: 'Principale mobile',
        home: 'Home',
        villa: 'La Villa',
        gallery: 'Galleria',
        reviews: 'Recensioni',
        contact: 'Contatti',
        book: 'Prenota',
        bookStay: 'Prenota il soggiorno',
        openMenu: 'Apri il menu',
        closeMenu: 'Chiudi il menu',
        language: 'Lingua',
        chooseLanguage: 'Scegli la lingua',
    },

    hero: {
        sectionAria: 'Presentazione della villa',
        imageAlts: [
            'La villa Hidden Treasure vista dal giardino sul mare',
            'La spiaggia semiprivata davanti alla villa',
            'Tramonto sul mare visto dalla terrazza',
            'Scorcio della costa di Villasimius',
            'Il prato della villa che si apre sulla spiaggia',
        ],
        eyebrow: 'Hidden Treasure · Villasimius',
        title: 'Il giardino finisce',
        titleAccent: 'dove inizia la spiaggia',
        lead: 'Una villa da quattro a sei posti sulla costa sud della Sardegna. Terrazza con vista a 270 gradi, spiaggia semiprivata a fine prato.',
        seeVilla: 'Guarda la villa',
        indicatorsAria: 'Fotografie della villa',
        scrollAria: 'Scorri alla presentazione della villa',
    },


    features: {
        items: [
            {
                label: 'Spiaggia',
                title: 'Il mare in giardino',
                description:
                    'Per arrivare al mare basta un passo: alla fine del prato inizia la sabbia, così vicina che si sentono le onde rompere.',
            },
            {
                label: 'Vista',
                title: 'Terrazza panoramica',
                description:
                    'Una vista di 270 gradi sul mare. Il belvedere privato dove finiscono tutte le giornate, con il sole che cala dietro la costa.',
            },
            {
                label: 'Accesso',
                title: 'Spiaggia semiprivata',
                description:
                    'La spiaggia a fine prato è semiprivata: niente file di ombrelloni, niente corsa per un posto la mattina presto.',
            },
            {
                label: 'Interni',
                title: 'Da quattro a sei posti letto',
                description:
                    'Una camera matrimoniale e una junior per quattro persone, più il divano letto in soggiorno per arrivare a sei. Due bagni completi e cucina attrezzata.',
            },
            {
                label: 'Esterni',
                title: 'Giardino e due patii',
                description:
                    "Un giardino curato e due patii luminosi: uno per la colazione al sole, l'altro all'ombra per il pomeriggio.",
            },
        ],
        stats: [
            { value: '0', unit: 'passi', label: 'dal mare' },
            { value: '270', unit: 'gradi', label: 'di vista dalla terrazza' },
            { value: '4–6', unit: 'posti', label: 'letto' },
        ],
        imageAlt: 'Il tramonto visto dalla terrazza panoramica della villa',
        caption: 'La terrazza, al tramonto',
        eyebrow: 'La villa',
        title: 'Un posto che si spiega',
        titleAccent: ' in tre numeri',
        askDates: 'Chiedi le date',
        allPhotos: 'Vedi tutte le foto',
    },

    highlight: {
        fallbackTitle: 'Dicono di noi',
        awardSource: 'Riconoscimento Airbnb',
        scoreRest: (count: number) => `su ${count} recensioni Airbnb`,
        readAll: 'Leggi tutte',
    },

    map: {
        title: 'Dove',
        titleAccent: 'sarete',
        aria: 'Mappa con la posizione della villa a Villasimius',
        attribution: 'Immagini',
        openInMaps: 'Apri in Google Maps',
    },

    gallery: {
        count: (n: number) => `${n} fotografie`,
        title: 'La villa, ',
        titleAccent: 'senza filtri',
        subtitle:
            'Le stanze, il giardino, la spiaggia a fine prato e i tramonti dalla terrazza. Tocca una foto per vederla intera.',
        open: (i: number, n: number) => `Apri la fotografia ${i} di ${n}`,
        alt: (i: number) => `Hidden Treasure Villasimius, fotografia ${i}`,
        photo: (i: number, n: number) => `Fotografia ${i} di ${n}`,
        ctaText: 'Ti è piaciuto quello che hai visto?',
        ctaBtn: 'Chiedi disponibilità e prezzi',
        close: 'Chiudi',
        prev: 'Fotografia precedente',
        next: 'Fotografia successiva',
    },

    contact: {
        prefilled: 'Salve, vorrei informazioni su Hidden Treasure per il periodo ____, siamo in ____ persone.',
        number: (i: number) => `Numero ${i}`,
        facts: [
            { value: '7 notti', label: 'Soggiorno minimo in alta stagione' },
            { value: 'IT / EN', label: 'Si parla italiano e inglese' },
            { value: 'Diretta', label: 'Nessuna commissione di piattaforma' },
        ],
        eyebrow: 'Contatti',
        title: 'Rispondiamo ',
        titleAccent: 'noi',
        titleEnd: ', non un portale',
        subtitle:
            'Dicci il periodo e quante persone siete: ti diciamo se la villa è libera e quanto costa il soggiorno, senza commissioni di intermediazione.',
        waEyebrow: 'Il modo più rapido',
        waTitle: 'Scrivici su WhatsApp',
        preferTalk: 'Preferisci parlare?',
        call: 'Chiama',
        email: 'Email',
        writeEmail: 'Scrivi una mail',
        airbnbValue: 'Recensioni e annuncio',
        openAirbnb: 'Apri su Airbnb',
        factsAria: 'Informazioni pratiche',
        seeMap: 'Vedi sulla mappa',
    },

    reviews: {
        eyebrow: 'Recensioni',
        title: 'Cosa dicono ',
        titleAccent: 'gli ospiti',
        subtitle:
            'Le parole di chi ha già passato qui le sue vacanze, riportate dalle nostre pagine su Airbnb e Google.',
        summaryAria: 'Valutazione media',
        average: (n: number) => `Media su ${n} recensioni`,
        sourceCount: (n: number) => `${n} recensioni`,
        readAll: 'Leggi tutte',
        all: 'Tutte',
        bySourceAria: 'Filtra per piattaforma',
        byTopicAria: 'Filtra per argomento',
        byTopic: 'Cerca per argomento',
        resultCount: (n: number) => `${n} ${n === 1 ? 'recensione' : 'recensioni'}`,
        about: 'che parlano di',
        showAll: 'Mostra tutte',
        readMore: 'Continua a leggere',
        readLess: 'Mostra meno',
        translatedFrom: (language: string) => `Tradotta dall'${language}`,
        translatedNote: '',
        hostReply: "Risposta dell'host",
        seeOn: (source: string) => `Vedi questa recensione su ${source}`,
        verifyOn: (source: string) => `Verifica su ${source}`,
        ctaTitle: 'Vuoi essere il prossimo a scriverne una?',
        ctaReview: 'Recensisci',
        ctaBook: 'Prenota',
        stars: (v: string) => `${v} stelle su 5`,
        categories: {} as Record<string, string>,
        badge: {} as Record<string, string>,
    },

    footer: {
        claim: 'Il giardino finisce dove inizia la spiaggia.',
        place: 'Villasimius, Sardegna.',
        pages: 'Pagine',
        writeUs: 'Scrivici',
        whereWeAre: 'Dove siamo',
        freeDates: 'Date libere?',
        askAvailability: 'Chiedi disponibilità',
        privacy: 'Privacy e cookie',
    },

    request: {
        eyebrow: 'Richiesta diretta',
        title: 'Le tue date, ',
        titleAccent: 'senza intermediari',
        subtitle: 'Scegli il periodo e lasciaci un recapito: ti rispondiamo noi, di solito entro un giorno. Nessun pagamento adesso.',
        datesLabel: 'Date del soggiorno',
        checkIn: 'Arrivo',
        checkOut: 'Partenza',
        pickDates: 'Scegli le date',
        pickCheckOut: 'Ora scegli la partenza',
        nights: (n: number) => (n === 1 ? '1 notte' : `${n} notti`),
        clearDates: 'Cambia date',
        loading: 'Carico le date libere…',
        guests: 'Ospiti',
        guestsHint: 'Bambini compresi',
        fewer: 'Un ospite in meno',
        more: 'Un ospite in più',
        name: 'Nome e cognome',
        email: 'Email',
        phone: 'Telefono',
        optional: 'facoltativo',
        phoneHint: 'Se preferisci essere ricontattato su WhatsApp',
        message: 'Messaggio',
        messagePlaceholder: 'Animali, orari di arrivo, domande sulla casa…',
        submit: 'Invia la richiesta',
        sending: 'Invio in corso…',
        note: 'Usiamo i tuoi dati solo per risponderti.',
        privacyLink: 'Informativa privacy',
        missingDates: 'Scegli arrivo e partenza dal calendario.',
        okTitle: 'Richiesta inviata',
        okText: (name: string) => `Grazie ${name}, abbiamo ricevuto la tua richiesta. Ti rispondiamo presto all'indirizzo che ci hai lasciato.`,
        okMail: 'Ti abbiamo mandato una email di conferma: se non la trovi, controlla nello spam.',
        another: 'Invia un\'altra richiesta',
        errorText: 'Non siamo riusciti a inviare la richiesta. Riprova tra poco, oppure scrivici su WhatsApp.',
    },

    search: {
        checkIn: 'Arrivo',
        checkOut: 'Partenza',
        guests: 'Ospiti',
        addDate: 'Aggiungi data',
        addGuests: 'Aggiungi ospiti',
        search: 'Verifica',
        searchLabel: 'Verifica la disponibilità',
        when: 'Quando vuoi venire?',
        whenShort: 'Quando?',
        pickCheckIn: 'Scegli il giorno di arrivo',
        pickCheckOut: 'Ora scegli il giorno di partenza',
        legend: 'I giorni barrati sono già occupati',
        loading: 'Carico le date libere…',
        adults: 'Adulti',
        adultsHint: 'Dai 13 anni',
        children: 'Bambini',
        childrenHint: 'Da 2 a 12 anni',
        infants: 'Neonati',
        infantsHint: 'Meno di 2 anni',
        fewer: (what: string) => `${what}: uno in meno`,
        more: (what: string) => `${what}: uno in più`,
        guestsCount: (n: number) => (n === 1 ? '1 ospite' : `${n} ospiti`),
        infantsCount: (n: number) => (n === 1 ? '1 neonato' : `${n} neonati`),
        maxNote: (n: number) => `Fino a ${n} ospiti. I neonati non contano.`,
        clear: 'Cancella',
        close: 'Chiudi',
        stay: 'Il tuo soggiorno',
        edit: 'Modifica',
        datesNeeded: 'Scegli le date',
        details: 'I tuoi dati',
        minNights: (n: number) => `Minimo ${n} notti`,
        estimate: 'Totale indicativo',
        priceNote: 'Prezzo delle sole notti, indicativo: te lo confermiamo nella risposta.',
    },

    notFound: {
        eyebrow: 'Errore 404',
        title: 'Questa pagina non esiste',
        text: 'Il link potrebbe essere vecchio. Torna alla home o guarda le fotografie della villa.',
        home: 'Torna alla home',
        gallery: 'Vedi la galleria',
    },
};

export type Dict = typeof it;

const en: Dict = {
    meta: {
        home: {
            title: 'Hidden Treasure | Beachfront Villa in Villasimius, Sardinia',
            description:
                'Holiday villa in Villasimius where the garden ends on the beach. 270° sea-view roof terrace, semi-private beach, sleeps 4 to 6. Book direct and save.',
        },
        gallery: {
            title: 'Photos of the villa | Hidden Treasure Villasimius',
            description:
                'Photos of Hidden Treasure villa in Villasimius: the panoramic terrace, the garden on the beach, the interiors and bedrooms, and the sea of southern Sardinia.',
        },
        reviews: {
            title: 'Guest reviews | Hidden Treasure Villasimius',
            description:
                'What guests say about Hidden Treasure villa in Villasimius: 4.91 on Airbnb and 5.0 on Google. Read genuine reviews from people who stayed here.',
        },
        contact: {
            title: 'Contact and booking | Hidden Treasure Villasimius',
            description:
                'Book Hidden Treasure villa in Villasimius directly: message us on WhatsApp, call or send an email. You talk to us, with no middleman.',
        },
        privacy: {
            title: 'Privacy and cookies | Hidden Treasure Villasimius',
            description:
                'How the Hidden Treasure villa website in Villasimius handles personal data: availability requests, retention, providers, cookies and your rights.',
        },
        notFound: {
            title: 'Page not found | Hidden Treasure Villasimius',
            description: 'This page does not exist. Go back to the home page of Hidden Treasure villa in Villasimius.',
        },
        ogImageAlt: 'Hidden Treasure villa overlooking the sea in Villasimius',
    },

    common: {
        skipLink: 'Skip to content',
        place: 'Villasimius · Sardinia',
    },

    header: {
        homeAria: 'Hidden Treasure — go to the home page',
        navAria: 'Main',
        navMobileAria: 'Main (mobile)',
        home: 'Home',
        villa: 'The Villa',
        gallery: 'Gallery',
        reviews: 'Reviews',
        contact: 'Contact',
        book: 'Book',
        bookStay: 'Book your stay',
        openMenu: 'Open the menu',
        closeMenu: 'Close the menu',
        language: 'Language',
        chooseLanguage: 'Choose language',
    },

    hero: {
        sectionAria: 'Introducing the villa',
        imageAlts: [
            'Hidden Treasure villa seen from the garden above the sea',
            'The semi-private beach in front of the villa',
            'Sunset over the sea from the terrace',
            'A glimpse of the Villasimius coastline',
            'The villa lawn opening onto the beach',
        ],
        eyebrow: 'Hidden Treasure · Villasimius',
        title: 'The garden ends',
        titleAccent: 'where the beach begins',
        lead: 'A villa for four to six guests on the southern coast of Sardinia. A roof terrace with 270-degree views and a semi-private beach at the end of the lawn.',
        seeVilla: 'See the villa',
        indicatorsAria: 'Photos of the villa',
        scrollAria: 'Scroll to the villa',
    },


    features: {
        items: [
            {
                label: 'Beach',
                title: 'The sea in your garden',
                description:
                    'The sea is one step away: the sand starts where the lawn ends, so close that you can hear the waves breaking.',
            },
            {
                label: 'View',
                title: 'Panoramic terrace',
                description:
                    'A 270-degree view over the sea. Your private lookout, where every day ends as the sun sets behind the coast.',
            },
            {
                label: 'Access',
                title: 'Semi-private beach',
                description:
                    'The beach at the end of the lawn is semi-private: no rows of umbrellas, no early-morning rush to find a spot.',
            },
            {
                label: 'Inside',
                title: 'Sleeps four to six',
                description:
                    'A double bedroom and a smaller second bedroom for four guests, plus a sofa bed in the living room for six. Two full bathrooms and a well-equipped kitchen.',
            },
            {
                label: 'Outside',
                title: 'Garden and two patios',
                description:
                    'A well-kept garden and two bright patios: one for breakfast in the sun, the other in the shade for the afternoon.',
            },
        ],
        stats: [
            { value: '0', unit: 'steps', label: 'to the sea' },
            { value: '270', unit: 'degrees', label: 'of view from the terrace' },
            { value: '4–6', unit: 'guests', label: 'can sleep here' },
        ],
        imageAlt: 'Sunset seen from the villa’s panoramic terrace',
        caption: 'The terrace at sunset',
        eyebrow: 'The villa',
        title: 'A place that explains itself',
        titleAccent: ' in three numbers',
        askDates: 'Ask about dates',
        allPhotos: 'See all the photos',
    },

    highlight: {
        fallbackTitle: 'What guests say',
        awardSource: 'Airbnb award',
        scoreRest: (count: number) => `from ${count} Airbnb reviews`,
        readAll: 'Read them all',
    },

    map: {
        title: 'Where',
        titleAccent: 'you’ll be',
        aria: 'Map showing the villa’s location in Villasimius',
        attribution: 'Imagery',
        openInMaps: 'Open in Google Maps',
    },

    gallery: {
        count: (n: number) => `${n} photos`,
        title: 'The villa, ',
        titleAccent: 'unfiltered',
        subtitle:
            'The rooms, the garden, the beach at the end of the lawn and the sunsets from the terrace. Tap a photo to see it in full.',
        open: (i: number, n: number) => `Open photo ${i} of ${n}`,
        alt: (i: number) => `Hidden Treasure Villasimius, photo ${i}`,
        photo: (i: number, n: number) => `Photo ${i} of ${n}`,
        ctaText: 'Like what you see?',
        ctaBtn: 'Ask about availability and prices',
        close: 'Close',
        prev: 'Previous photo',
        next: 'Next photo',
    },

    contact: {
        prefilled: 'Hello, I would like some information about Hidden Treasure for the period ____, we are ____ people.',
        number: (i: number) => `Number ${i}`,
        facts: [
            { value: '7 nights', label: 'Minimum stay in high season' },
            { value: 'IT / EN', label: 'We speak Italian and English' },
            { value: 'Direct', label: 'No booking platform fees' },
        ],
        eyebrow: 'Contact',
        title: 'You talk to ',
        titleAccent: 'us',
        titleEnd: ', not a booking site',
        subtitle:
            'Tell us your dates and how many of you there are: we will let you know if the villa is free and what the stay costs, with no booking fees.',
        waEyebrow: 'The quickest way',
        waTitle: 'Message us on WhatsApp',
        preferTalk: 'Prefer to talk?',
        call: 'Call',
        email: 'Email',
        writeEmail: 'Send an email',
        airbnbValue: 'Reviews and listing',
        openAirbnb: 'Open on Airbnb',
        factsAria: 'Practical information',
        seeMap: 'See on the map',
    },

    reviews: {
        eyebrow: 'Reviews',
        title: 'What our ',
        titleAccent: 'guests say',
        subtitle:
            'In the words of people who have already spent their holidays here, taken from our Airbnb and Google pages.',
        summaryAria: 'Average rating',
        average: (n: number) => `Average from ${n} reviews`,
        sourceCount: (n: number) => `${n} reviews`,
        readAll: 'Read them all',
        all: 'All',
        bySourceAria: 'Filter by platform',
        byTopicAria: 'Filter by topic',
        byTopic: 'Browse by topic',
        resultCount: (n: number) => `${n} ${n === 1 ? 'review' : 'reviews'}`,
        about: 'mentioning',
        showAll: 'Show all',
        readMore: 'Read more',
        readLess: 'Show less',
        translatedFrom: () => 'Translated',
        translatedNote: 'Translated by us',
        hostReply: 'Response from the host',
        seeOn: (source: string) => `See this review on ${source}`,
        verifyOn: (source: string) => `Check on ${source}`,
        ctaTitle: 'Would you like to be the next to write one?',
        ctaReview: 'Write a review',
        ctaBook: 'Book',
        stars: (v: string) => `${v} out of 5 stars`,
        categories: {
            Pulizia: 'Cleanliness',
            Precisione: 'Accuracy',
            'Check-in': 'Check-in',
            Comunicazione: 'Communication',
            Posizione: 'Location',
            'Qualità/prezzo': 'Value',
        },
        badge: { 'Amato dagli ospiti': 'Guest favourite' },
    },

    footer: {
        claim: 'The garden ends where the beach begins.',
        place: 'Villasimius, Sardinia.',
        pages: 'Pages',
        writeUs: 'Get in touch',
        whereWeAre: 'Find us',
        freeDates: 'Free dates?',
        askAvailability: 'Ask about availability',
        privacy: 'Privacy and cookies',
    },

    request: {
        eyebrow: 'Book direct',
        title: 'Your dates, ',
        titleAccent: 'no middleman',
        subtitle: 'Pick your dates and leave us a way to reach you: we will get back to you, usually within a day. No payment now.',
        datesLabel: 'Dates of your stay',
        checkIn: 'Check-in',
        checkOut: 'Check-out',
        pickDates: 'Choose your dates',
        pickCheckOut: 'Now choose check-out',
        nights: (n: number) => (n === 1 ? '1 night' : `${n} nights`),
        clearDates: 'Change dates',
        loading: 'Loading available dates…',
        guests: 'Guests',
        guestsHint: 'Children included',
        fewer: 'One guest fewer',
        more: 'One more guest',
        name: 'Full name',
        email: 'Email',
        phone: 'Phone',
        optional: 'optional',
        phoneHint: 'If you would rather hear from us on WhatsApp',
        message: 'Message',
        messagePlaceholder: 'Pets, arrival time, questions about the house…',
        submit: 'Send request',
        sending: 'Sending…',
        note: 'We only use your details to reply to you.',
        privacyLink: 'Privacy policy',
        missingDates: 'Choose check-in and check-out on the calendar.',
        okTitle: 'Request sent',
        okText: (name: string) => `Thank you ${name}, we have received your request. We will reply soon to the address you gave us.`,
        okMail: 'We have sent you a confirmation email: if you cannot find it, please check your spam folder.',
        another: 'Send another request',
        errorText: 'We could not send your request. Please try again shortly, or message us on WhatsApp.',
    },

    search: {
        checkIn: 'Check-in',
        checkOut: 'Check-out',
        guests: 'Guests',
        addDate: 'Add date',
        addGuests: 'Add guests',
        search: 'Check',
        searchLabel: 'Check availability',
        when: 'When would you like to come?',
        whenShort: 'When?',
        pickCheckIn: 'Choose your arrival day',
        pickCheckOut: 'Now choose your departure day',
        legend: 'Crossed-out days are already booked',
        loading: 'Loading available dates…',
        adults: 'Adults',
        adultsHint: 'Ages 13 or above',
        children: 'Children',
        childrenHint: 'Ages 2 to 12',
        infants: 'Infants',
        infantsHint: 'Under 2',
        fewer: (what: string) => `${what}: one fewer`,
        more: (what: string) => `${what}: one more`,
        guestsCount: (n: number) => (n === 1 ? '1 guest' : `${n} guests`),
        infantsCount: (n: number) => (n === 1 ? '1 infant' : `${n} infants`),
        maxNote: (n: number) => `Up to ${n} guests. Infants don't count.`,
        clear: 'Clear',
        close: 'Close',
        stay: 'Your stay',
        edit: 'Edit',
        datesNeeded: 'Choose dates',
        details: 'Your details',
        minNights: (n: number) => `Minimum ${n} nights`,
        estimate: 'Estimated total',
        priceNote: 'Price for the nights only, as an estimate: we confirm it in our reply.',
    },

    notFound: {
        eyebrow: 'Error 404',
        title: 'This page does not exist',
        text: 'The link may be out of date. Go back to the home page or have a look at the photos of the villa.',
        home: 'Back to the home page',
        gallery: 'See the gallery',
    },
};

const de: Dict = {
    meta: {
        home: {
            title: 'Hidden Treasure | Villa am Meer in Villasimius, Sardinien',
            description:
                'Ferienvilla in Villasimius, deren Garten direkt am Strand endet. Dachterrasse mit 270°-Meerblick, halbprivater Strand, 4 bis 6 Schlafplätze. Direkt buchen und sparen.',
        },
        gallery: {
            title: 'Fotos der Villa | Hidden Treasure Villasimius',
            description:
                'Fotos der Villa Hidden Treasure in Villasimius: Panoramaterrasse, Garten am Strand, Innenräume, Schlafzimmer und das Meer im Süden Sardiniens.',
        },
        reviews: {
            title: 'Gästebewertungen | Hidden Treasure Villasimius',
            description:
                'Was Gäste über die Villa Hidden Treasure in Villasimius sagen: 4,91 bei Airbnb und 5,0 bei Google. Lesen Sie echte Bewertungen von Gästen, die hier waren.',
        },
        contact: {
            title: 'Kontakt und Buchung | Hidden Treasure Villasimius',
            description:
                'Buchen Sie die Villa Hidden Treasure in Villasimius direkt bei uns: per WhatsApp, Telefon oder E-Mail. Sie sprechen mit uns, ohne Vermittler.',
        },
        privacy: {
            title: 'Datenschutz und Cookies | Hidden Treasure Villasimius',
            description:
                'Wie die Website der Villa Hidden Treasure in Villasimius personenbezogene Daten verarbeitet: Anfragen, Speicherdauer, Dienstleister, Cookies und Ihre Rechte.',
        },
        notFound: {
            title: 'Seite nicht gefunden | Hidden Treasure Villasimius',
            description: 'Diese Seite gibt es nicht. Zurück zur Startseite der Villa Hidden Treasure in Villasimius.',
        },
        ogImageAlt: 'Die Villa Hidden Treasure mit Blick auf das Meer von Villasimius',
    },

    common: {
        skipLink: 'Zum Inhalt springen',
        place: 'Villasimius · Sardinien',
    },

    header: {
        homeAria: 'Hidden Treasure — zur Startseite',
        navAria: 'Hauptnavigation',
        navMobileAria: 'Hauptnavigation (mobil)',
        home: 'Start',
        villa: 'Die Villa',
        gallery: 'Galerie',
        reviews: 'Bewertungen',
        contact: 'Kontakt',
        book: 'Buchen',
        bookStay: 'Aufenthalt anfragen',
        openMenu: 'Menü öffnen',
        closeMenu: 'Menü schließen',
        language: 'Sprache',
        chooseLanguage: 'Sprache wählen',
    },

    hero: {
        sectionAria: 'Vorstellung der Villa',
        imageAlts: [
            'Die Villa Hidden Treasure vom Garten über dem Meer aus gesehen',
            'Der halbprivate Strand vor der Villa',
            'Sonnenuntergang über dem Meer, von der Terrasse aus gesehen',
            'Ein Blick auf die Küste von Villasimius',
            'Der Rasen der Villa, der sich zum Strand hin öffnet',
        ],
        eyebrow: 'Hidden Treasure · Villasimius',
        title: 'Der Garten endet',
        titleAccent: 'wo der Strand beginnt',
        lead: 'Eine Villa für vier bis sechs Personen an der Südküste Sardiniens. Dachterrasse mit 270-Grad-Blick und ein halbprivater Strand am Ende des Rasens.',
        seeVilla: 'Die Villa ansehen',
        indicatorsAria: 'Fotos der Villa',
        scrollAria: 'Weiter zur Vorstellung der Villa',
    },


    features: {
        items: [
            {
                label: 'Strand',
                title: 'Das Meer im Garten',
                description:
                    'Zum Meer ist es nur ein Schritt: Wo der Rasen endet, beginnt der Sand, so nah, dass man die Wellen brechen hört.',
            },
            {
                label: 'Ausblick',
                title: 'Panoramaterrasse',
                description:
                    'Ein 270-Grad-Blick über das Meer. Ihr privater Aussichtspunkt, an dem jeder Tag endet, wenn die Sonne hinter der Küste versinkt.',
            },
            {
                label: 'Zugang',
                title: 'Halbprivater Strand',
                description:
                    'Der Strand am Ende des Rasens ist halbprivat: keine Schirmreihen, kein Wettlauf um den besten Platz am frühen Morgen.',
            },
            {
                label: 'Innen',
                title: 'Vier bis sechs Schlafplätze',
                description:
                    'Ein Doppelzimmer und ein kleineres zweites Schlafzimmer für vier Personen, dazu ein Schlafsofa im Wohnzimmer für bis zu sechs. Zwei vollständige Bäder und eine gut ausgestattete Küche.',
            },
            {
                label: 'Außen',
                title: 'Garten und zwei Patios',
                description:
                    'Ein gepflegter Garten und zwei helle Patios: einer für das Frühstück in der Sonne, der andere im Schatten für den Nachmittag.',
            },
        ],
        stats: [
            { value: '0', unit: 'Schritte', label: 'bis zum Meer' },
            { value: '270', unit: 'Grad', label: 'Aussicht von der Terrasse' },
            { value: '4–6', unit: 'Schlafplätze', label: 'für Ihre Gruppe' },
        ],
        imageAlt: 'Der Sonnenuntergang von der Panoramaterrasse der Villa aus',
        caption: 'Die Terrasse bei Sonnenuntergang',
        eyebrow: 'Die Villa',
        title: 'Ein Ort, der sich',
        titleAccent: ' in drei Zahlen erklärt',
        askDates: 'Termine anfragen',
        allPhotos: 'Alle Fotos ansehen',
    },

    highlight: {
        fallbackTitle: 'Das sagen unsere Gäste',
        awardSource: 'Auszeichnung von Airbnb',
        scoreRest: (count: number) => `aus ${count} Airbnb-Bewertungen`,
        readAll: 'Alle lesen',
    },

    map: {
        title: 'Wo Sie',
        titleAccent: 'wohnen werden',
        aria: 'Karte mit der Lage der Villa in Villasimius',
        attribution: 'Bilder',
        openInMaps: 'In Google Maps öffnen',
    },

    gallery: {
        count: (n: number) => `${n} Fotos`,
        title: 'Die Villa, ',
        titleAccent: 'ungeschönt',
        subtitle:
            'Die Zimmer, der Garten, der Strand am Ende des Rasens und die Sonnenuntergänge von der Terrasse. Tippen Sie auf ein Foto, um es ganz zu sehen.',
        open: (i: number, n: number) => `Foto ${i} von ${n} öffnen`,
        alt: (i: number) => `Hidden Treasure Villasimius, Foto ${i}`,
        photo: (i: number, n: number) => `Foto ${i} von ${n}`,
        ctaText: 'Gefällt Ihnen, was Sie sehen?',
        ctaBtn: 'Verfügbarkeit und Preise anfragen',
        close: 'Schließen',
        prev: 'Vorheriges Foto',
        next: 'Nächstes Foto',
    },

    contact: {
        prefilled: 'Hallo, ich hätte gern Informationen zu Hidden Treasure für den Zeitraum ____, wir sind ____ Personen.',
        number: (i: number) => `Nummer ${i}`,
        facts: [
            { value: '7 Nächte', label: 'Mindestaufenthalt in der Hochsaison' },
            { value: 'IT / EN', label: 'Wir sprechen Italienisch und Englisch' },
            { value: 'Direkt', label: 'Keine Plattformgebühren' },
        ],
        eyebrow: 'Kontakt',
        title: 'Hier antworten ',
        titleAccent: 'wir',
        titleEnd: ', kein Portal',
        subtitle:
            'Nennen Sie uns Ihren Zeitraum und wie viele Personen Sie sind: Wir sagen Ihnen, ob die Villa frei ist und was der Aufenthalt kostet, ohne Vermittlungsgebühren.',
        waEyebrow: 'Am schnellsten',
        waTitle: 'Schreiben Sie uns auf WhatsApp',
        preferTalk: 'Lieber telefonieren?',
        call: 'Anrufen:',
        email: 'E-Mail',
        writeEmail: 'E-Mail schreiben',
        airbnbValue: 'Bewertungen und Inserat',
        openAirbnb: 'Auf Airbnb öffnen',
        factsAria: 'Praktische Informationen',
        seeMap: 'Auf der Karte ansehen',
    },

    reviews: {
        eyebrow: 'Bewertungen',
        title: 'Was unsere ',
        titleAccent: 'Gäste sagen',
        subtitle:
            'Die Worte von Gästen, die hier schon ihren Urlaub verbracht haben, übernommen von unseren Seiten bei Airbnb und Google.',
        summaryAria: 'Durchschnittliche Bewertung',
        average: (n: number) => `Durchschnitt aus ${n} Bewertungen`,
        sourceCount: (n: number) => `${n} Bewertungen`,
        readAll: 'Alle lesen',
        all: 'Alle',
        bySourceAria: 'Nach Plattform filtern',
        byTopicAria: 'Nach Thema filtern',
        byTopic: 'Nach Thema suchen',
        resultCount: (n: number) => `${n} ${n === 1 ? 'Bewertung' : 'Bewertungen'}`,
        about: 'zum Thema',
        showAll: 'Alle anzeigen',
        readMore: 'Weiterlesen',
        readLess: 'Weniger anzeigen',
        translatedFrom: () => 'Übersetzt',
        translatedNote: 'Von uns übersetzt',
        hostReply: 'Antwort der Gastgeberin',
        seeOn: (source: string) => `Diese Bewertung auf ${source} ansehen`,
        verifyOn: (source: string) => `Auf ${source} prüfen`,
        ctaTitle: 'Möchten Sie als Nächstes eine schreiben?',
        ctaReview: 'Bewertung schreiben',
        ctaBook: 'Buchen',
        stars: (v: string) => `${v} von 5 Sternen`,
        categories: {
            Pulizia: 'Sauberkeit',
            Precisione: 'Genauigkeit',
            'Check-in': 'Check-in',
            Comunicazione: 'Kommunikation',
            Posizione: 'Lage',
            'Qualità/prezzo': 'Preis-Leistung',
        },
        badge: { 'Amato dagli ospiti': 'Gäste-Favorit' },
    },

    footer: {
        claim: 'Der Garten endet, wo der Strand beginnt.',
        place: 'Villasimius, Sardinien.',
        pages: 'Seiten',
        writeUs: 'Schreiben Sie uns',
        whereWeAre: 'So finden Sie uns',
        freeDates: 'Noch frei?',
        askAvailability: 'Verfügbarkeit anfragen',
        privacy: 'Datenschutz',
    },

    request: {
        eyebrow: 'Direkt anfragen',
        title: 'Ihre Reisedaten, ',
        titleAccent: 'ohne Vermittler',
        subtitle: 'Wählen Sie den Zeitraum und hinterlassen Sie uns Ihre Kontaktdaten: Wir melden uns, meist innerhalb eines Tages. Jetzt ist keine Zahlung nötig.',
        datesLabel: 'Reisezeitraum',
        checkIn: 'Anreise',
        checkOut: 'Abreise',
        pickDates: 'Daten wählen',
        pickCheckOut: 'Jetzt die Abreise wählen',
        nights: (n: number) => (n === 1 ? '1 Nacht' : `${n} Nächte`),
        clearDates: 'Daten ändern',
        loading: 'Freie Termine werden geladen…',
        guests: 'Gäste',
        guestsHint: 'Kinder inbegriffen',
        fewer: 'Ein Gast weniger',
        more: 'Ein Gast mehr',
        name: 'Vor- und Nachname',
        email: 'E-Mail',
        phone: 'Telefon',
        optional: 'optional',
        phoneHint: 'Falls Sie lieber per WhatsApp kontaktiert werden möchten',
        message: 'Nachricht',
        messagePlaceholder: 'Haustiere, Ankunftszeit, Fragen zum Haus…',
        submit: 'Anfrage senden',
        sending: 'Wird gesendet…',
        note: 'Wir verwenden Ihre Daten nur, um Ihnen zu antworten.',
        privacyLink: 'Datenschutzerklärung',
        missingDates: 'Bitte wählen Sie An- und Abreise im Kalender.',
        okTitle: 'Anfrage gesendet',
        okText: (name: string) => `Danke, ${name}! Wir haben Ihre Anfrage erhalten und antworten Ihnen bald an die angegebene Adresse.`,
        okMail: 'Wir haben Ihnen eine Bestätigung per E-Mail geschickt. Falls Sie sie nicht finden, sehen Sie bitte im Spam-Ordner nach.',
        another: 'Weitere Anfrage senden',
        errorText: 'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es gleich noch einmal oder schreiben Sie uns auf WhatsApp.',
    },

    search: {
        checkIn: 'Anreise',
        checkOut: 'Abreise',
        guests: 'Gäste',
        addDate: 'Datum wählen',
        addGuests: 'Gäste hinzufügen',
        search: 'Prüfen',
        searchLabel: 'Verfügbarkeit prüfen',
        when: 'Wann möchten Sie kommen?',
        whenShort: 'Wann?',
        pickCheckIn: 'Wählen Sie den Anreisetag',
        pickCheckOut: 'Jetzt den Abreisetag wählen',
        legend: 'Durchgestrichene Tage sind bereits belegt',
        loading: 'Freie Termine werden geladen…',
        adults: 'Erwachsene',
        adultsHint: 'Ab 13 Jahren',
        children: 'Kinder',
        childrenHint: '2 bis 12 Jahre',
        infants: 'Kleinkinder',
        infantsHint: 'Unter 2 Jahren',
        fewer: (what: string) => `${what}: eins weniger`,
        more: (what: string) => `${what}: eins mehr`,
        guestsCount: (n: number) => (n === 1 ? '1 Gast' : `${n} Gäste`),
        infantsCount: (n: number) => (n === 1 ? '1 Kleinkind' : `${n} Kleinkinder`),
        maxNote: (n: number) => `Bis zu ${n} Gäste. Kleinkinder zählen nicht mit.`,
        clear: 'Löschen',
        close: 'Schließen',
        stay: 'Ihr Aufenthalt',
        edit: 'Ändern',
        datesNeeded: 'Daten wählen',
        details: 'Ihre Angaben',
        minNights: (n: number) => `Mindestens ${n} Nächte`,
        estimate: 'Voraussichtlicher Preis',
        priceNote: 'Preis nur für die Nächte, unverbindlich: Wir bestätigen ihn in unserer Antwort.',
    },

    notFound: {
        eyebrow: 'Fehler 404',
        title: 'Diese Seite gibt es nicht',
        text: 'Der Link ist vielleicht veraltet. Gehen Sie zurück zur Startseite oder sehen Sie sich die Fotos der Villa an.',
        home: 'Zur Startseite',
        gallery: 'Zur Galerie',
    },
};

const fr: Dict = {
    meta: {
        home: {
            title: 'Hidden Treasure | Villa pieds dans l’eau à Villasimius, Sardaigne',
            description:
                'Villa à louer à Villasimius dont le jardin finit sur la plage. Toit-terrasse avec vue à 270°, plage semi-privée, 4 à 6 couchages. Réservez en direct et économisez.',
        },
        gallery: {
            title: 'Photos de la villa | Hidden Treasure Villasimius',
            description:
                'Les photos de la villa Hidden Treasure à Villasimius : terrasse panoramique, jardin sur la plage, intérieurs, chambres et la mer du sud de la Sardaigne.',
        },
        reviews: {
            title: 'Avis des voyageurs | Hidden Treasure Villasimius',
            description:
                'Ce que les voyageurs disent de la villa Hidden Treasure à Villasimius : 4,91 sur Airbnb et 5,0 sur Google. Lisez les vrais avis de ceux qui y ont séjourné.',
        },
        contact: {
            title: 'Contact et réservation | Hidden Treasure Villasimius',
            description:
                'Réservez la villa Hidden Treasure à Villasimius en direct : écrivez-nous sur WhatsApp, appelez-nous ou envoyez un e-mail. C’est nous qui vous répondons, sans intermédiaire.',
        },
        privacy: {
            title: 'Confidentialité et cookies | Hidden Treasure Villasimius',
            description:
                'Comment le site de la villa Hidden Treasure à Villasimius traite les données personnelles : demandes, conservation, prestataires, cookies et vos droits.',
        },
        notFound: {
            title: 'Page introuvable | Hidden Treasure Villasimius',
            description: 'Cette page n’existe pas. Revenez à l’accueil de la villa Hidden Treasure à Villasimius.',
        },
        ogImageAlt: 'La villa Hidden Treasure face à la mer de Villasimius',
    },

    common: {
        skipLink: 'Aller au contenu',
        place: 'Villasimius · Sardaigne',
    },

    header: {
        homeAria: 'Hidden Treasure — retour à l’accueil',
        navAria: 'Navigation principale',
        navMobileAria: 'Navigation principale (mobile)',
        home: 'Accueil',
        villa: 'La villa',
        gallery: 'Galerie',
        reviews: 'Avis',
        contact: 'Contact',
        book: 'Réserver',
        bookStay: 'Réserver votre séjour',
        openMenu: 'Ouvrir le menu',
        closeMenu: 'Fermer le menu',
        language: 'Langue',
        chooseLanguage: 'Choisir la langue',
    },

    hero: {
        sectionAria: 'Présentation de la villa',
        imageAlts: [
            'La villa Hidden Treasure vue depuis le jardin au-dessus de la mer',
            'La plage semi-privée devant la villa',
            'Coucher de soleil sur la mer depuis la terrasse',
            'Un aperçu de la côte de Villasimius',
            'La pelouse de la villa qui s’ouvre sur la plage',
        ],
        eyebrow: 'Hidden Treasure · Villasimius',
        title: 'Le jardin s’arrête',
        titleAccent: 'là où la plage commence',
        lead: 'Une villa de quatre à six couchages sur la côte sud de la Sardaigne. Un toit-terrasse avec vue à 270 degrés et une plage semi-privée au bout de la pelouse.',
        seeVilla: 'Découvrir la villa',
        indicatorsAria: 'Photos de la villa',
        scrollAria: 'Défiler jusqu’à la présentation de la villa',
    },


    features: {
        items: [
            {
                label: 'Plage',
                title: 'La mer au fond du jardin',
                description:
                    'La mer est à un pas : le sable commence là où finit la pelouse, si près que l’on entend les vagues se briser.',
            },
            {
                label: 'Vue',
                title: 'Terrasse panoramique',
                description:
                    'Une vue à 270 degrés sur la mer. Votre belvédère privé, où se terminent toutes les journées, quand le soleil se couche derrière la côte.',
            },
            {
                label: 'Accès',
                title: 'Plage semi-privée',
                description:
                    'La plage au bout de la pelouse est semi-privée : pas de rangées de parasols, pas de course matinale pour trouver une place.',
            },
            {
                label: 'Intérieur',
                title: 'De quatre à six couchages',
                description:
                    'Une chambre double et une petite seconde chambre pour quatre personnes, plus un canapé-lit au séjour pour accueillir jusqu’à six. Deux salles de bains complètes et une cuisine équipée.',
            },
            {
                label: 'Extérieur',
                title: 'Jardin et deux patios',
                description:
                    'Un jardin soigné et deux patios lumineux : l’un pour le petit-déjeuner au soleil, l’autre à l’ombre pour l’après-midi.',
            },
        ],
        stats: [
            { value: '0', unit: 'pas', label: 'jusqu’à la mer' },
            { value: '270', unit: 'degrés', label: 'de vue depuis la terrasse' },
            { value: '4–6', unit: 'couchages', label: 'pour votre groupe' },
        ],
        imageAlt: 'Le coucher de soleil vu de la terrasse panoramique de la villa',
        caption: 'La terrasse au coucher du soleil',
        eyebrow: 'La villa',
        title: 'Un lieu qui se raconte',
        titleAccent: ' en trois chiffres',
        askDates: 'Demander les dates',
        allPhotos: 'Voir toutes les photos',
    },

    highlight: {
        fallbackTitle: 'Ils parlent de nous',
        awardSource: 'Distinction Airbnb',
        scoreRest: (count: number) => `sur ${count} avis Airbnb`,
        readAll: 'Tout lire',
    },

    map: {
        title: 'Où vous',
        titleAccent: 'serez',
        aria: 'Carte indiquant l’emplacement de la villa à Villasimius',
        attribution: 'Images',
        openInMaps: 'Ouvrir dans Google Maps',
    },

    gallery: {
        count: (n: number) => `${n} photos`,
        title: 'La villa, ',
        titleAccent: 'sans filtre',
        subtitle:
            'Les pièces, le jardin, la plage au bout de la pelouse et les couchers de soleil depuis la terrasse. Touchez une photo pour la voir en entier.',
        open: (i: number, n: number) => `Ouvrir la photo ${i} sur ${n}`,
        alt: (i: number) => `Hidden Treasure Villasimius, photo ${i}`,
        photo: (i: number, n: number) => `Photo ${i} sur ${n}`,
        ctaText: 'Ce que vous avez vu vous plaît ?',
        ctaBtn: 'Demander disponibilités et tarifs',
        close: 'Fermer',
        prev: 'Photo précédente',
        next: 'Photo suivante',
    },

    contact: {
        prefilled: 'Bonjour, je souhaiterais des informations sur Hidden Treasure pour la période du ____, nous sommes ____ personnes.',
        number: (i: number) => `Numéro ${i}`,
        facts: [
            { value: '7 nuits', label: 'Séjour minimum en haute saison' },
            { value: 'IT / EN', label: 'Nous parlons italien et anglais' },
            { value: 'En direct', label: 'Aucuns frais de plateforme' },
        ],
        eyebrow: 'Contact',
        title: 'C’est ',
        titleAccent: 'nous',
        titleEnd: ' qui répondons, pas une plateforme',
        subtitle:
            'Indiquez-nous vos dates et le nombre de personnes : nous vous disons si la villa est libre et combien coûte le séjour, sans frais d’intermédiaire.',
        waEyebrow: 'Le plus rapide',
        waTitle: 'Écrivez-nous sur WhatsApp',
        preferTalk: 'Vous préférez parler ?',
        call: 'Appeler le',
        email: 'E-mail',
        writeEmail: 'Envoyer un e-mail',
        airbnbValue: 'Avis et annonce',
        openAirbnb: 'Ouvrir sur Airbnb',
        factsAria: 'Informations pratiques',
        seeMap: 'Voir sur la carte',
    },

    reviews: {
        eyebrow: 'Avis',
        title: 'Ce que disent ',
        titleAccent: 'nos voyageurs',
        subtitle:
            'Les mots de ceux qui ont déjà passé leurs vacances ici, repris de nos pages Airbnb et Google.',
        summaryAria: 'Note moyenne',
        average: (n: number) => `Moyenne sur ${n} avis`,
        sourceCount: (n: number) => `${n} avis`,
        readAll: 'Tout lire',
        all: 'Tous',
        bySourceAria: 'Filtrer par plateforme',
        byTopicAria: 'Filtrer par thème',
        byTopic: 'Rechercher par thème',
        resultCount: (n: number) => `${n} avis`,
        about: 'qui parlent de',
        showAll: 'Tout afficher',
        readMore: 'Lire la suite',
        readLess: 'Réduire',
        translatedFrom: () => 'Traduit',
        translatedNote: 'Traduit par nos soins',
        hostReply: 'Réponse de l’hôte',
        seeOn: (source: string) => `Voir cet avis sur ${source}`,
        verifyOn: (source: string) => `Vérifier sur ${source}`,
        ctaTitle: 'Envie d’être le prochain à en écrire un ?',
        ctaReview: 'Laisser un avis',
        ctaBook: 'Réserver',
        stars: (v: string) => `${v} étoiles sur 5`,
        categories: {
            Pulizia: 'Propreté',
            Precisione: 'Exactitude',
            'Check-in': 'Arrivée',
            Comunicazione: 'Communication',
            Posizione: 'Emplacement',
            'Qualità/prezzo': 'Qualité-prix',
        },
        badge: { 'Amato dagli ospiti': 'Coup de cœur voyageurs' },
    },

    footer: {
        claim: 'Le jardin s’arrête là où la plage commence.',
        place: 'Villasimius, Sardaigne.',
        pages: 'Pages',
        writeUs: 'Écrivez-nous',
        whereWeAre: 'Nous trouver',
        freeDates: 'Des dates libres ?',
        askAvailability: 'Demander les disponibilités',
        privacy: 'Confidentialité',
    },

    request: {
        eyebrow: 'Demande directe',
        title: 'Vos dates, ',
        titleAccent: 'sans intermédiaire',
        subtitle: 'Choisissez vos dates et laissez-nous vos coordonnées : nous vous répondons, en général sous 24 heures. Aucun paiement maintenant.',
        datesLabel: 'Dates du séjour',
        checkIn: 'Arrivée',
        checkOut: 'Départ',
        pickDates: 'Choisir les dates',
        pickCheckOut: 'Choisissez maintenant le départ',
        nights: (n: number) => (n === 1 ? '1 nuit' : `${n} nuits`),
        clearDates: 'Modifier les dates',
        loading: 'Chargement des dates libres…',
        guests: 'Voyageurs',
        guestsHint: 'Enfants compris',
        fewer: 'Un voyageur de moins',
        more: 'Un voyageur de plus',
        name: 'Nom et prénom',
        email: 'E-mail',
        phone: 'Téléphone',
        optional: 'facultatif',
        phoneHint: 'Si vous préférez être recontacté sur WhatsApp',
        message: 'Message',
        messagePlaceholder: "Animaux, heure d'arrivée, questions sur la maison…",
        submit: 'Envoyer la demande',
        sending: 'Envoi en cours…',
        note: 'Vos données servent uniquement à vous répondre.',
        privacyLink: 'Politique de confidentialité',
        missingDates: "Choisissez l'arrivée et le départ dans le calendrier.",
        okTitle: 'Demande envoyée',
        okText: (name: string) => `Merci ${name}, nous avons bien reçu votre demande. Nous vous répondrons bientôt à l'adresse indiquée.`,
        okMail: 'Nous vous avons envoyé un e-mail de confirmation : si vous ne le trouvez pas, vérifiez vos spams.',
        another: 'Envoyer une autre demande',
        errorText: "Nous n'avons pas pu envoyer votre demande. Réessayez dans un instant ou écrivez-nous sur WhatsApp.",
    },

    search: {
        checkIn: 'Arrivée',
        checkOut: 'Départ',
        guests: 'Voyageurs',
        addDate: 'Ajouter une date',
        addGuests: 'Ajouter des voyageurs',
        search: 'Vérifier',
        searchLabel: 'Vérifier la disponibilité',
        when: 'Quand souhaitez-vous venir ?',
        whenShort: 'Quand ?',
        pickCheckIn: "Choisissez le jour d'arrivée",
        pickCheckOut: 'Choisissez maintenant le jour de départ',
        legend: 'Les jours barrés sont déjà réservés',
        loading: 'Chargement des dates libres…',
        adults: 'Adultes',
        adultsHint: '13 ans et plus',
        children: 'Enfants',
        childrenHint: 'De 2 à 12 ans',
        infants: 'Bébés',
        infantsHint: 'Moins de 2 ans',
        fewer: (what: string) => `${what} : un de moins`,
        more: (what: string) => `${what} : un de plus`,
        guestsCount: (n: number) => (n === 1 ? '1 voyageur' : `${n} voyageurs`),
        infantsCount: (n: number) => (n === 1 ? '1 bébé' : `${n} bébés`),
        maxNote: (n: number) => `Jusqu'à ${n} voyageurs. Les bébés ne comptent pas.`,
        clear: 'Effacer',
        close: 'Fermer',
        stay: 'Votre séjour',
        edit: 'Modifier',
        datesNeeded: 'Choisir les dates',
        details: 'Vos coordonnées',
        minNights: (n: number) => `Minimum ${n} nuits`,
        estimate: 'Total indicatif',
        priceNote: 'Prix des nuits seules, à titre indicatif : nous le confirmons dans notre réponse.',
    },

    notFound: {
        eyebrow: 'Erreur 404',
        title: 'Cette page n’existe pas',
        text: 'Le lien est peut-être ancien. Revenez à l’accueil ou regardez les photos de la villa.',
        home: 'Retour à l’accueil',
        gallery: 'Voir la galerie',
    },
};

export const STRINGS: Record<Lang, Dict> = { it, en, de, fr };
