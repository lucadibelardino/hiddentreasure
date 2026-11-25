/**
 * Guida di benvenuto per gli ospiti (/benvenuto, /en/welcome, /de/willkommen, /fr/bienvenue).
 * Pagina nascosta: fuori dal menu e dalla sitemap, con noindex.
 *
 * ATTENZIONE: la repo e' pubblica. Qui NON vanno mai Wi-Fi, codici di porte o
 * cassette, numeri privati: gli ospiti li trovano in casa.
 *
 * Nei testi:
 *  - {{testo}}         = segnaposto ancora da compilare (evidenziato in giallo sulla pagina)
 *  - [testo](indirizzo) = link
 */
import type { Lang } from './langs';

export const WELCOME_ROUTES: Record<Lang, string> = {
    it: '/benvenuto',
    en: '/en/welcome',
    de: '/de/willkommen',
    fr: '/fr/bienvenue',
};

export type Block = string | { list: string[] } | { table: { head: string[]; rows: string[][] } };

export interface WelcomeSection {
    /** Ancora nell'indirizzo (#arrivo) e nell'indice in alto. */
    id: string;
    /** Voce breve nell'indice. */
    nav: string;
    h: string;
    body: Block[];
}

export interface WelcomeText {
    meta: { title: string; description: string };
    eyebrow: string;
    title: string;
    intro: string;
    contents: string;
    sections: WelcomeSection[];
}

const it: WelcomeText = {
    meta: {
        title: 'Guida per gli ospiti | Hidden Treasure Villasimius',
        description: 'Tutto quello che serve durante il soggiorno: arrivo, casa, parcheggio, rifiuti e regole.',
    },
    eyebrow: 'Benvenuti',
    title: 'La guida della casa',
    intro:
        'Siamo felici di avervi qui. In questa pagina trovate tutto quello che serve durante il soggiorno: tenetela a portata di mano e, per qualsiasi dubbio, scriveteci.',
    contents: 'In questa guida',
    sections: [
        {
            id: 'arrivo',
            nav: 'Arrivo',
            h: 'Arrivo e check-in',
            body: [
                'Il check-in è dalle {{ora check-in}}. Se arrivate più tardi, avvisateci.',
                'Indirizzo: {{indirizzo completo}}. [Indicazioni stradali fino alla casa](DIRECTIONS).',
                '{{come si entra: chi vi accoglie oppure dove sono le chiavi}}',
            ],
        },
        {
            id: 'casa',
            nav: 'La casa',
            h: 'Come funziona la casa',
            body: [
                {
                    list: [
                        'Wi-Fi: nome della rete e password li trovate in casa, {{dove}}',
                        'Aria condizionata: {{come si accende, telecomandi}}',
                        'Acqua calda: {{boiler, tempi}}',
                        'Cucina: {{piano cottura, forno, lavastoviglie, caffè}}',
                        'Lavatrice: {{dove si trova, detersivo}}',
                        'Biancheria e asciugamani: {{cosa c\'è, cambio}}',
                        'Esterni: {{doccia esterna, giardino, barbecue}}',
                    ],
                },
            ],
        },
        {
            id: 'parcheggio',
            nav: 'Parcheggio',
            h: 'Parcheggio',
            body: ['{{dove parcheggiare, quanti posti, cancello}}'],
        },
        {
            id: 'rifiuti',
            nav: 'Rifiuti',
            h: 'Rifiuti e raccolta differenziata',
            body: [
                'Vi chiediamo di dividere i rifiuti. {{dove sono i bidoni e quando esporli}}',
                {
                    table: {
                        head: ['Tipo', 'Cosa va dentro', 'Giorno di ritiro'],
                        rows: [
                            ['Organico', '{{cosa}}', '{{giorni}}'],
                            ['Plastica e metalli', '{{cosa}}', '{{giorni}}'],
                            ['Carta e cartone', '{{cosa}}', '{{giorni}}'],
                            ['Vetro', '{{cosa}}', '{{giorni}}'],
                            ['Secco indifferenziato', '{{cosa}}', '{{giorni}}'],
                        ],
                    },
                },
            ],
        },
        {
            id: 'regole',
            nav: 'Regole',
            h: 'Regole della casa',
            body: [{ list: ['{{regola}}', '{{regola}}', '{{regola}}'] }],
        },
        {
            id: 'partenza',
            nav: 'Partenza',
            h: 'Partenza e check-out',
            body: [
                'Il check-out è entro le {{ora check-out}}.',
                { list: ['{{cosa fare prima di partire}}', '{{dove lasciare le chiavi}}'] },
            ],
        },
        {
            id: 'numeri',
            nav: 'Numeri utili',
            h: 'Numeri utili',
            body: [
                {
                    list: [
                        'Emergenze (ambulanza, polizia, vigili del fuoco): [112](tel:112)',
                        'Noi: [WhatsApp](https://wa.me/393518085256) · [gestionehtv@gmail.com](mailto:gestionehtv@gmail.com)',
                        'Guardia medica turistica: {{indirizzo e telefono}}',
                        'Farmacia più vicina: {{nome e indirizzo}}',
                    ],
                },
            ],
        },
        {
            id: 'dintorni',
            nav: 'Dintorni',
            h: 'I nostri consigli nei dintorni',
            body: [
                {
                    list: [
                        'Spiagge: {{spiagge consigliate}}',
                        'Spesa: {{supermercato più vicino}}',
                        'Ristoranti: {{dove mangiare}}',
                    ],
                },
            ],
        },
    ],
};

const en: WelcomeText = {
    meta: {
        title: 'Guest guide | Hidden Treasure Villasimius',
        description: 'Everything you need during your stay: arrival, the house, parking, waste and house rules.',
    },
    eyebrow: 'Welcome',
    title: 'House guide',
    intro:
        'We are happy to have you here. This page has everything you need during your stay: keep it handy and message us with any question.',
    contents: 'In this guide',
    sections: [
        {
            id: 'arrivo',
            nav: 'Arrival',
            h: 'Arrival and check-in',
            body: [
                'Check-in is from {{check-in time}}. If you arrive later, please let us know.',
                'Address: {{full address}}. [Directions to the house](DIRECTIONS).',
                '{{how to get in: who meets you or where the keys are}}',
            ],
        },
        {
            id: 'casa',
            nav: 'The house',
            h: 'How the house works',
            body: [
                {
                    list: [
                        'Wi-Fi: network name and password are in the house, {{where}}',
                        'Air conditioning: {{how to switch on, remotes}}',
                        'Hot water: {{boiler, timing}}',
                        'Kitchen: {{hob, oven, dishwasher, coffee}}',
                        'Washing machine: {{where it is, detergent}}',
                        'Linen and towels: {{what is provided, changes}}',
                        'Outdoors: {{outdoor shower, garden, barbecue}}',
                    ],
                },
            ],
        },
        { id: 'parcheggio', nav: 'Parking', h: 'Parking', body: ['{{where to park, how many spaces, gate}}'] },
        {
            id: 'rifiuti',
            nav: 'Waste',
            h: 'Waste and recycling',
            body: [
                'Please sort your waste. {{where the bins are and when to put them out}}',
                {
                    table: {
                        head: ['Type', 'What goes in', 'Collection day'],
                        rows: [
                            ['Organic', '{{what}}', '{{days}}'],
                            ['Plastic and metal', '{{what}}', '{{days}}'],
                            ['Paper and cardboard', '{{what}}', '{{days}}'],
                            ['Glass', '{{what}}', '{{days}}'],
                            ['General waste', '{{what}}', '{{days}}'],
                        ],
                    },
                },
            ],
        },
        { id: 'regole', nav: 'Rules', h: 'House rules', body: [{ list: ['{{rule}}', '{{rule}}', '{{rule}}'] }] },
        {
            id: 'partenza',
            nav: 'Departure',
            h: 'Departure and check-out',
            body: [
                'Check-out is by {{check-out time}}.',
                { list: ['{{what to do before leaving}}', '{{where to leave the keys}}'] },
            ],
        },
        {
            id: 'numeri',
            nav: 'Useful numbers',
            h: 'Useful numbers',
            body: [
                {
                    list: [
                        'Emergencies (ambulance, police, fire brigade): [112](tel:112)',
                        'Us: [WhatsApp](https://wa.me/393518085256) · [gestionehtv@gmail.com](mailto:gestionehtv@gmail.com)',
                        'Tourist medical service: {{address and phone}}',
                        'Nearest pharmacy: {{name and address}}',
                    ],
                },
            ],
        },
        {
            id: 'dintorni',
            nav: 'Around',
            h: 'Our tips nearby',
            body: [
                {
                    list: [
                        'Beaches: {{recommended beaches}}',
                        'Groceries: {{nearest supermarket}}',
                        'Restaurants: {{where to eat}}',
                    ],
                },
            ],
        },
    ],
};

const de: WelcomeText = {
    meta: {
        title: 'Gästeinfo | Hidden Treasure Villasimius',
        description: 'Alles für Ihren Aufenthalt: Ankunft, das Haus, Parken, Müll und Hausregeln.',
    },
    eyebrow: 'Willkommen',
    title: 'Hausinfo',
    intro:
        'Schön, dass Sie da sind. Hier finden Sie alles, was Sie während Ihres Aufenthalts brauchen. Bei Fragen schreiben Sie uns gerne.',
    contents: 'In dieser Info',
    sections: [
        {
            id: 'arrivo',
            nav: 'Ankunft',
            h: 'Ankunft und Check-in',
            body: [
                'Check-in ab {{Check-in-Uhrzeit}}. Wenn Sie später ankommen, sagen Sie uns bitte Bescheid.',
                'Adresse: {{vollständige Adresse}}. [Route zum Haus](DIRECTIONS).',
                '{{wie Sie hineinkommen: wer Sie empfängt oder wo die Schlüssel sind}}',
            ],
        },
        {
            id: 'casa',
            nav: 'Das Haus',
            h: 'So funktioniert das Haus',
            body: [
                {
                    list: [
                        'WLAN: Netzwerkname und Passwort finden Sie im Haus, {{wo}}',
                        'Klimaanlage: {{Einschalten, Fernbedienungen}}',
                        'Warmwasser: {{Boiler, Zeiten}}',
                        'Küche: {{Kochfeld, Backofen, Spülmaschine, Kaffee}}',
                        'Waschmaschine: {{wo, Waschmittel}}',
                        'Bettwäsche und Handtücher: {{was vorhanden ist, Wechsel}}',
                        'Außenbereich: {{Außendusche, Garten, Grill}}',
                    ],
                },
            ],
        },
        { id: 'parcheggio', nav: 'Parken', h: 'Parken', body: ['{{wo parken, wie viele Plätze, Tor}}'] },
        {
            id: 'rifiuti',
            nav: 'Müll',
            h: 'Müll und Mülltrennung',
            body: [
                'Bitte trennen Sie den Müll. {{wo die Tonnen stehen und wann sie raus müssen}}',
                {
                    table: {
                        head: ['Art', 'Was hinein gehört', 'Abholtag'],
                        rows: [
                            ['Bioabfall', '{{was}}', '{{Tage}}'],
                            ['Plastik und Metall', '{{was}}', '{{Tage}}'],
                            ['Papier und Pappe', '{{was}}', '{{Tage}}'],
                            ['Glas', '{{was}}', '{{Tage}}'],
                            ['Restmüll', '{{was}}', '{{Tage}}'],
                        ],
                    },
                },
            ],
        },
        { id: 'regole', nav: 'Regeln', h: 'Hausregeln', body: [{ list: ['{{Regel}}', '{{Regel}}', '{{Regel}}'] }] },
        {
            id: 'partenza',
            nav: 'Abreise',
            h: 'Abreise und Check-out',
            body: [
                'Check-out bis {{Check-out-Uhrzeit}}.',
                { list: ['{{was vor der Abreise zu tun ist}}', '{{wo die Schlüssel bleiben}}'] },
            ],
        },
        {
            id: 'numeri',
            nav: 'Wichtige Nummern',
            h: 'Wichtige Nummern',
            body: [
                {
                    list: [
                        'Notruf (Rettung, Polizei, Feuerwehr): [112](tel:112)',
                        'Wir: [WhatsApp](https://wa.me/393518085256) · [gestionehtv@gmail.com](mailto:gestionehtv@gmail.com)',
                        'Ärztlicher Dienst für Touristen: {{Adresse und Telefon}}',
                        'Nächste Apotheke: {{Name und Adresse}}',
                    ],
                },
            ],
        },
        {
            id: 'dintorni',
            nav: 'Umgebung',
            h: 'Unsere Tipps in der Umgebung',
            body: [
                {
                    list: [
                        'Strände: {{empfohlene Strände}}',
                        'Einkaufen: {{nächster Supermarkt}}',
                        'Restaurants: {{wo essen}}',
                    ],
                },
            ],
        },
    ],
};

const fr: WelcomeText = {
    meta: {
        title: 'Guide des hôtes | Hidden Treasure Villasimius',
        description: 'Tout ce qu’il faut pendant le séjour : arrivée, la maison, parking, déchets et règles.',
    },
    eyebrow: 'Bienvenue',
    title: 'Le guide de la maison',
    intro:
        'Nous sommes ravis de vous accueillir. Vous trouverez ici tout ce qu’il faut pendant le séjour : gardez cette page sous la main et écrivez-nous pour toute question.',
    contents: 'Dans ce guide',
    sections: [
        {
            id: 'arrivo',
            nav: 'Arrivée',
            h: 'Arrivée et check-in',
            body: [
                'Le check-in est à partir de {{heure check-in}}. Si vous arrivez plus tard, prévenez-nous.',
                'Adresse : {{adresse complète}}. [Itinéraire jusqu’à la maison](DIRECTIONS).',
                '{{comment entrer : qui vous accueille ou où sont les clés}}',
            ],
        },
        {
            id: 'casa',
            nav: 'La maison',
            h: 'Comment fonctionne la maison',
            body: [
                {
                    list: [
                        'Wi-Fi : le nom du réseau et le mot de passe sont dans la maison, {{où}}',
                        'Climatisation : {{allumage, télécommandes}}',
                        'Eau chaude : {{chauffe-eau, délais}}',
                        'Cuisine : {{plaques, four, lave-vaisselle, café}}',
                        'Lave-linge : {{où, lessive}}',
                        'Linge et serviettes : {{ce qui est fourni, changement}}',
                        'Extérieur : {{douche extérieure, jardin, barbecue}}',
                    ],
                },
            ],
        },
        { id: 'parcheggio', nav: 'Parking', h: 'Parking', body: ['{{où se garer, combien de places, portail}}'] },
        {
            id: 'rifiuti',
            nav: 'Déchets',
            h: 'Déchets et tri sélectif',
            body: [
                'Merci de trier vos déchets. {{où sont les poubelles et quand les sortir}}',
                {
                    table: {
                        head: ['Type', 'Ce qui y va', 'Jour de collecte'],
                        rows: [
                            ['Organique', '{{quoi}}', '{{jours}}'],
                            ['Plastique et métal', '{{quoi}}', '{{jours}}'],
                            ['Papier et carton', '{{quoi}}', '{{jours}}'],
                            ['Verre', '{{quoi}}', '{{jours}}'],
                            ['Ordures ménagères', '{{quoi}}', '{{jours}}'],
                        ],
                    },
                },
            ],
        },
        { id: 'regole', nav: 'Règles', h: 'Règles de la maison', body: [{ list: ['{{règle}}', '{{règle}}', '{{règle}}'] }] },
        {
            id: 'partenza',
            nav: 'Départ',
            h: 'Départ et check-out',
            body: [
                'Le check-out est avant {{heure check-out}}.',
                { list: ['{{que faire avant de partir}}', '{{où laisser les clés}}'] },
            ],
        },
        {
            id: 'numeri',
            nav: 'Numéros utiles',
            h: 'Numéros utiles',
            body: [
                {
                    list: [
                        'Urgences (ambulance, police, pompiers) : [112](tel:112)',
                        'Nous : [WhatsApp](https://wa.me/393518085256) · [gestionehtv@gmail.com](mailto:gestionehtv@gmail.com)',
                        'Service médical touristique : {{adresse et téléphone}}',
                        'Pharmacie la plus proche : {{nom et adresse}}',
                    ],
                },
            ],
        },
        {
            id: 'dintorni',
            nav: 'Alentours',
            h: 'Nos conseils aux alentours',
            body: [
                {
                    list: [
                        'Plages : {{plages conseillées}}',
                        'Courses : {{supermarché le plus proche}}',
                        'Restaurants : {{où manger}}',
                    ],
                },
            ],
        },
    ],
};

export const WELCOME_TEXT: Record<Lang, WelcomeText> = { it, en, de, fr };
