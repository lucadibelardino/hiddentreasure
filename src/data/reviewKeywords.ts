/* Parole chiave del filtro nella pagina Recensioni.
   Ogni voce ha un'etichetta e una lista di "radici": una recensione
   corrisponde se contiene una parola che inizia con una delle radici
   (es. "spiagg" trova spiaggia, spiagge). Le maiuscole non contano.
   Una radice e' un pezzo di espressione regolare: "auto(?!\p{L})"
   trova solo la parola intera "auto" e non "automatico".
   Per aggiungere un filtro basta aggiungere una voce qui sotto. */

export interface ReviewKeyword {
    id: string;
    label: string;
    stems: string[];
}

const keywords: ReviewKeyword[] = [
    { id: 'spiaggia', label: 'Spiaggia', stems: ['spiagg', 'insenatur', 'baia', 'baie', 'scoglier'] },
    { id: 'mare', label: 'Mare', stems: ['mare', 'snorkeling', 'kayak'] },
    { id: 'tramonto', label: 'Tramonto', stems: ['tramont'] },
    { id: 'terrazza', label: 'Terrazza', stems: ['terrazz', 'tetto'] },
    { id: 'tranquillita', label: 'Tranquillità', stems: ['tranquill', 'rilass', 'relax', 'seren', 'staccare la spina'] },
    { id: 'famiglia', label: 'Famiglia e bambini', stems: ['famigli', 'bambin', 'figli', 'neonato'] },
    { id: 'cucina', label: 'Cucina', stems: ['cucin', 'lavastoviglie', 'frigorifer'] },
    { id: 'accoglienza', label: 'Accoglienza', stems: ['maria lucia', 'host', 'accoglien', 'gentil', 'cordial', 'disponibil'] },
    { id: 'auto', label: 'Auto e dintorni', stems: ['auto(?!\\p{L})', 'macchina', 'bicicletta', 'villaggio', 'centro'] }
];

export default keywords;
