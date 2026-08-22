// Géométrie pure d'un pas de Snake. Ce module ne connaît ni le hasard, ni le
// score, ni le DOM : on lui donne un plateau, il raconte ce qui s'est passé.

export const DIRECTIONS = {
    haut: { dx: 0, dy: -1 },
    droite: { dx: 1, dy: 0 },
    bas: { dx: 0, dy: 1 },
    gauche: { dx: -1, dy: 0 }
};

const OPPOSEES = { haut: 'bas', droite: 'gauche', bas: 'haut', gauche: 'droite' };

export const directionConnue = direction => Object.hasOwn(DIRECTIONS, direction);
export const sontOpposees = (a, b) => OPPOSEES[a] === b;
export const memeCase = (a, b) => Boolean(a && b && a.x === b.x && a.y === b.y);
export const cleCase = caseGrille => `${caseGrille.x},${caseGrille.y}`;
export const dansGrille = (position, taille) =>
    position.x >= 0 && position.y >= 0 && position.x < taille && position.y < taille;

export const enrouler = (position, taille) => ({
    x: (position.x + taille) % taille,
    y: (position.y + taille) % taille
});

function sortieDePortail(position, portails) {
    const entree = portails.findIndex(portail => memeCase(portail, position));
    if (entree === -1 || portails.length !== 2) return { position, portail: false };
    const sortie = portails[1 - entree];
    return { position: { x: sortie.x, y: sortie.y }, portail: true };
}

export function deplacer({ serpent, direction, taille, nourriture, obstacles = [], portails = [], enroule: avecEnroulement = false }) {
    if (!Array.isArray(serpent) || serpent.length === 0 || !directionConnue(direction)) {
        return { mort: true, raison: 'etat-invalide', serpent };
    }

    const pas = DIRECTIONS[direction];
    let arrivee = { x: serpent[0].x + pas.dx, y: serpent[0].y + pas.dy };

    if (!dansGrille(arrivee, taille)) {
        if (!avecEnroulement) return { mort: true, raison: 'mur', serpent };
        arrivee = enrouler(arrivee, taille);
    }

    const passage = sortieDePortail(arrivee, portails);
    arrivee = passage.position;

    if (obstacles.some(obstacle => memeCase(obstacle, arrivee))) {
        return { mort: true, raison: 'obstacle', serpent, portail: passage.portail };
    }

    const mange = memeCase(arrivee, nourriture);
    // Quand il ne grandit pas, la queue quitte sa case pendant ce même pas :
    // la tête a donc le droit d'y entrer.
    const corps = mange ? serpent : serpent.slice(0, -1);
    if (corps.some(segment => memeCase(segment, arrivee))) {
        return { mort: true, raison: 'corps', serpent, portail: passage.portail };
    }

    const suivant = [{ x: arrivee.x, y: arrivee.y }, ...serpent.map(segment => ({ ...segment }))];
    if (!mange) suivant.pop();

    return {
        mort: false,
        raison: null,
        serpent: suivant,
        tete: suivant[0],
        mange,
        portail: passage.portail
    };
}
