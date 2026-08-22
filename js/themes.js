export const THEMES = [
    { id: 'prairie', libelle: 'Prairie', clair: '#edf5df', sombre: '#2d6a3f', accent: '#4f9e55' },
    { id: 'ocean', libelle: 'Océan', clair: '#e4f4f7', sombre: '#15556d', accent: '#1e95a8' },
    { id: 'bonbon', libelle: 'Bonbon', clair: '#fff0f4', sombre: '#73335f', accent: '#db5b88' },
    { id: 'ardoise', libelle: 'Ardoise', clair: '#e8edf2', sombre: '#3e4a57', accent: '#71879a' },
    { id: 'neon', libelle: 'Néon', clair: '#131a24', sombre: '#0a0f16', accent: '#50f59a' },
    { id: 'contraste', libelle: 'Contraste', clair: '#050505', sombre: '#000000', accent: '#ffe600' }
];

export const APPARENCES = [
    { id: 'moderne', libelle: 'Moderne', resume: 'Formes arrondies et animation fluide.' },
    { id: 'pixel', libelle: 'Pixel', resume: 'Carrés francs, comme sur une console rétro.' },
    { id: 'organique', libelle: 'Organique', resume: 'Corps souple et tête plus expressive.' }
];

export const IDS_THEMES = THEMES.map(theme => theme.id);
export const IDS_APPARENCES = APPARENCES.map(apparence => apparence.id);

export const themeDe = id => THEMES.find(theme => theme.id === id) ?? THEMES[0];
export const apparenceDe = id => APPARENCES.find(apparence => apparence.id === id) ?? APPARENCES[0];

export function appliquerTheme(preferences) {
    const racine = document.documentElement;
    const theme = themeDe(preferences.theme);
    racine.dataset.theme = theme.id;
    racine.dataset.apparence = apparenceDe(preferences.apparence).id;
    racine.dataset.main = preferences.main === 'gauche' ? 'gauche' : 'droite';
    const meta = document.getElementById('couleur-barre');
    if (meta) meta.content = theme.sombre;
}

export function themeSuivant(id) {
    const position = IDS_THEMES.indexOf(themeDe(id).id);
    return THEMES[(position + 1) % THEMES.length].id;
}
