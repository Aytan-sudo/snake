import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compteur } from './harness.mjs';
import { VERSION } from '../js/config.js';
import { APPARENCES, THEMES } from '../js/themes.js';
import { VARIANTES } from '../js/variantes.js';

const { check, rapport } = compteur();
console.log('\nPage, PWA et palettes\n');
const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = chemin => readFileSync(join(racine, chemin), 'utf8');

const page = lire('index.html');
const app = lire('js/app.js');
const ui = lire('js/ui.js');
const styles = [lire('css/themes.css'), lire('css/plateau.css'), lire('css/interface.css')].join('\n');
const worker = lire('sw.js');
const paquet = JSON.parse(lire('package.json'));
const manifeste = JSON.parse(lire('manifest.webmanifest'));

check('la version de package.json est celle du code', paquet.version === VERSION);
check('la version est visible dans les options', page.includes(`Snake ${VERSION}`) && ui.includes('`Snake ${VERSION}`'));
check('le cache porte la même version', worker.includes(`const VERSION = 'snake-${VERSION}'`));

function modulesCharges(depart) {
    const vus = new Set();
    const aVoir = [depart];
    while (aVoir.length) {
        const nom = aVoir.pop();
        if (vus.has(nom)) continue;
        vus.add(nom);
        for (const [, cible] of lire(`js/${nom}`).matchAll(/from\s+'\.\/([\w-]+\.js)'/g)) aVoir.push(cible);
    }
    return vus;
}

const charges = modulesCharges('app.js');
const tous = readdirSync(join(racine, 'js')).filter(nom => nom.endsWith('.js'));
check('tous les modules sont reliés à l’application', tous.every(nom => charges.has(nom)), tous.filter(nom => !charges.has(nom)).join(' '));
const coquille = [...worker.matchAll(/^\s+'([^']+)',?$/gm)].map(([, chemin]) => chemin);
check('tous les modules sont disponibles hors ligne', tous.every(nom => coquille.includes(`js/${nom}`)));
check('tous les fichiers du cache existent', coquille.every(chemin => chemin === './' || existsSync(join(racine, chemin))));
check('le service worker est enregistré', app.includes("navigator.serviceWorker.register('./sw.js')"));

const idsDemandes = [...ui.matchAll(/\$\('([\w-]+)'\)/g)].map(([, id]) => id);
check('tous les éléments cherchés par l’interface existent', idsDemandes.every(id => page.includes(`id="${id}"`)), idsDemandes.filter(id => !page.includes(`id="${id}"`)).join(' '));
check('la page charge l’application en module', page.includes('<script type="module" src="js/app.js">'));

check('les cinq variantes sont proposées', VARIANTES.length === 5 && VARIANTES.some(variante => variante.id === 'sprint'));
check('les trois apparences sont proposées', APPARENCES.length === 3 && APPARENCES.every(apparence => page.includes('id="choix-apparence"')));
check('les six thèmes ont une palette', THEMES.length === 6 && THEMES.slice(1).every(theme => styles.includes(`data-theme="${theme.id}"`)));
check('les apparences ont des règles visuelles', ['moderne', 'pixel', 'organique'].every(id => styles.includes(`data-apparence="${id}"`) || lire('js/rendu.js').includes(`'${id}'`)));

check('le plateau et la croix captent les gestes', /\.cadre-plateau\s*\{[^}]*touch-action:\s*none/s.test(styles) && /\.dpad\s*\{[^}]*touch-action:\s*none/s.test(styles));
check('les flèches mobiles ne descendent jamais sous 58 px', styles.includes('--dpad-cell: clamp(58px'));
check('le geste tourne pendant le mouvement', lire('js/entree.js').includes("canvas.addEventListener('pointermove', gesteBouge"));
check('les interactions parasites iOS sont neutralisées',
    page.includes('maximum-scale=1, user-scalable=no')
    && styles.includes('-webkit-touch-callout: none')
    && lire('js/entree.js').includes("'contextmenu', 'selectstart', 'dragstart', 'dblclick'"));
check('le paysage possède une mise en page dédiée', styles.includes('@media (orientation: landscape)') && styles.includes('data-main="gauche"'));
check('les encoches du téléphone sont respectées', styles.includes('safe-area-inset-top') && styles.includes('safe-area-inset-bottom'));
check('les mouvements réduits sont respectés', styles.includes('prefers-reduced-motion'));

check('le manifeste autorise portrait et paysage', manifeste.orientation === 'any');
check('le manifeste possède nom et description', manifeste.name === 'Snake' && manifeste.description.length > 50);
check('les icônes PNG et SVG sont déclarées', manifeste.icons.length === 3 && manifeste.icons.every(icone => existsSync(join(racine, icone.src))));
check('page et manifeste partagent la couleur initiale', page.includes(`content="${manifeste.theme_color}"`));
check('le thème initial lit la clé versionnée du stockage', page.includes("localStorage.getItem('snake.preferences')"));

check('le déploiement Pages existe', existsSync(join(racine, '.github/workflows/pages.yml')) && lire('.github/workflows/pages.yml').includes('actions/deploy-pages@v4'));

rapport();
