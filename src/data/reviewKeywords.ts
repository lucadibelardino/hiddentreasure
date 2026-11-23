/* Parole chiave del filtro nella pagina Recensioni.
   Ogni voce ha un'etichetta e una lista di "radici" per ogni lingua del sito:
   una recensione corrisponde se contiene una parola che inizia con una delle
   radici (es. "spiagg" trova spiaggia, spiagge). Le maiuscole non contano.
   Una radice e' un pezzo di espressione regolare: "auto(?!\p{L})"
   trova solo la parola intera "auto" e non "automatico".
   Le radici inglesi, tedesche e francesi cercano nelle traduzioni
   delle recensioni (campo i18n di src/data/reviews.json).
   Per aggiungere un filtro basta aggiungere una voce qui sotto. */
import type { Lang } from '../i18n/langs';

export interface ReviewKeyword {
    id: string;
    label: Record<Lang, string>;
    stems: Record<Lang, string[]>;
}

const keywords: ReviewKeyword[] = [
    {
        id: 'spiaggia',
        label: { it: 'Spiaggia', en: 'Beach', de: 'Strand', fr: 'Plage' },
        stems: {
            it: ['spiagg', 'insenatur', 'baia', 'baie', 'scoglier'],
            en: ['beach', 'cove', 'bay', 'bays', 'cliff'],
            de: ['strand', 'sandstrand', 'privatstrand', 'bucht', 'felsen'],
            fr: ['plage', 'crique', 'baie', 'rocher'],
        },
    },
    {
        id: 'vista',
        label: { it: 'Vista', en: 'View', de: 'Ausblick', fr: 'Vue' },
        stems: {
            it: ['vista', 'panoram', 'affacci', 'mozzafiato'],
            en: ['view', 'panoram', 'breathtaking', 'looking straight out', 'looks out'],
            de: ['blick', 'meerblick', 'aussicht', 'panoram', 'atemberaubend'],
            fr: ['vue', 'panoram', 'à couper le souffle', 'donne sur', 'tournée vers la mer'],
        },
    },
    {
        id: 'posizione',
        label: { it: 'Posizione', en: 'Location', de: 'Lage', fr: 'Emplacement' },
        stems: {
            it: ['posizion', 'situat', 'a pochi passi', 'direttamente sul mare'],
            en: ['location', 'a few steps', 'right on the (?:sea|beach)', 'right in front'],
            de: ['lage', 'liegt direkt', 'wenige schritte', 'direkt am (?:meer|strand)', 'direkt vor dem'],
            fr: ['emplacement', 'situé', 'à quelques pas', 'directement sur (?:la mer|la plage)', 'juste devant'],
        },
    },
    {
        id: 'ospitalita',
        label: { it: 'Ospitalità', en: 'Hospitality', de: 'Gastfreundschaft', fr: 'Accueil' },
        stems: {
            it: ['ospital', 'accoglien', 'maria lucia', 'host', 'gentil', 'cordial', 'disponibil'],
            en: ['hospitality', 'host', 'maria lucia', 'kind', 'friendly', 'helpful', 'welcom'],
            de: ['gastfreundschaft', 'gastgeber', 'maria lucia', 'freundlich', 'herzlich', 'hilfsbereit'],
            fr: ['hospitalité', 'hôte', 'accueil', 'maria lucia', 'gentil', 'chaleureu', 'disponible'],
        },
    },
    {
        id: 'famiglia',
        label: { it: 'Famiglia', en: 'Family', de: 'Familie', fr: 'Famille' },
        stems: {
            it: ['famigli', 'bambin', 'figli', 'neonato'],
            en: ['famil', 'child', 'kids', 'newborn', 'baby'],
            de: ['famili', 'kinder', 'kind(?!\\p{L})', 'neugeboren'],
            fr: ['famill', 'enfant', 'nouveau-né'],
        },
    },
    {
        id: 'muoversi',
        label: { it: 'Muoversi in zona', en: 'Getting around', de: 'Unterwegs vor Ort', fr: 'Se déplacer' },
        stems: {
            it: ['auto(?!\\p{L})', 'macchina', 'bicicletta', 'in bici'],
            en: ['car(?!\\p{L})', 'drive', 'by bike', 'bikes'],
            de: ['auto(?!\\p{L})', 'autominuten', 'fahrrad'],
            fr: ['voiture', 'vélo'],
        },
    },
    {
        id: 'cucina',
        label: { it: 'Cucina', en: 'Kitchen', de: 'Küche', fr: 'Cuisine' },
        stems: {
            it: ['cucin', 'lavastoviglie', 'frigorifer', 'fornell'],
            en: ['kitchen', 'cooking', 'dishwasher', 'fridge', 'hob'],
            de: ['küche', 'außenküche', 'kochen', 'geschirrspüler', 'kühlschrank', 'kühl-gefrierschrank', 'gasherd'],
            fr: ['cuisin', 'lave-vaisselle', 'réfrigérateur', 'frigo'],
        },
    },
    {
        id: 'checkin',
        label: { it: 'Check-in', en: 'Check-in', de: 'Check-in', fr: 'Arrivée' },
        stems: {
            it: ['check-?(?:in|out)', 'istruzion'],
            en: ['check-?(?:in|out)', 'instructions', 'directions'],
            de: ['check-?(?:in|out)', 'hinweise', 'wie wir hinkommen'],
            fr: ['arrivée', 'départ', 'instructions', 'indications'],
        },
    },
    {
        id: 'vicinanze',
        label: { it: 'Nelle vicinanze', en: 'Nearby', de: 'In der Nähe', fr: 'Aux alentours' },
        stems: {
            it: ['villaggio', 'paese', 'spesa', 'shopping', 'ristorant', 'porto giunco', 'simius', 'campulongu', 'dintorni', 'baie vicine'],
            en: ['village', 'shopping', 'shops', 'restaurant', 'porto giunco', 'simius', 'campulongu', 'surroundings', 'nearby bays', 'the area'],
            de: ['ort(?!\\p{L})', 'ortszentrum', 'einkauf', 'restaurant', 'porto giunco', 'simius', 'campulongu', 'umgebung', 'nahen buchten'],
            fr: ['village', 'courses', 'commerces', 'restaurant', 'porto giunco', 'simius', 'campulongu', 'environs', 'criques voisines', 'la région'],
        },
    },
    {
        id: 'comfort',
        label: { it: 'Comfort', en: 'Comfort', de: 'Komfort', fr: 'Confort' },
        stems: {
            it: ['comfort', 'confortevol', 'comod', 'condizionat', 'ventilator', 'lavatrice', 'materass', 'doccia'],
            en: ['comfort', 'air condition', 'air conditioners', 'fan(?!\\p{L})', 'washing machine', 'mattress', 'shower'],
            de: ['komfort', 'gemütlich', 'klimaanlage', 'deckenventilator', 'waschmaschine', 'matratze', 'außendusche', 'dusche', 'duschen'],
            fr: ['confort', 'climatis', 'ventilateur', 'lave-linge', 'matelas', 'douche', 'doucher'],
        },
    },
    {
        id: 'mare',
        label: { it: 'Mare', en: 'Sea', de: 'Meer', fr: 'Mer' },
        stems: {
            it: ['mare', 'snorkeling', 'kayak'],
            en: ['sea(?!\\p{L})', 'snorkel', 'kayak'],
            de: ['meer', 'schnorchel', 'kajak'],
            fr: ['mer(?!\\p{L})', 'snorkeling', 'kayak'],
        },
    },
    {
        id: 'tramonto',
        label: { it: 'Tramonto', en: 'Sunset', de: 'Sonnenuntergang', fr: 'Coucher de soleil' },
        stems: {
            it: ['tramont'],
            en: ['sunset'],
            de: ['sonnenuntergang', 'sonnenuntergänge'],
            fr: ['coucher(?:s)? d[ue] soleil'],
        },
    },
    {
        id: 'terrazza',
        label: { it: 'Terrazza', en: 'Terrace', de: 'Terrasse', fr: 'Terrasse' },
        stems: {
            it: ['terrazz', 'tetto'],
            en: ['terrace', 'roof'],
            de: ['terrasse', 'dachterrasse', 'dach(?!\\p{L})'],
            fr: ['terrasse', 'toit'],
        },
    },
    {
        id: 'tranquillita',
        label: { it: 'Tranquillità', en: 'Peace and quiet', de: 'Ruhe', fr: 'Tranquillité' },
        stems: {
            it: ['tranquill', 'rilass', 'relax', 'seren', 'staccare la spina'],
            en: ['peace', 'quiet', 'relax', 'calm', 'switch off'],
            de: ['ruhe', 'ruhig', 'erholsam', 'entspann', 'abzuschalten'],
            fr: ['tranquill', 'calme', 'paisible', 'détend', 'reposant', 'déconnecter', 'serein'],
        },
    },
];

export default keywords;
