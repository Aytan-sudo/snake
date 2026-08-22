// Un xorshift32 minuscule et sérialisable. Conserver son état permet de
// reprendre une partie sans que la prochaine pomme ou le prochain rocher ne
// change simplement parce que l'onglet a été fermé.

const SECOURS = 0x9e3779b9;

export const normaliserGraine = graine => (Number(graine) >>> 0) || SECOURS;

export function prochain(etat) {
    let valeur = normaliserGraine(etat);
    valeur ^= valeur << 13;
    valeur ^= valeur >>> 17;
    valeur ^= valeur << 5;
    valeur >>>= 0;
    return { etat: valeur || SECOURS, valeur: valeur / 0x1_0000_0000 };
}

export function entier(etat, maximum) {
    if (!Number.isInteger(maximum) || maximum <= 0) return { etat: normaliserGraine(etat), valeur: 0 };
    const tirage = prochain(etat);
    return { etat: tirage.etat, valeur: Math.floor(tirage.valeur * maximum) };
}

export function graineAleatoire() {
    try {
        const tampon = new Uint32Array(1);
        globalThis.crypto.getRandomValues(tampon);
        return normaliserGraine(tampon[0]);
    } catch {
        return normaliserGraine(Date.now() ^ Math.floor((globalThis.performance?.now?.() ?? 0) * 1000));
    }
}
