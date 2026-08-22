import { DUREE_SPRINT_MS } from './config.js';

export const VARIANTES = [
    {
        id: 'classique',
        libelle: 'Classique',
        court: 'Murs mortels',
        resume: 'Le Snake d’origine : les murs et votre propre corps sont fatals.',
        enroule: false,
        obstacles: false,
        portails: false,
        dureeMs: null
    },
    {
        id: 'sans-murs',
        libelle: 'Sans murs',
        court: 'Bords reliés',
        resume: 'Sortez d’un côté et revenez par le bord opposé. Le corps reste dangereux.',
        enroule: true,
        obstacles: false,
        portails: false,
        dureeMs: null
    },
    {
        id: 'obstacles',
        libelle: 'Obstacles',
        court: 'Rochers évolutifs',
        resume: 'Des rochers occupent le terrain et un nouveau apparaît tous les quatre fruits.',
        enroule: false,
        obstacles: true,
        portails: false,
        dureeMs: null
    },
    {
        id: 'portails',
        libelle: 'Portails',
        court: 'Passages instables',
        resume: 'Traversez une porte pour ressortir par l’autre. Elles déménagent après trois passages.',
        enroule: false,
        obstacles: false,
        portails: true,
        dureeMs: null
    },
    {
        id: 'sprint',
        libelle: 'Sprint 90 s',
        court: 'Contre la montre',
        resume: 'Les règles classiques, quatre-vingt-dix secondes pour avaler le plus de fruits possible.',
        enroule: false,
        obstacles: false,
        portails: false,
        dureeMs: DUREE_SPRINT_MS
    }
];

export const IDS_VARIANTES = VARIANTES.map(variante => variante.id);
export const varianteDe = id => VARIANTES.find(variante => variante.id === id) ?? VARIANTES[0];
