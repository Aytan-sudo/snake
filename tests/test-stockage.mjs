import { compteur } from './harness.mjs';

const memoire = new Map();
globalThis.localStorage = {
    getItem: cle => memoire.get(cle) ?? null,
    setItem: (cle, valeur) => memoire.set(cle, String(valeur)),
    removeItem: cle => memoire.delete(cle)
};

const {
    PREFERENCES_PAR_DEFAUT, chargerHistorique, chargerPreferences, chargerRecords,
    chargerSession, cleRecord, effacerResultats, enregistrerPreferences,
    enregistrerResultat, enregistrerSession, oublierSession, recordDe
} = await import('../js/stockage.js');

const { check, rapport } = compteur();
console.log('\nStockage\n');

check('les préférences par défaut sont disponibles', chargerPreferences().theme === 'prairie');
enregistrerPreferences({ variante: 'portails', sons: false });
const partielles = chargerPreferences();
check('les préférences se relisent', partielles.variante === 'portails' && partielles.sons === false);
check('une préférence absente garde sa valeur par défaut', partielles.vibration === PREFERENCES_PAR_DEFAUT.vibration);

const partie = {
    variante: 'classique', vitesse: 'normal', score: 8,
    serpent: Array.from({ length: 12 }, (_, x) => ({ x, y: 0 })),
    dureeMs: 42_000, raisonFin: 'mur'
};
const premier = enregistrerResultat(partie, new Date('2026-08-22T10:00:00Z'));
check('le premier résultat est un record', premier.nouveauRecord && premier.ancienScore === 0);
enregistrerResultat({ ...partie, score: 5, serpent: partie.serpent.slice(0, 9), dureeMs: 50_000 });
const record = recordDe(chargerRecords(), 'classique', 'normal');
check('un score inférieur ne baisse pas le record', record.meilleurScore === 8);
check('la durée maximale progresse séparément', record.dureeMaxMs === 50_000);
check('les parties et les fruits s’additionnent', record.parties === 2 && record.fruits === 13);

enregistrerResultat({ ...partie, variante: 'sans-murs', score: 20 });
check('les variantes ont des records séparés', recordDe(chargerRecords(), 'sans-murs', 'normal').meilleurScore === 20);
check('la clé de record contient mode et vitesse', cleRecord('sprint', 'rapide') === 'sprint|rapide');

for (let i = 0; i < 12; i++) enregistrerResultat({ ...partie, score: i });
check('l’historique est limité aux dix dernières parties', chargerHistorique().length === 10);

enregistrerSession({ schema: 1, score: 4 });
check('la session se relit', chargerSession().score === 4);
oublierSession();
check('la session peut être oubliée', chargerSession() === null);

memoire.set('snake.preferences', '{cassé');
check('un stockage corrompu retombe sur les défauts', chargerPreferences().theme === 'prairie');

effacerResultats();
check('effacer vide records et historique', Object.keys(chargerRecords()).length === 0 && chargerHistorique().length === 0);

rapport();
