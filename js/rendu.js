import { DIRECTIONS } from './moteur.js';

const LEXIQUE_COULEURS = {
    plateau: '--plateau',
    grille: '--grille',
    serpent: '--serpent',
    tete: '--serpent-tete',
    detail: '--serpent-detail',
    ombre: '--serpent-ombre',
    fruit: '--fruit',
    feuille: '--fruit-feuille',
    obstacle: '--obstacle',
    obstacleClair: '--obstacle-clair',
    portailA: '--portail-a',
    portailB: '--portail-b'
};

function paletteDe(element) {
    const style = getComputedStyle(element);
    return Object.fromEntries(Object.entries(LEXIQUE_COULEURS).map(([nom, variable]) => [nom, style.getPropertyValue(variable).trim()]));
}

function rectangleArrondi(ctx, x, y, largeur, hauteur, rayon) {
    const r = Math.min(rayon, largeur / 2, hauteur / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + largeur, y, x + largeur, y + hauteur, r);
    ctx.arcTo(x + largeur, y + hauteur, x, y + hauteur, r);
    ctx.arcTo(x, y + hauteur, x, y, r);
    ctx.arcTo(x, y, x + largeur, y, r);
    ctx.closePath();
}

function melangerPosition(courante, ancienne, progression) {
    if (!ancienne) return courante;
    const distance = Math.abs(courante.x - ancienne.x) + Math.abs(courante.y - ancienne.y);
    // Enroulement et téléportation doivent disparaître d'un côté et réapparaître
    // de l'autre, pas traverser tout le plateau en diagonale.
    if (distance > 1) return courante;
    return {
        x: ancienne.x + (courante.x - ancienne.x) * progression,
        y: ancienne.y + (courante.y - ancienne.y) * progression
    };
}

function centre(position, cellule) {
    return { x: (position.x + .5) * cellule, y: (position.y + .5) * cellule };
}

function dessinerGrille(ctx, taille, cellule, couleurs) {
    ctx.fillStyle = couleurs.plateau;
    ctx.fillRect(0, 0, taille * cellule, taille * cellule);
    ctx.strokeStyle = couleurs.grille;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < taille; i++) {
        const coordonnee = Math.round(i * cellule) + .5;
        ctx.moveTo(coordonnee, 0);
        ctx.lineTo(coordonnee, taille * cellule);
        ctx.moveTo(0, coordonnee);
        ctx.lineTo(taille * cellule, coordonnee);
    }
    ctx.stroke();
}

function dessinerPortail(ctx, portail, index, cellule, couleurs, temps) {
    const c = centre(portail, cellule);
    const pulsation = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 1 + Math.sin(temps / 260 + index * Math.PI) * .06;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(pulsation, pulsation);
    ctx.strokeStyle = index === 0 ? couleurs.portailA : couleurs.portailB;
    ctx.lineWidth = cellule * .14;
    ctx.beginPath();
    ctx.arc(0, 0, cellule * .31, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = .35;
    ctx.lineWidth = cellule * .08;
    ctx.beginPath();
    ctx.arc(0, 0, cellule * .17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function dessinerObstacle(ctx, obstacle, cellule, couleurs, apparence) {
    const marge = apparence === 'pixel' ? cellule * .12 : cellule * .15;
    const x = obstacle.x * cellule + marge;
    const y = obstacle.y * cellule + marge;
    const taille = cellule - marge * 2;
    ctx.fillStyle = couleurs.obstacle;
    if (apparence === 'pixel') {
        ctx.fillRect(x, y, taille, taille);
        ctx.fillStyle = couleurs.obstacleClair;
        ctx.fillRect(x + taille * .18, y + taille * .16, taille * .25, taille * .18);
    } else {
        ctx.beginPath();
        ctx.moveTo(x + taille * .18, y + taille * .12);
        ctx.lineTo(x + taille * .78, y + taille * .06);
        ctx.lineTo(x + taille * .96, y + taille * .43);
        ctx.lineTo(x + taille * .75, y + taille * .9);
        ctx.lineTo(x + taille * .2, y + taille * .86);
        ctx.lineTo(x + taille * .02, y + taille * .45);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = couleurs.obstacleClair;
        ctx.beginPath();
        ctx.ellipse(x + taille * .4, y + taille * .34, taille * .18, taille * .11, -.35, 0, Math.PI * 2);
        ctx.fill();
    }
}

function dessinerFruit(ctx, nourriture, cellule, couleurs, apparence, temps) {
    if (!nourriture) return;
    const c = centre(nourriture, cellule);
    const pulse = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 1 + Math.sin(temps / 210) * .045;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(pulse, pulse);
    if (apparence === 'pixel') {
        const unite = cellule / 7;
        ctx.fillStyle = couleurs.fruit;
        ctx.fillRect(-2.5 * unite, -2 * unite, 5 * unite, 4.5 * unite);
        ctx.fillRect(-1.5 * unite, -3 * unite, 3 * unite, unite);
        ctx.fillStyle = couleurs.feuille;
        ctx.fillRect(.5 * unite, -3.5 * unite, 2 * unite, unite);
    } else {
        ctx.fillStyle = couleurs.fruit;
        ctx.beginPath();
        ctx.arc(-cellule * .11, cellule * .03, cellule * .24, 0, Math.PI * 2);
        ctx.arc(cellule * .11, cellule * .03, cellule * .24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = couleurs.feuille;
        ctx.lineWidth = cellule * .08;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -cellule * .12);
        ctx.lineTo(cellule * .06, -cellule * .34);
        ctx.stroke();
        ctx.fillStyle = couleurs.feuille;
        ctx.beginPath();
        ctx.ellipse(cellule * .16, -cellule * .26, cellule * .14, cellule * .07, -.4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function yeux(ctx, tete, direction, cellule, couleurs, organique = false) {
    const c = centre(tete, cellule);
    const pas = DIRECTIONS[direction];
    const cote = { x: -pas.dy, y: pas.dx };
    const devant = organique ? .16 : .18;
    const ecart = organique ? .15 : .14;
    ctx.fillStyle = couleurs.detail;
    for (const signe of [-1, 1]) {
        const x = c.x + pas.dx * cellule * devant + cote.x * cellule * ecart * signe;
        const y = c.y + pas.dy * cellule * devant + cote.y * cellule * ecart * signe;
        ctx.beginPath();
        ctx.arc(x, y, cellule * (organique ? .075 : .065), 0, Math.PI * 2);
        ctx.fill();
    }
}

function dessinerModerne(ctx, positions, direction, cellule, couleurs) {
    ctx.save();
    ctx.shadowColor = couleurs.ombre;
    ctx.shadowBlur = cellule * .2;
    ctx.shadowOffsetY = cellule * .08;
    for (let i = positions.length - 1; i >= 0; i--) {
        const position = positions[i];
        const marge = cellule * (i === 0 ? .08 : .11);
        rectangleArrondi(ctx, position.x * cellule + marge, position.y * cellule + marge,
            cellule - marge * 2, cellule - marge * 2, cellule * .22);
        ctx.fillStyle = i === 0 ? couleurs.tete : couleurs.serpent;
        ctx.fill();
    }
    ctx.restore();
    yeux(ctx, positions[0], direction, cellule, couleurs);
}

function dessinerPixel(ctx, positions, direction, cellule, couleurs) {
    for (let i = positions.length - 1; i >= 0; i--) {
        const position = positions[i];
        const marge = cellule * .08;
        ctx.fillStyle = i === 0 ? couleurs.tete : couleurs.serpent;
        ctx.fillRect(Math.round(position.x * cellule + marge), Math.round(position.y * cellule + marge),
            Math.ceil(cellule - marge * 2), Math.ceil(cellule - marge * 2));
    }
    const tete = positions[0];
    const c = centre(tete, cellule);
    const pas = DIRECTIONS[direction];
    const cote = { x: -pas.dy, y: pas.dx };
    ctx.fillStyle = couleurs.detail;
    const unite = Math.max(2, Math.round(cellule * .1));
    for (const signe of [-1, 1]) {
        ctx.fillRect(Math.round(c.x + pas.dx * cellule * .18 + cote.x * cellule * .15 * signe - unite / 2),
            Math.round(c.y + pas.dy * cellule * .18 + cote.y * cellule * .15 * signe - unite / 2), unite, unite);
    }
}

function dessinerOrganique(ctx, positions, direction, cellule, couleurs) {
    ctx.save();
    ctx.strokeStyle = couleurs.serpent;
    ctx.lineWidth = cellule * .65;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = couleurs.ombre;
    ctx.shadowBlur = cellule * .22;
    for (let i = positions.length - 1; i > 0; i--) {
        const a = positions[i];
        const b = positions[i - 1];
        if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 1.1) continue;
        const ca = centre(a, cellule);
        const cb = centre(b, cellule);
        ctx.beginPath();
        ctx.moveTo(ca.x, ca.y);
        ctx.lineTo(cb.x, cb.y);
        ctx.stroke();
    }
    const tete = centre(positions[0], cellule);
    ctx.fillStyle = couleurs.tete;
    ctx.beginPath();
    ctx.ellipse(tete.x, tete.y, cellule * .43, cellule * .38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    yeux(ctx, positions[0], direction, cellule, couleurs, true);
}

export function creerRendu(canvas) {
    const ctx = canvas.getContext('2d', { alpha: false });

    function ajuster() {
        const cote = Math.max(1, Math.round(canvas.getBoundingClientRect().width));
        const ratio = Math.min(2, globalThis.devicePixelRatio || 1);
        const pixels = Math.round(cote * ratio);
        if (canvas.width !== pixels || canvas.height !== pixels) {
            canvas.width = pixels;
            canvas.height = pixels;
        }
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        return cote;
    }

    function dessiner(etat, precedent = etat, progression = 1, preferences = {}, temps = 0) {
        const cote = ajuster();
        const cellule = cote / etat.taille;
        const couleurs = paletteDe(canvas);
        ctx.clearRect(0, 0, cote, cote);
        dessinerGrille(ctx, etat.taille, cellule, couleurs);
        etat.portails.forEach((portail, index) => dessinerPortail(ctx, portail, index, cellule, couleurs, temps));
        etat.obstacles.forEach(obstacle => dessinerObstacle(ctx, obstacle, cellule, couleurs, preferences.apparence));
        dessinerFruit(ctx, etat.nourriture, cellule, couleurs, preferences.apparence, temps);

        const avancee = Math.max(0, Math.min(1, progression));
        const positions = etat.serpent.map((segment, index) =>
            melangerPosition(segment, precedent?.serpent?.[index], avancee));
        if (preferences.apparence === 'pixel') dessinerPixel(ctx, positions, etat.direction, cellule, couleurs);
        else if (preferences.apparence === 'organique') dessinerOrganique(ctx, positions, etat.direction, cellule, couleurs);
        else dessinerModerne(ctx, positions, etat.direction, cellule, couleurs);
    }

    return { dessiner, ajuster };
}
