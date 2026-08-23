import { compteur } from './harness.mjs';
import { directionDepuisGeste, seuilGestePour } from '../js/entree.js';

const { check, rapport } = compteur();
console.log('\nEntrées tactiles\n');

check('le seuil reste court sur un petit téléphone', Math.abs(seuilGestePour(320) - 11.2) < Number.EPSILON * 16);
check('le seuil est borné sur un grand écran', seuilGestePour(900) === 16);
check('un mouvement trop court ne tourne pas', directionDepuisGeste(8, 2, 10) === null);
check('le mouvement horizontal dominant va à droite', directionDepuisGeste(14, 5, 10) === 'droite');
check('le mouvement horizontal négatif va à gauche', directionDepuisGeste(-14, 5, 10) === 'gauche');
check('le mouvement vertical dominant monte', directionDepuisGeste(4, -13, 10) === 'haut');
check('le mouvement vertical positif descend', directionDepuisGeste(4, 13, 10) === 'bas');

rapport();
