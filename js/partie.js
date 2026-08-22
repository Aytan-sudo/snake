import { TAILLE_GRILLE, VERSION_SCHEMA, delaiPour, vitesseDe } from './config.js';
import { entier, graineAleatoire, normaliserGraine } from './hasard.js';
import { DIRECTIONS, cleCase, deplacer, directionConnue, memeCase, sontOpposees } from './moteur.js';
import { IDS_VARIANTES, varianteDe } from './variantes.js';

const STATUTS = new Set(['pret', 'en-cours', 'pause', 'terminee']);
const DIRECTIONS_CONNNUES = new Set(Object.keys(DIRECTIONS));
const OBSTACLES_INITIAUX = 10;
const OBSTACLE_TOUS_LES = 4;
const OBSTACLES_MAX = 48;
const PORTAIL_USAGES = 3;

const copierCases = cases => cases.map(caseGrille => ({ ...caseGrille }));

export function copierEtat(etat) {
    return {
        ...etat,
        serpent: copierCases(etat.serpent),
        nourriture: etat.nourriture ? { ...etat.nourriture } : null,
        obstacles: copierCases(etat.obstacles),
        portails: copierCases(etat.portails),
        fileDirections: [...etat.fileDirections]
    };
}

function casesLibres(etat, filtre = () => true) {
    const occupees = new Set([
        ...etat.serpent.map(cleCase),
        ...etat.obstacles.map(cleCase),
        ...etat.portails.map(cleCase),
        ...(etat.nourriture ? [cleCase(etat.nourriture)] : [])
    ]);
    const libres = [];
    for (let y = 0; y < etat.taille; y++) {
        for (let x = 0; x < etat.taille; x++) {
            const position = { x, y };
            if (!occupees.has(cleCase(position)) && filtre(position)) libres.push(position);
        }
    }
    return libres;
}

function choisir(etat, candidates) {
    if (candidates.length === 0) return null;
    const tirage = entier(etat.hasard, candidates.length);
    etat.hasard = tirage.etat;
    return { ...candidates[tirage.valeur] };
}

function plateauResteConnexe(etat, obstacleAjoute) {
    const interdits = new Set([...etat.obstacles, obstacleAjoute].map(cleCase));
    const depart = etat.serpent[0];
    const aVoir = [depart];
    const vus = new Set([cleCase(depart)]);

    while (aVoir.length) {
        const courante = aVoir.pop();
        for (const pas of Object.values(DIRECTIONS)) {
            const voisine = { x: courante.x + pas.dx, y: courante.y + pas.dy };
            const cle = cleCase(voisine);
            if (voisine.x < 0 || voisine.y < 0 || voisine.x >= etat.taille || voisine.y >= etat.taille) continue;
            if (interdits.has(cle) || vus.has(cle)) continue;
            vus.add(cle);
            aVoir.push(voisine);
        }
    }

    return vus.size === etat.taille * etat.taille - interdits.size;
}

function ajouterObstacle(etat) {
    if (etat.obstacles.length >= OBSTACLES_MAX) return false;
    const tete = etat.serpent[0];
    const candidates = casesLibres(etat, position =>
        Math.abs(position.x - tete.x) + Math.abs(position.y - tete.y) > 3
        && plateauResteConnexe(etat, position));
    const obstacle = choisir(etat, candidates);
    if (!obstacle) return false;
    etat.obstacles.push(obstacle);
    return true;
}

function placerPortails(etat) {
    etat.portails = [];
    const tete = etat.serpent[0];
    const premier = choisir(etat, casesLibres(etat, position =>
        Math.abs(position.x - tete.x) + Math.abs(position.y - tete.y) > 3));
    if (!premier) return false;
    etat.portails.push(premier);

    let candidats = casesLibres(etat, position =>
        Math.abs(position.x - premier.x) + Math.abs(position.y - premier.y) >= 8);
    if (candidats.length === 0) candidats = casesLibres(etat);
    const second = choisir(etat, candidats);
    if (!second) {
        etat.portails = [];
        return false;
    }
    etat.portails.push(second);
    etat.usagesPortail = 0;
    return true;
}

function placerNourriture(etat) {
    const nourriture = choisir(etat, casesLibres(etat));
    etat.nourriture = nourriture;
    if (!nourriture) {
        etat.statut = 'terminee';
        etat.raisonFin = 'grille-remplie';
    }
    return nourriture;
}

export function creerPartie({ variante = 'classique', vitesse = 'normal', graine = graineAleatoire() } = {}) {
    const regles = varianteDe(variante);
    const milieu = Math.floor(TAILLE_GRILLE / 2);
    const etat = {
        schema: VERSION_SCHEMA,
        taille: TAILLE_GRILLE,
        variante: regles.id,
        vitesse: vitesseDe(vitesse).id,
        serpent: [0, 1, 2, 3].map(decalage => ({ x: milieu - decalage, y: milieu })),
        direction: 'droite',
        fileDirections: [],
        nourriture: null,
        obstacles: [],
        portails: [],
        usagesPortail: 0,
        score: 0,
        pas: 0,
        dureeMs: 0,
        restantMs: regles.dureeMs,
        hasard: normaliserGraine(graine),
        statut: 'pret',
        raisonFin: null
    };

    if (regles.obstacles) {
        for (let i = 0; i < OBSTACLES_INITIAUX; i++) ajouterObstacle(etat);
    }
    if (regles.portails) placerPortails(etat);
    placerNourriture(etat);
    return etat;
}

export function enfilerDirection(etat, direction) {
    if (!directionConnue(direction) || etat.statut === 'terminee') return etat;
    const suivant = copierEtat(etat);
    const reference = suivant.fileDirections.at(-1) ?? suivant.direction;
    if (direction === reference || sontOpposees(reference, direction)) return suivant;
    if (suivant.fileDirections.length < 2) suivant.fileDirections.push(direction);
    return suivant;
}

export function demarrer(etat) {
    if (etat.statut !== 'pret') return etat;
    return { ...copierEtat(etat), statut: 'en-cours' };
}

export function mettreEnPause(etat) {
    if (etat.statut !== 'en-cours') return etat;
    return { ...copierEtat(etat), statut: 'pause' };
}

export function reprendre(etat) {
    if (etat.statut !== 'pause') return etat;
    return { ...copierEtat(etat), statut: 'en-cours' };
}

export const delaiActuel = etat => delaiPour(etat.vitesse, etat.score);

export function jouerUnPas(etat) {
    if (etat.statut !== 'en-cours') return { etat, evenements: [] };
    const suivant = copierEtat(etat);
    if (suivant.fileDirections.length) suivant.direction = suivant.fileDirections.shift();
    const variante = varianteDe(suivant.variante);
    const mouvement = deplacer({
        serpent: suivant.serpent,
        direction: suivant.direction,
        taille: suivant.taille,
        nourriture: suivant.nourriture,
        obstacles: suivant.obstacles,
        portails: suivant.portails,
        enroule: variante.enroule
    });
    const evenements = [];

    if (mouvement.mort) {
        suivant.statut = 'terminee';
        suivant.raisonFin = mouvement.raison;
        evenements.push({ type: 'fin', raison: mouvement.raison });
        return { etat: suivant, evenements };
    }

    suivant.serpent = mouvement.serpent;
    suivant.pas++;
    if (mouvement.portail) {
        suivant.usagesPortail++;
        evenements.push({ type: 'portail' });
    }

    if (mouvement.mange) {
        suivant.score++;
        suivant.nourriture = null;
        evenements.push({ type: 'mange', score: suivant.score });
        if (variante.obstacles && suivant.score % OBSTACLE_TOUS_LES === 0 && ajouterObstacle(suivant)) {
            evenements.push({ type: 'obstacle' });
        }
    }

    if (variante.portails && suivant.usagesPortail >= PORTAIL_USAGES && placerPortails(suivant)) {
        evenements.push({ type: 'portails-deplaces' });
    }

    if (mouvement.mange) placerNourriture(suivant);
    if (suivant.statut === 'terminee') evenements.push({ type: 'fin', raison: suivant.raisonFin });
    return { etat: suivant, evenements };
}

export function avancerTemps(etat, deltaMs) {
    if (etat.statut !== 'en-cours' || !Number.isFinite(deltaMs) || deltaMs <= 0) {
        return { etat, evenements: [] };
    }
    const suivant = copierEtat(etat);
    suivant.dureeMs += deltaMs;
    const variante = varianteDe(suivant.variante);
    if (variante.dureeMs !== null) {
        suivant.restantMs = Math.max(0, variante.dureeMs - suivant.dureeMs);
        if (suivant.restantMs === 0) {
            suivant.statut = 'terminee';
            suivant.raisonFin = 'temps';
            return { etat: suivant, evenements: [{ type: 'fin', raison: 'temps' }] };
        }
    }
    return { etat: suivant, evenements: [] };
}

function caseValide(position, taille) {
    return position && Number.isInteger(position.x) && Number.isInteger(position.y)
        && position.x >= 0 && position.y >= 0 && position.x < taille && position.y < taille;
}

export function restaurerPartie(donnees) {
    if (!donnees || donnees.schema !== VERSION_SCHEMA || donnees.taille !== TAILLE_GRILLE) return null;
    if (!IDS_VARIANTES.includes(donnees.variante) || vitesseDe(donnees.vitesse).id !== donnees.vitesse) return null;
    if (!STATUTS.has(donnees.statut) || !DIRECTIONS_CONNNUES.has(donnees.direction)) return null;
    if (!Array.isArray(donnees.serpent) || donnees.serpent.length < 4
        || !donnees.serpent.every(position => caseValide(position, donnees.taille))) return null;
    if (!donnees.nourriture || !caseValide(donnees.nourriture, donnees.taille)) return null;
    if (!Array.isArray(donnees.obstacles) || !donnees.obstacles.every(position => caseValide(position, donnees.taille))) return null;
    if (!Array.isArray(donnees.portails) || !donnees.portails.every(position => caseValide(position, donnees.taille))) return null;
    if (!Number.isFinite(donnees.score) || donnees.score < 0 || !Number.isFinite(donnees.dureeMs)) return null;
    const restauree = copierEtat({
        ...donnees,
        fileDirections: Array.isArray(donnees.fileDirections)
            ? donnees.fileDirections.filter(direction => DIRECTIONS_CONNNUES.has(direction)).slice(0, 2)
            : []
    });
    if (restauree.statut === 'en-cours') restauree.statut = 'pause';
    return restauree;
}

export function casesAtteignables(etat) {
    const interdits = new Set(etat.obstacles.map(cleCase));
    const depart = etat.serpent[0];
    const vus = new Set([cleCase(depart)]);
    const aVoir = [depart];
    while (aVoir.length) {
        const courante = aVoir.pop();
        for (const pas of Object.values(DIRECTIONS)) {
            const position = { x: courante.x + pas.dx, y: courante.y + pas.dy };
            if (position.x < 0 || position.y < 0 || position.x >= etat.taille || position.y >= etat.taille) continue;
            const cle = cleCase(position);
            if (interdits.has(cle) || vus.has(cle)) continue;
            vus.add(cle);
            aVoir.push(position);
        }
    }
    return vus;
}

export const positionOccupee = (etat, position) =>
    etat.serpent.some(segment => memeCase(segment, position))
    || etat.obstacles.some(obstacle => memeCase(obstacle, position))
    || etat.portails.some(portail => memeCase(portail, position));
