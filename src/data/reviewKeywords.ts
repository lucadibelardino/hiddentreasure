/* Parole chiave del filtro nella pagina Recensioni.
   Ogni voce ha un'etichetta e una lista di "radici": una recensione
   corrisponde se contiene una parola che inizia con una delle radici
   (es. "spiagg" trova spiaggia, spiagge). Le maiuscole non contano.
   Una radice e' un pezzo di espressione regolare: "auto(?!\p{L})"
   trova solo la parola intera "auto" e non "automatico".
   Per aggiungere un filtro basta aggiungere una voce qui sotto. */

export interface ReviewKeyword {
    id: string;
    icon: string;
    label: string;
    stems: string[];
}

const keywords: ReviewKeyword[] = [
    { id: 'spiaggia', icon: '🏝️', label: 'Spiaggia', stems: ['spiagg', 'insenatur', 'baia', 'baie', 'scoglier'] },
    { id: 'vista', icon: '🖼️', label: 'Vista', stems: ['vista', 'panoram', 'affacci', 'mozzafiato'] },
    { id: 'posizione', icon: '📍', label: 'Posizione', stems: ['posizion', 'situat', 'a pochi passi', 'direttamente sul mare'] },
    { id: 'ospitalita', icon: '🎁', label: 'Ospitalità', stems: ['ospital', 'accoglien', 'maria lucia', 'host', 'gentil', 'cordial', 'disponibil'] },
    { id: 'famiglia', icon: '🧸', label: 'Famiglia', stems: ['famigli', 'bambin', 'figli', 'neonato'] },
    { id: 'muoversi', icon: '🚌', label: 'Muoversi in zona', stems: ['auto(?!\\p{L})', 'macchina', 'bicicletta', 'in bici'] },
    { id: 'cucina', icon: '🍴', label: 'Cucina', stems: ['cucin', 'lavastoviglie', 'frigorifer', 'fornell'] },
    { id: 'checkin', icon: '🔑', label: 'Check-in', stems: ['check-?(?:in|out)', 'istruzion'] },
    { id: 'vicinanze', icon: '🗺️', label: 'Nelle vicinanze', stems: ['villaggio', 'paese', 'spesa', 'shopping', 'ristorant', 'porto giunco', 'simius', 'campulongu', 'dintorni', 'baie vicine'] },
    { id: 'comfort', icon: '🛋️', label: 'Comfort', stems: ['comfort', 'confortevol', 'comod', 'condizionat', 'ventilator', 'lavatrice', 'materass', 'doccia'] },
    { id: 'mare', icon: '🌊', label: 'Mare', stems: ['mare', 'snorkeling', 'kayak'] },
    { id: 'tramonto', icon: '🌅', label: 'Tramonto', stems: ['tramont'] },
    { id: 'terrazza', icon: '☀️', label: 'Terrazza', stems: ['terrazz', 'tetto'] },
    { id: 'tranquillita', icon: '🍃', label: 'Tranquillità', stems: ['tranquill', 'rilass', 'relax', 'seren', 'staccare la spina'] }
];

export default keywords;
