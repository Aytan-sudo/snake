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
