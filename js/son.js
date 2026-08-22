export function creerSon(estActif) {
    let contexte = null;

    function obtenirContexte() {
        if (!estActif()) return null;
        try {
            const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
            if (!Audio) return null;
            contexte ??= new Audio();
            if (contexte.state === 'suspended') contexte.resume();
            return contexte;
        } catch {
            return null;
        }
    }

    function note(frequence, duree = .08, volume = .045, type = 'sine', retard = 0) {
        const audio = obtenirContexte();
        if (!audio) return;
        const debut = audio.currentTime + retard;
        const oscillateur = audio.createOscillator();
        const gain = audio.createGain();
        oscillateur.type = type;
        oscillateur.frequency.setValueAtTime(frequence, debut);
        gain.gain.setValueAtTime(.0001, debut);
        gain.gain.exponentialRampToValueAtTime(volume, debut + .012);
        gain.gain.exponentialRampToValueAtTime(.0001, debut + duree);
        oscillateur.connect(gain).connect(audio.destination);
        oscillateur.start(debut);
        oscillateur.stop(debut + duree + .02);
    }

    return {
        demarrer() { note(330, .06, .025); },
        manger(score = 0) { note(440 + Math.min(score, 12) * 18, .085, .045, 'sine'); },
        portail() { note(310, .11, .035, 'triangle'); note(620, .12, .03, 'triangle', .055); },
        perdre() { note(230, .18, .045, 'sawtooth'); note(150, .24, .035, 'triangle', .12); },
        record() { note(523, .12, .04); note(659, .14, .04, 'sine', .09); note(784, .18, .04, 'sine', .18); }
    };
}
