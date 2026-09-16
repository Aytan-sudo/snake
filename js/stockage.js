// Préférences, résultats et partie active. localStorage peut être désactivé ou
// plein : dans ce cas un coffre en mémoire garde le jeu fonctionnel jusqu'à la
// fermeture de la page.

const PREFIXE = 'snake.';
const SCHEMA = 1;
const memoire = new Map();
let coffre;

export const PREFERENCES_PAR_DEFAUT = {
    variante: 'classique',
    vitesse: 'normal',
    theme: 'prairie',
    apparence: 'moderne',
    sons: true,
    vibration: true,
    gestes: true,
    main: 'droite'
};

function obtenirCoffre() {
    if (coffre) return coffre;
    // Ouvert depuis le hub avec un passeport, le jeu range tout dans l'espace
    // du joueur ; en mode invité, dans le localStorage, comme avant.
    const passeport = globalThis.Passeport?.stockageJeu('snake');
    if (passeport) { coffre = passeport; return coffre; }
    try {
        const sonde = `${PREFIXE}sonde`;
        globalThis.localStorage.setItem(sonde, '1');
        globalThis.localStorage.removeItem(sonde);
        coffre = globalThis.localStorage;
    } catch {
        coffre = {
            getItem: cle => memoire.get(cle) ?? null,
            setItem: (cle, valeur) => memoire.set(cle, String(valeur)),
            removeItem: cle => memoire.delete(cle)
        };
    }
    return coffre;
}

function lire(cle, defaut) {
    try {
        const brut = obtenirCoffre().getItem(PREFIXE + cle);
        if (!brut) return defaut;
        const enveloppe = JSON.parse(brut);
        return enveloppe?.schema === SCHEMA ? enveloppe.donnees : defaut;
    } catch {
        return defaut;
    }
}

function ecrire(cle, donnees) {
    try {
        obtenirCoffre().setItem(PREFIXE + cle, JSON.stringify({ schema: SCHEMA, donnees }));
    } catch { /* la partie continue sans persistance */ }
}

function oublier(cle) {
    try { obtenirCoffre().removeItem(PREFIXE + cle); } catch { /* rien à retirer */ }
}

export function chargerPreferences() {
    return { ...PREFERENCES_PAR_DEFAUT, ...lire('preferences', {}) };
}

export const enregistrerPreferences = preferences => ecrire('preferences', preferences);
export const chargerRecords = () => lire('records', {});
export const chargerHistorique = () => lire('history', []);

export const cleRecord = (variante, vitesse) => `${variante}|${vitesse}`;

export function recordDe(records, variante, vitesse) {
    return records[cleRecord(variante, vitesse)] ?? {
        meilleurScore: 0,
        longueurMax: 4,
        dureeMaxMs: 0,
        parties: 0,
        fruits: 0
    };
}

export function enregistrerResultat(partie, date = new Date()) {
    const records = chargerRecords();
    const cle = cleRecord(partie.variante, partie.vitesse);
    const ancien = recordDe(records, partie.variante, partie.vitesse);
    const suivant = {
        meilleurScore: Math.max(ancien.meilleurScore, partie.score),
        longueurMax: Math.max(ancien.longueurMax, partie.serpent.length),
        dureeMaxMs: Math.max(ancien.dureeMaxMs, Math.round(partie.dureeMs)),
        parties: ancien.parties + 1,
        fruits: ancien.fruits + partie.score
    };
    records[cle] = suivant;
    ecrire('records', records);

    const historique = chargerHistorique();
    historique.unshift({
        date: date.toISOString(),
        variante: partie.variante,
        vitesse: partie.vitesse,
        score: partie.score,
        longueur: partie.serpent.length,
        dureeMs: Math.round(partie.dureeMs),
        raison: partie.raisonFin
    });
    ecrire('history', historique.slice(0, 10));

    return {
        nouveauRecord: partie.score > ancien.meilleurScore,
        ancienScore: ancien.meilleurScore,
        record: suivant
    };
}

export function effacerResultats() {
    ecrire('records', {});
    ecrire('history', []);
}

export const enregistrerSession = partie => ecrire('session', partie);
export const chargerSession = () => lire('session', null);
export const oublierSession = () => oublier('session');

// ------------------------------------------------------------- le passeport
//
// Les fruits mangés dans la journée, pour le tampon à l'effort. Le compte ne
// vit que dans l'espace d'un joueur : en mode invité, rien n'est compté ni
// écrit, et le stockage du jeu reste ce qu'il était avant le raccordement.

export function compterFruitPasseport(jour, espace = globalThis.Passeport?.stockageJeu('snake') ?? null) {
    if (!espace) return null;
    let compte = null;
    try { compte = JSON.parse(espace.getItem('snake.passeport')); } catch { /* illisible : on repart */ }
    const fruits = compte?.jour === jour && Number.isInteger(compte.fruits) ? compte.fruits + 1 : 1;
    try { espace.setItem('snake.passeport', JSON.stringify({ jour, fruits })); } catch { /* le passeport signale l'échec */ }
    return fruits;
}
