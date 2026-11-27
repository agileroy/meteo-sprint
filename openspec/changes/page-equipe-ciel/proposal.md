## Why

La page d'équipe est monotone à côté du vote (ciel vivant) et de la révélation (bulletin) : deux grands panneaux de formulaire et de liens, puis un graphique. L'auteur a choisi, parmi trois pistes maquettées, la combinaison « ciel de l'équipe » + « prévisions façon appli météo ».

## What Changes

- **En-tête « ciel de l'équipe »** : le haut de page devient le ciel de la dernière météo de l'équipe (mêmes ciels que la vue participant), avec le nom, la dernière météo (« Grand soleil · 4,7 / 5 · 3 sprints ») et l'action principale « Lancer une météo » (libellé facultatif).
- **Bouton « Partager »** : le lien public et le lien d'animation passent dans un panneau qui s'ouvre à la demande (ouvert d'office juste après la création de l'équipe).
- **Cartes « Les dernières météos »** : les 6 derniers sprints en cartes, comme les prévisions d'une appli météo (icône, indice en grand, météo), la plus récente mise en avant ; un clic ouvre la météo ; une carte « Prochaine météo ? » pour l'animateur.
- **Graphique** : chaque colonne est coiffée de l'icône de sa météo.

## Capabilities

### New Capabilities

- `meteo-page-equipe` : en-tête ciel, partage, cartes de prévisions, icônes du graphique.

### Modified Capabilities

_Aucune._ (Les liens, la création, l'historique et l'ouverture d'une météo gardent leurs exigences.)

## Impact

- `site/index.html`, `site/app.css`, `site/js/ui.js`, `site/js/meteo-core.js`. Aucune règle de base à changer.
