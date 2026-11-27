## Why

La page d'équipe est monotone à côté du vote (ciel vivant) et de la révélation (bulletin) : deux grands panneaux de formulaire et de liens, puis un graphique. L'auteur a choisi, parmi trois pistes maquettées, la combinaison « ciel de l'équipe » + « prévisions façon appli météo ».

## What Changes

- **En-tête « ciel de l'équipe »** : le haut de page devient le ciel de la dernière météo de l'équipe (mêmes ciels que la vue participant), avec le nom, la dernière météo (« Grand soleil · 4,7 / 5 · 3 sprints ») et l'action principale « Lancer une météo » (libellé facultatif).
- **Carte « Partager » toujours visible** à droite du bandeau (trois quarts / un quart) : QR code et lien public copiable en un clic, comme la carte « Rejoindre » ; « Lien d'animation » ouvre un encart (ouvert d'office juste après la création de l'équipe). Retour de l'auteur : un premier panneau « Partager » à déplier a été écarté.
- **Cartes « Les dernières météos »** : les 6 derniers sprints en cartes, comme les prévisions d'une appli météo (icône, indice en grand, météo), la plus récente mise en avant ; un clic ouvre la météo. Pas de carte « Prochaine météo ? » : elle doublonnait « Lancer une météo » du bandeau (retour de l'auteur).
- **Graphique** : chaque colonne est coiffée de l'icône de sa météo.

## Capabilities

### New Capabilities

- `meteo-page-equipe` : en-tête ciel, partage, cartes de prévisions, icônes du graphique.

### Modified Capabilities

_Aucune._ (Les liens, la création, l'historique et l'ouverture d'une météo gardent leurs exigences.)

## Impact

- `site/index.html`, `site/app.css`, `site/js/ui.js`, `site/js/meteo-core.js`. Aucune règle de base à changer.
