# Snake

Le Snake classique et quatre variantes, pensé d'abord pour le téléphone : une
croix directionnelle sous le plateau en portrait, à côté en paysage, des gestes
directs et une partie qui se remet en pause quand l'application disparaît.

Le jeu est une page statique, sans dépendance et sans compilation. Il fonctionne
hors ligne après la première visite et ne transmet aucune donnée.

## Version 1.0.2

- les cibles tactiles de l'interface passent à 44 px (boutons d'en-tête,
  boutons texte, listes déroulantes), conformément à la convention.

## Version 1.0.1

- flèches tactiles agrandies sur téléphone, y compris les petits écrans ;
- un glissement tourne dès que le seuil est franchi, sans attendre le relâchement ;
- plusieurs virages peuvent être enchaînés au cours d'un même geste ;
- le double-tap, l'appui prolongé, la sélection et le glisser-déposer sont
  neutralisés dans la zone de jeu sur iPhone.

## Les cinq modes

| Mode | Règle particulière |
| --- | --- |
| **Classique** | murs et corps mortels |
| **Sans murs** | les côtés opposés sont reliés |
| **Obstacles** | dix rochers au départ, puis un nouveau tous les quatre fruits |
| **Portails** | deux portes reliées qui déménagent après trois passages |
| **Sprint 90 s** | règles classiques avec un compte à rebours |

Le générateur d'obstacles refuse tout rocher qui couperait la grille en deux.
Une pomme ne naît donc jamais dans une poche devenue inaccessible. Les portails
sont posés loin l'un de l'autre et ne peuvent apparaître sous le serpent.

Trois vitesses accélèrent par paliers : Détente, Normal et Rapide. Chaque couple
mode-vitesse a son propre record, car un score en Sans murs ne se compare pas à
un score avec des parois mortelles.

## Commandes et apparences

- **Mobile** : croix directionnelle ou geste sur le plateau. En paysage, les
  commandes se placent à droite ou à gauche selon la main choisie.
- **Clavier** : flèches, ZQSD ou WASD. Espace/P met en pause, R recommence et T
  change de palette.
- **Rendu** : Moderne arrondi, Pixel rétro ou Organique. Il s'agit de trois
  dessins canvas distincts, combinables avec six thèmes de couleurs.

Deux virages sont gardés en mémoire. Un doigt rapide peut donc faire « haut,
gauche » avant le prochain pas sans que le second ordre se perde. La partie est
automatiquement mise en pause quand l'onglet passe à l'arrière-plan.

## Stockage

Préférences, records, dix derniers résultats et partie en cours vivent dans le
`localStorage`, sous quatre clés préfixées `snake.`. Chaque valeur porte une
version de schéma. Un stockage absent ou corrompu n'empêche jamais de jouer : le
jeu retombe sur ses valeurs par défaut et utilise une mémoire temporaire.

## Architecture

- `js/moteur.js` — géométrie pure d'un pas, collisions et téléportation ;
- `js/partie.js` — variantes, score, vitesse, temps et génération sûre ;
- `js/hasard.js` — hasard reproductible et sérialisable ;
- `js/rendu.js` — canvas haute définition et trois styles de serpent ;
- `js/entree.js` — clavier, croix tactile et gestes ;
- `js/stockage.js` — préférences, statistiques, historique et reprise ;
- `js/ui.js` — tableau de bord, options et dialogues ;
- `js/app.js` — boucle à pas fixe et orchestration ;
- `css/themes.css` — les six palettes, seule source des couleurs ;
- `sw.js` — coquille hors ligne versionnée.

Le moteur ne lit jamais l'heure et ne touche jamais au DOM. La logique avance à
pas fixes ; `requestAnimationFrame` ne fait qu'interpoler le dessin entre deux
cases. Un téléphone lent ne modifie donc pas les règles du jeu.

## Développer

```bash
npm test
npm run check
npm run serve   # http://localhost:8765
```

Les tests couvrent les collisions, la queue qui libère sa case, l'enroulement,
les portails, l'accessibilité des obstacles, le sprint, la reprise, les records
et la cohérence entre page, manifeste, cache hors ligne, thèmes et version.
