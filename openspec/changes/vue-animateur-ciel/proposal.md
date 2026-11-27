## Why

Avant la révélation, la vue animateur (celle que l'animateur partage pendant le vote) est terne : deux compteurs gris et une carte QR code. L'auteur demande le même traitement que la page d'équipe.

## What Changes

- **Haut de page en deux** (trois quarts / un quart), comme la page d'équipe : un bandeau au ciel « aube » avec l'équipe, le libellé, les compteurs, les actions (« Révéler maintenant », révélation automatique, « Retour à l'équipe ») ; la carte « Rejoindre avec un téléphone » à côté.
- **Ciel d'aube** : un nouveau ciel, le même pour toutes les météos, qui attend la révélation sans rien dire des votes (lever de soleil en clair, fin de nuit en sombre).
- **Bulletins de vote** : un petit nuage par participant connecté, qui se coche quand il a voté ; rien n'indique quelle météo.
- **À la révélation** : le bandeau reste en haut (titre, « Rouvrir les votes »), la carte « Rejoindre » disparaît et le bulletin s'affiche dessous en pleine largeur.

## Capabilities

### New Capabilities

- `meteo-vue-animateur` : bandeau d'aube, carte « Rejoindre » à côté, bulletins de vote anonymes.

### Modified Capabilities

_Aucune._

## Impact

- `site/index.html`, `site/app.css`, `site/js/ui.js`, `site/js/meteo-core.js`. Aucune règle de base à changer.
