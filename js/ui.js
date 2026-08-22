import { VERSION, VITESSES, vitesseDe } from './config.js';
import { VARIANTES, varianteDe } from './variantes.js';
import { APPARENCES, THEMES, apparenceDe, themeDe } from './themes.js';
import { chargerHistorique, chargerRecords, recordDe } from './stockage.js';

let recordsEnCache = chargerRecords();

const $ = id => document.getElementById(id);

export const elements = {
    plateau: $('plateau'), cadrePlateau: $('cadre-plateau'), dpad: $('dpad'),
    hudVariante: $('hud-variante'), hudScore: $('hud-score'), hudRecord: $('hud-record'),
    boiteTemps: $('boite-temps'), hudTemps: $('hud-temps'), annonce: $('annonce'),
    voile: $('voile-jeu'), voileSurtitre: $('voile-surtitre'), voileTitre: $('voile-titre'),
    voileDetail: $('voile-detail'), voileAction: $('voile-action'),
    boutonPause: $('bouton-pause'), boutonNouvelle: $('bouton-nouvelle'),
    boutonAide: $('bouton-aide'), boutonTheme: $('bouton-theme'), boutonReglages: $('bouton-reglages'),
    dialogueFin: $('dialogue-fin'), finVariante: $('fin-variante'), finTitre: $('fin-titre'),
    finScore: $('fin-score'), finDetail: $('fin-detail'), finRecord: $('fin-record'),
    finOptions: $('fin-options'), finRejouer: $('fin-rejouer'),
    dialogueReglages: $('dialogue-reglages'), dialogueAide: $('dialogue-aide'),
    choixVariante: $('choix-variante'), explicationVariante: $('explication-variante'),
    choixVitesse: $('choix-vitesse'), explicationVitesse: $('explication-vitesse'),
    choixApparence: $('choix-apparence'), choixTheme: $('choix-theme'), choixMain: $('choix-main'),
    optionGestes: $('option-gestes'), optionSons: $('option-sons'), optionVibration: $('option-vibration'),
    stats: $('stats'), historique: $('historique'), avisChangement: $('avis-changement'),
    version: $('version'), effacerResultats: $('effacer-resultats')
};

const boutonTexte = (classe, id, libelle, detail = '') => {
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = classe;
    bouton.dataset.valeur = id;
    const fort = document.createElement('strong');
    fort.textContent = libelle;
    bouton.append(fort);
    if (detail) {
        const petit = document.createElement('small');
        petit.textContent = detail;
        bouton.append(petit);
    }
    return bouton;
};

function construireChoix(conteneur, liste, classe, action, detailDe = entree => entree.court || '') {
    conteneur.replaceChildren(...liste.map(entree => {
        const bouton = boutonTexte(classe, entree.id, entree.libelle, detailDe(entree));
        bouton.addEventListener('click', () => action(entree.id));
        return bouton;
    }));
}

export function construireReglages(actions) {
    construireChoix(elements.choixVariante, VARIANTES, 'carte-choix', actions.variante);
    construireChoix(elements.choixVitesse, VITESSES, 'segment', actions.vitesse, () => '');

    elements.choixApparence.replaceChildren(...APPARENCES.map(apparence => {
        const bouton = boutonTexte('carte-apparence', apparence.id, apparence.libelle);
        bouton.dataset.apparence = apparence.id;
        const apercu = document.createElement('span');
        apercu.className = 'apercu-serpent';
        apercu.setAttribute('aria-hidden', 'true');
        apercu.append(document.createElement('i'), document.createElement('i'), document.createElement('i'));
        bouton.prepend(apercu);
        bouton.title = apparence.resume;
        bouton.addEventListener('click', () => actions.apparence(apparence.id));
        return bouton;
    }));

    elements.choixTheme.replaceChildren(...THEMES.map(theme => {
        const bouton = document.createElement('button');
        bouton.type = 'button';
        bouton.className = 'pastille';
        bouton.dataset.valeur = theme.id;
        bouton.title = theme.libelle;
        bouton.setAttribute('aria-label', `Thème ${theme.libelle}`);
        bouton.style.setProperty('--clair', theme.clair);
        bouton.style.setProperty('--sombre', theme.sombre);
        bouton.style.setProperty('--apercu', theme.accent);
        bouton.addEventListener('click', () => actions.theme(theme.id));
        return bouton;
    }));

    construireChoix(elements.choixMain, [
        { id: 'gauche', libelle: 'Main gauche' },
        { id: 'droite', libelle: 'Main droite' }
    ], 'segment', actions.main, () => '');

    elements.optionGestes.addEventListener('change', () => actions.gestes(elements.optionGestes.checked));
    elements.optionSons.addEventListener('change', () => actions.sons(elements.optionSons.checked));
    elements.optionVibration.addEventListener('change', () => actions.vibration(elements.optionVibration.checked));
    elements.version.textContent = `Snake ${VERSION}`;
}

function marquer(conteneur, valeur) {
    for (const bouton of conteneur.children) bouton.classList.toggle('actif', bouton.dataset.valeur === valeur);
}

export function majReglages(preferences, configurationChangee = false) {
    marquer(elements.choixVariante, preferences.variante);
    marquer(elements.choixVitesse, preferences.vitesse);
    marquer(elements.choixApparence, preferences.apparence);
    marquer(elements.choixTheme, preferences.theme);
    marquer(elements.choixMain, preferences.main);
    elements.explicationVariante.textContent = varianteDe(preferences.variante).resume;
    elements.explicationVitesse.textContent = vitesseDe(preferences.vitesse).resume;
    elements.optionGestes.checked = preferences.gestes;
    elements.optionSons.checked = preferences.sons;
    elements.optionVibration.checked = preferences.vibration;
    elements.avisChangement.hidden = !configurationChangee;
    majStatistiques(preferences);
}

const formaterDuree = ms => {
    const secondes = Math.max(0, Math.round(ms / 1000));
    const minutes = Math.floor(secondes / 60);
    return `${minutes}:${String(secondes % 60).padStart(2, '0')}`;
};

export function majStatistiques(preferences) {
    recordsEnCache = chargerRecords();
    const record = recordDe(recordsEnCache, preferences.variante, preferences.vitesse);
    const lignes = [
        ['Meilleur score', record.meilleurScore],
        ['Longueur max.', record.longueurMax],
        ['Parties', record.parties],
        ['Temps max.', formaterDuree(record.dureeMaxMs)]
    ];
    elements.stats.replaceChildren(...lignes.map(([nom, valeur]) => {
        const bloc = document.createElement('div');
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = nom;
        dd.textContent = String(valeur);
        bloc.append(dt, dd);
        return bloc;
    }));

    elements.historique.replaceChildren(...chargerHistorique().map(resultat => {
        const item = document.createElement('li');
        item.textContent = `${varianteDe(resultat.variante).libelle} · ${resultat.score} fruit${resultat.score > 1 ? 's' : ''} · ${formaterDuree(resultat.dureeMs)}`;
        return item;
    }));
}

export function majHUD(etat) {
    const variante = varianteDe(etat.variante);
    const record = recordDe(recordsEnCache, etat.variante, etat.vitesse);
    elements.hudVariante.textContent = variante.libelle;
    elements.hudScore.textContent = String(etat.score);
    elements.hudRecord.textContent = String(Math.max(record.meilleurScore, etat.score));
    elements.boiteTemps.hidden = variante.dureeMs === null;
    if (variante.dureeMs !== null) elements.hudTemps.textContent = formaterDuree(etat.restantMs);
    elements.plateau.setAttribute('aria-label', `Plateau de Snake, ${variante.libelle}, score ${etat.score}, longueur ${etat.serpent.length}`);
}

export function majEtat(etat) {
    const variante = varianteDe(etat.variante);
    elements.voileSurtitre.textContent = variante.libelle;
    elements.boutonPause.setAttribute('aria-label', etat.statut === 'pause' ? 'Reprendre la partie' : 'Mettre en pause');
    elements.boutonPause.firstElementChild.textContent = etat.statut === 'pause' ? '▶' : 'Ⅱ';
    if (etat.statut === 'en-cours' || etat.statut === 'terminee') {
        elements.voile.hidden = true;
        return;
    }
    elements.voile.hidden = false;
    if (etat.statut === 'pret') {
        elements.voileTitre.textContent = 'À vous de jouer';
        elements.voileDetail.textContent = 'Touchez une flèche ou glissez sur le plateau.';
        elements.voileAction.hidden = true;
    } else {
        elements.voileTitre.textContent = 'Pause';
        elements.voileDetail.textContent = 'La partie est en sécurité.';
        elements.voileAction.hidden = false;
        elements.voileAction.textContent = 'Reprendre';
    }
}

export function montrerCompteARebours(valeur) {
    elements.voile.hidden = false;
    elements.voileSurtitre.textContent = 'Préparez-vous';
    elements.voileTitre.textContent = String(valeur);
    elements.voileDetail.textContent = 'La partie reprend…';
    elements.voileAction.hidden = true;
}

const TITRES_FIN = {
    temps: 'Temps écoulé', mur: 'Mur droit devant', corps: 'Vous vous êtes rattrapé',
    obstacle: 'Un rocher de trop', 'grille-remplie': 'Grille remplie'
};

export function ouvrirFin(etat, bilan) {
    elements.finVariante.textContent = `${varianteDe(etat.variante).libelle} · ${vitesseDe(etat.vitesse).libelle}`;
    elements.finTitre.textContent = TITRES_FIN[etat.raisonFin] ?? 'Partie terminée';
    elements.finScore.textContent = String(etat.score);
    elements.finDetail.textContent = `Longueur ${etat.serpent.length} · ${formaterDuree(etat.dureeMs)}`;
    elements.finRecord.hidden = !bilan.nouveauRecord;
    if (!elements.dialogueFin.open) elements.dialogueFin.showModal();
}

export const ouvrir = dialogue => { if (!dialogue.open) dialogue.showModal(); };
export const fermer = dialogue => { if (dialogue.open) dialogue.close(); };

export function annoncer(message) {
    elements.annonce.textContent = message;
    clearTimeout(annoncer.delai);
    annoncer.delai = setTimeout(() => { elements.annonce.textContent = ''; }, 1800);
}
