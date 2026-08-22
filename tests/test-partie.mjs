import { compteur } from './harness.mjs';
import {
    avancerTemps, casesAtteignables, creerPartie, delaiActuel, demarrer,
    enfilerDirection, jouerUnPas, restaurerPartie
} from '../js/partie.js';
import { VARIANTES } from '../js/variantes.js';

const { check, egal, rapport } = compteur();
console.log('\nPartie et variantes\n');

const a = creerPartie({ variante: 'classique', vitesse: 'normal', graine: 12345 });
const b = creerPartie({ variante: 'classique', vitesse: 'normal', graine: 12345 });
egal('une même graine crée la même partie', a, b);
check('le serpent commence avec quatre segments', a.serpent.length === 4);
check('la nourriture ne naît pas sous le serpent', !a.serpent.some(segment => segment.x === a.nourriture.x && segment.y === a.nourriture.y));

const variantesCreees = VARIANTES.map(variante => creerPartie({ variante: variante.id, graine: 80 }));
check('les cinq variantes peuvent être créées', variantesCreees.length === 5 && variantesCreees.every(partie => partie.nourriture));

const obstacles = creerPartie({ variante: 'obstacles', graine: 4242 });
check('le mode Obstacles démarre avec dix rochers', obstacles.obstacles.length === 10);
check('les rochers ne coupent pas la grille', casesAtteignables(obstacles).size === 390);

const portails = creerPartie({ variante: 'portails', graine: 99 });
check('le mode Portails crée une paire', portails.portails.length === 2);
check('les portails sont éloignés', Math.abs(portails.portails[0].x - portails.portails[1].x) + Math.abs(portails.portails[0].y - portails.portails[1].y) >= 8);

let file = creerPartie({ graine: 2 });
file = enfilerDirection(file, 'gauche');
check('le demi-tour direct est refusé', file.fileDirections.length === 0);
file = enfilerDirection(file, 'haut');
file = enfilerDirection(file, 'gauche');
file = enfilerDirection(file, 'bas');
egal('deux virages rapides sont conservés, pas davantage', file.fileDirections, ['haut', 'gauche']);

let repas = creerPartie({ graine: 3 });
repas.nourriture = { x: repas.serpent[0].x + 1, y: repas.serpent[0].y };
repas = demarrer(repas);
const mange = jouerUnPas(repas);
check('manger augmente le score', mange.etat.score === 1);
check('manger augmente la longueur', mange.etat.serpent.length === 5);
check('l’événement fruit est rendu', mange.evenements.some(evenement => evenement.type === 'mange'));

let ajout = creerPartie({ variante: 'obstacles', graine: 12 });
const nombreAvant = ajout.obstacles.length;
ajout.score = 3;
ajout.nourriture = { x: ajout.serpent[0].x + 1, y: ajout.serpent[0].y };
ajout = demarrer(ajout);
const avecNouveauRocher = jouerUnPas(ajout);
check('un rocher arrive au quatrième fruit', avecNouveauRocher.etat.obstacles.length === nombreAvant + 1);
check('la grille reste connexe après l’ajout', casesAtteignables(avecNouveauRocher.etat).size === 389);

let passage = creerPartie({ variante: 'portails', graine: 17 });
passage.portails = [{ x: passage.serpent[0].x + 1, y: passage.serpent[0].y }, { x: 16, y: 16 }];
passage.usagesPortail = 2;
passage.nourriture = { x: 2, y: 2 };
passage = demarrer(passage);
const relocalises = jouerUnPas(passage);
check('le troisième passage déplace les portails', relocalises.evenements.some(evenement => evenement.type === 'portails-deplaces'));
check('les nouveaux portails évitent le serpent', relocalises.etat.portails.every(portail => !relocalises.etat.serpent.some(segment => segment.x === portail.x && segment.y === portail.y)));

let sprint = demarrer(creerPartie({ variante: 'sprint', graine: 5 }));
sprint = avancerTemps(sprint, 89_999).etat;
check('le sprint joue encore avant 90 secondes', sprint.statut === 'en-cours' && sprint.restantMs === 1);
const tempsFini = avancerTemps(sprint, 1);
check('le sprint finit exactement à 90 secondes', tempsFini.etat.statut === 'terminee' && tempsFini.etat.raisonFin === 'temps');

let enCours = demarrer(creerPartie({ graine: 28 }));
const restauree = restaurerPartie(JSON.parse(JSON.stringify(enCours)));
check('une partie active revient en pause', restauree?.statut === 'pause');
check('un ancien schéma est refusé', restaurerPartie({ ...enCours, schema: 0 }) === null);
check('une direction invalide est refusée', restaurerPartie({ ...enCours, direction: 'diagonale' }) === null);

const lente = creerPartie({ vitesse: 'normal' });
const acceleree = { ...lente, score: 20 };
check('la vitesse augmente avec le score', delaiActuel(acceleree) < delaiActuel(lente));
check('les trois vitesses sont réellement distinctes', new Set(['detente', 'normal', 'rapide'].map(vitesse => delaiActuel(creerPartie({ vitesse })))).size === 3);

rapport();
