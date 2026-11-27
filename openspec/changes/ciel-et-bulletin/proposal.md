## Why

La météo fonctionne, mais l'écran est sobre alors que l'outil ouvre la rétro : il doit donner le ton. L'équipe vote surtout depuis son ordinateur, en visio, et l'animateur partage son écran à la révélation. Il y a donc deux moments à habiller : le vote de chacun, et la révélation que tout le monde regarde ensemble.

## What Changes

- **Ciel vivant (vue participant)** : le fond de la page devient un ciel qui suit la météo choisie (grand soleil, éclaircies, nuages, pluie qui tombe, orage avec éclairs), avec des nuages qui dérivent ; ciel neutre tant que rien n'est choisi ; ciel de nuit en thème sombre.
- **Bulletin météo (vue animateur, révélation)** : les résultats sont mis en scène comme un bulletin télé, en pleine largeur : bandeau titre, « carte » de l'équipe avec les icônes des météos votées, prévision (météo dominante), indice en grand, barre de répartition et bandeau défilant. Pas de comparaison avec les sprints précédents (retour de l'auteur) : c'est le rôle des graphiques de la page d'équipe.
- Animations coupées pour qui a demandé à réduire les animations ; aucune image externe (SVG et CSS dans le dépôt).

Hors périmètre : décor de l'accueil et de la page d'équipe, son, photos.

## Capabilities

### New Capabilities

- `meteo-decor` : ciel vivant de la vue participant et bulletin de révélation de la vue animateur.

### Modified Capabilities

_Aucune._ (Les résultats de la vue participant et la carte « Rejoindre » restent ceux de `creer-meteo`.)

## Impact

- `site/index.html`, `site/app.css`, `site/js/ui.js` ; `site/js/meteo-core.js` (ciel d'une météo, éléments du bandeau).
- Aucune règle de base à changer.
