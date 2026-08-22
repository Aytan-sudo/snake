import { VITESSES } from './config.js';
import { installerEntrees } from './entree.js';
import { creerPartie, avancerTemps, copierEtat, delaiActuel, demarrer, enfilerDirection, jouerUnPas, mettreEnPause, reprendre, restaurerPartie } from './partie.js';
import { creerRendu } from './rendu.js';
import { creerSon } from './son.js';
import {
    PREFERENCES_PAR_DEFAUT, chargerPreferences, chargerSession, effacerResultats,
    enregistrerPreferences, enregistrerResultat, enregistrerSession, oublierSession
} from './stockage.js';
import { APPARENCES, IDS_APPARENCES, IDS_THEMES, appliquerTheme, themeSuivant } from './themes.js';
import { IDS_VARIANTES } from './variantes.js';
import {
    annoncer, construireReglages, elements, fermer, majEtat, majHUD, majReglages,
    majStatistiques, montrerCompteARebours, ouvrir, ouvrirFin
} from './ui.js';

const IDS_VITESSES = VITESSES.map(vitesse => vitesse.id);

function normaliserPreferences(brutes) {
    const prefs = { ...PREFERENCES_PAR_DEFAUT, ...brutes };
    if (!IDS_VARIANTES.includes(prefs.variante)) prefs.variante = PREFERENCES_PAR_DEFAUT.variante;
    if (!IDS_VITESSES.includes(prefs.vitesse)) prefs.vitesse = PREFERENCES_PAR_DEFAUT.vitesse;
    if (!IDS_THEMES.includes(prefs.theme)) prefs.theme = PREFERENCES_PAR_DEFAUT.theme;
    if (!IDS_APPARENCES.includes(prefs.apparence)) prefs.apparence = PREFERENCES_PAR_DEFAUT.apparence;
    if (!['gauche', 'droite'].includes(prefs.main)) prefs.main = PREFERENCES_PAR_DEFAUT.main;
    for (const cle of ['sons', 'vibration', 'gestes']) prefs[cle] = prefs[cle] !== false;
    return prefs;
}

let preferences = normaliserPreferences(chargerPreferences());
let etat = restaurerPartie(chargerSession());
if (etat) {
    preferences.variante = etat.variante;
    preferences.vitesse = etat.vitesse;
} else {
    etat = creerPartie(preferences);
}
enregistrerPreferences(preferences);
appliquerTheme(preferences);

let precedent = copierEtat(etat);
let accumulateur = 0;
let dernierTemps = performance.now();
let derniereSauvegarde = 0;
let resultatEnregistre = false;
let configurationChangee = false;
let compteARebours = 0;

const rendu = creerRendu(elements.plateau);
const son = creerSon(() => preferences.sons);

function vibrer(motif) {
    if (!preferences.vibration) return;
    try { navigator.vibrate?.(motif); } catch { /* non pris en charge */ }
}

function sauvegarder() {
    if (etat.statut === 'terminee') oublierSession();
    else enregistrerSession(etat);
}

function finaliser() {
    if (resultatEnregistre || etat.statut !== 'terminee') return;
    resultatEnregistre = true;
    const bilan = enregistrerResultat(etat);
    oublierSession();
    if (bilan.nouveauRecord) {
        son.record();
        vibrer([35, 45, 35, 45, 80]);
    } else {
        son.perdre();
        vibrer([70, 50, 120]);
    }
    majHUD(etat);
    majStatistiques(preferences);
    ouvrirFin(etat, bilan);
}

function traiter(evenements) {
    for (const evenement of evenements) {
        if (evenement.type === 'mange') {
            son.manger(evenement.score);
            vibrer(20);
            annoncer(`Fruit ${evenement.score}`);
        } else if (evenement.type === 'portail') {
            son.portail();
            vibrer([12, 25, 12]);
        } else if (evenement.type === 'obstacle') {
            annoncer('Un nouveau rocher apparaît');
        } else if (evenement.type === 'portails-deplaces') {
            annoncer('Les portails changent de place');
        }
    }
    if (etat.statut === 'terminee') finaliser();
}

function rafraichir() {
    majHUD(etat);
    majEtat(etat);
    majReglages(preferences, configurationChangee);
    rendu.dessiner(etat, precedent, 1, preferences, performance.now());
}

function nouvellePartie(demander = true) {
    if (demander && ['en-cours', 'pause'].includes(etat.statut) && etat.score > 0
        && !globalThis.confirm('Abandonner cette partie et en commencer une nouvelle ?')) return;
    compteARebours = Math.abs(compteARebours) + 1;
    fermer(elements.dialogueFin);
    configurationChangee = false;
    resultatEnregistre = false;
    etat = creerPartie(preferences);
    precedent = copierEtat(etat);
    accumulateur = 0;
    sauvegarder();
    rafraichir();
}

function surDirection(direction) {
    if (document.querySelector('dialog[open]') || compteARebours < 0) return;
    if (etat.statut === 'pret') {
        etat = demarrer(enfilerDirection(etat, direction));
        precedent = copierEtat(etat);
        dernierTemps = performance.now();
        accumulateur = 0;
        son.demarrer();
        sauvegarder();
        majEtat(etat);
    } else if (etat.statut === 'en-cours') {
        etat = enfilerDirection(etat, direction);
    }
}

const attendre = duree => new Promise(resolve => setTimeout(resolve, duree));

async function reprendreAvecCompte() {
    if (etat.statut !== 'pause' || compteARebours < 0) return;
    const jeton = ++compteARebours;
    compteARebours = -jeton;
    for (const nombre of [3, 2, 1]) {
        if (compteARebours !== -jeton || etat.statut !== 'pause') return;
        montrerCompteARebours(nombre);
        son.demarrer();
        await attendre(520);
    }
    if (compteARebours !== -jeton || etat.statut !== 'pause') return;
    compteARebours = jeton;
    etat = reprendre(etat);
    precedent = copierEtat(etat);
    accumulateur = 0;
    dernierTemps = performance.now();
    sauvegarder();
    majEtat(etat);
}

function pause() {
    if (etat.statut === 'en-cours') {
        etat = mettreEnPause(etat);
        compteARebours = Math.abs(compteARebours) + 1;
        sauvegarder();
        majEtat(etat);
    } else if (etat.statut === 'pause') {
        reprendreAvecCompte();
    }
}

function changer(cle, valeur, relance = false) {
    preferences = { ...preferences, [cle]: valeur };
    enregistrerPreferences(preferences);
    if (relance) configurationChangee = etat.variante !== preferences.variante || etat.vitesse !== preferences.vitesse;
    appliquerTheme(preferences);
    entrees?.mettreGestes(preferences.gestes);
    majReglages(preferences, configurationChangee);
    rendu.dessiner(etat, precedent, 1, preferences, performance.now());
}

function basculerTheme() {
    changer('theme', themeSuivant(preferences.theme));
}

function suspendrePour(dialogue) {
    const jouait = etat.statut === 'en-cours';
    if (jouait) {
        etat = mettreEnPause(etat);
        sauvegarder();
        majEtat(etat);
    }
    dialogue.dataset.reprendre = jouait ? 'oui' : 'non';
    ouvrir(dialogue);
}

construireReglages({
    variante: valeur => changer('variante', valeur, true),
    vitesse: valeur => changer('vitesse', valeur, true),
    apparence: valeur => changer('apparence', valeur),
    theme: valeur => changer('theme', valeur),
    main: valeur => changer('main', valeur),
    gestes: valeur => changer('gestes', valeur),
    sons: valeur => changer('sons', valeur),
    vibration: valeur => changer('vibration', valeur)
});

let entrees = installerEntrees({
    canvas: elements.plateau,
    dpad: elements.dpad,
    surDirection,
    surPause: pause,
    surNouvelle: () => nouvellePartie(true),
    surTheme: basculerTheme,
    gestes: preferences.gestes
});

elements.boutonPause.addEventListener('click', pause);
elements.voileAction.addEventListener('click', reprendreAvecCompte);
elements.boutonNouvelle.addEventListener('click', () => nouvellePartie(true));
elements.boutonTheme.addEventListener('click', basculerTheme);
elements.boutonAide.addEventListener('click', () => suspendrePour(elements.dialogueAide));
elements.boutonReglages.addEventListener('click', () => {
    configurationChangee = false;
    majReglages(preferences, false);
    suspendrePour(elements.dialogueReglages);
});
elements.finRejouer.addEventListener('click', () => nouvellePartie(false));
elements.finOptions.addEventListener('click', () => {
    fermer(elements.dialogueFin);
    configurationChangee = false;
    majReglages(preferences, false);
    ouvrir(elements.dialogueReglages);
});

for (const bouton of document.querySelectorAll('[data-fermer]')) {
    bouton.addEventListener('click', () => bouton.closest('dialog')?.close());
}

function apresDialogue(dialogue) {
    dialogue.addEventListener('close', () => {
        if (dialogue === elements.dialogueReglages && configurationChangee) {
            nouvellePartie(false);
            return;
        }
        if (dialogue.dataset.reprendre === 'oui' && etat.statut === 'pause') reprendreAvecCompte();
        dialogue.dataset.reprendre = 'non';
    });
}
apresDialogue(elements.dialogueAide);
apresDialogue(elements.dialogueReglages);

elements.effacerResultats.addEventListener('click', () => {
    if (!globalThis.confirm('Effacer tous les records et les dix derniers résultats ?')) return;
    effacerResultats();
    majHUD(etat);
    majStatistiques(preferences);
    annoncer('Résultats effacés');
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && etat.statut === 'en-cours') {
        etat = mettreEnPause(etat);
        compteARebours = Math.abs(compteARebours) + 1;
        sauvegarder();
        majEtat(etat);
    }
});

globalThis.addEventListener('pagehide', () => {
    if (etat.statut === 'en-cours') etat = mettreEnPause(etat);
    sauvegarder();
});
globalThis.addEventListener('resize', () => rendu.dessiner(etat, precedent, 1, preferences, performance.now()));

function boucle(maintenant) {
    const delta = Math.min(100, Math.max(0, maintenant - dernierTemps));
    dernierTemps = maintenant;

    if (etat.statut === 'en-cours') {
        const temps = avancerTemps(etat, delta);
        etat = temps.etat;
        traiter(temps.evenements);
        accumulateur += delta;
        let garde = 0;
        while (etat.statut === 'en-cours' && accumulateur >= delaiActuel(etat) && garde++ < 4) {
            accumulateur -= delaiActuel(etat);
            precedent = copierEtat(etat);
            const resultat = jouerUnPas(etat);
            etat = resultat.etat;
            traiter(resultat.evenements);
            sauvegarder();
        }
        if (maintenant - derniereSauvegarde > 1000) {
            sauvegarder();
            derniereSauvegarde = maintenant;
        }
    }

    const progression = etat.statut === 'en-cours' ? accumulateur / delaiActuel(etat) : 1;
    rendu.dessiner(etat, precedent, progression, preferences, maintenant);
    majHUD(etat);
    requestAnimationFrame(boucle);
}

rafraichir();
requestAnimationFrame(boucle);

if ('serviceWorker' in navigator) {
    globalThis.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
