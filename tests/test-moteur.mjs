import { compteur } from './harness.mjs';
import { deplacer, enrouler, sontOpposees } from '../js/moteur.js';

const { check, egal, rapport } = compteur();
console.log('\nMoteur\n');

const base = {
    serpent: [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 3 }],
    taille: 8,
    nourriture: { x: 7, y: 7 },
    obstacles: [],
    portails: [],
    enroule: false
};

const droite = deplacer({ ...base, direction: 'droite' });
check('un pas avance la tête', droite.tete.x === 3 && droite.tete.y === 2);
check('un pas conserve la longueur', droite.serpent.length === 4);
check('la queue quitte son ancienne case', !droite.serpent.some(caseGrille => caseGrille.x === 2 && caseGrille.y === 3));

const repas = deplacer({ ...base, direction: 'droite', nourriture: { x: 3, y: 2 } });
check('une pomme est reconnue', repas.mange === true);
check('manger fait grandir', repas.serpent.length === 5);

const mur = deplacer({ ...base, serpent: [{ x: 7, y: 2 }, { x: 6, y: 2 }, { x: 5, y: 2 }, { x: 4, y: 2 }], direction: 'droite' });
check('le mur tue en classique', mur.mort && mur.raison === 'mur');

const traverse = deplacer({ ...base, serpent: [{ x: 7, y: 2 }, { x: 6, y: 2 }, { x: 5, y: 2 }, { x: 4, y: 2 }], direction: 'droite', enroule: true });
egal('le bord opposé reçoit la tête', traverse.tete, { x: 0, y: 2 });
egal('enrouler gère aussi les coordonnées négatives', enrouler({ x: -1, y: -1 }, 8), { x: 7, y: 7 });

const corps = deplacer({ ...base, direction: 'gauche' });
check('entrer dans le corps tue', corps.mort && corps.raison === 'corps');
const queue = deplacer({ ...base, direction: 'bas' });
check('la case libérée par la queue est autorisée', queue.mort === false && queue.tete.x === 2 && queue.tete.y === 3);

const rocher = deplacer({ ...base, direction: 'droite', obstacles: [{ x: 3, y: 2 }] });
check('un obstacle tue', rocher.mort && rocher.raison === 'obstacle');

const portail = deplacer({
    ...base,
    direction: 'droite',
    portails: [{ x: 3, y: 2 }, { x: 6, y: 6 }]
});
check('entrer dans un portail est signalé', portail.portail === true);
egal('la tête ressort par l’autre portail', portail.tete, { x: 6, y: 6 });

check('haut et bas sont opposés', sontOpposees('haut', 'bas'));
check('haut et gauche ne le sont pas', !sontOpposees('haut', 'gauche'));

rapport();
