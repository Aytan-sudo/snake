export const VERSION = '1.0.0';
export const VERSION_SCHEMA = 1;
export const TAILLE_GRILLE = 20;
export const DUREE_SPRINT_MS = 90_000;

export const VITESSES = [
    {
        id: 'detente',
        libelle: 'Détente',
        resume: 'Départ tranquille et accélération douce.',
        departMs: 190,
        minimumMs: 105,
        baisseMs: 8,
        tousLes: 4
    },
    {
        id: 'normal',
        libelle: 'Normal',
        resume: 'Le rythme classique, accessible puis nerveux.',
        departMs: 145,
        minimumMs: 75,
        baisseMs: 7,
        tousLes: 4
    },
    {
        id: 'rapide',
        libelle: 'Rapide',
        resume: 'Vif dès le départ, pour les réflexes affûtés.',
        departMs: 105,
        minimumMs: 55,
        baisseMs: 5,
        tousLes: 4
    }
];

export const vitesseDe = id => VITESSES.find(vitesse => vitesse.id === id) ?? VITESSES[1];

export function delaiPour(vitesse, score) {
    const reglage = vitesseDe(vitesse);
    const paliers = Math.floor(Math.max(0, score) / reglage.tousLes);
    return Math.max(reglage.minimumMs, reglage.departMs - paliers * reglage.baisseMs);
}
