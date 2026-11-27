## Why

Après la page d'équipe et la vue animateur, l'accueil reste la seule page terne : un titre, deux formulaires côte à côte et une liste. L'auteur demande le même traitement.

## What Changes

- **Haut de page en deux** (trois quarts / un quart) : un bandeau au ciel d'éclaircies avec le titre, l'introduction, les 5 icônes météo et le formulaire « Voter » (code) ; la carte « Animer » (créer une équipe) à côté.
- **Mes équipes en cartes**, comme les cartes de prévisions de la page d'équipe : icône de la dernière météo de l'équipe, son indice, le nom, le nombre de sprints et la date de la dernière météo ; un clic ouvre l'équipe.

## Capabilities

### New Capabilities

- `meteo-accueil` : bandeau d'accueil, carte « Animer », cartes « Mes équipes ».

### Modified Capabilities

_Aucune._ (Les règles de création d'équipe, de saisie du code et de la liste « Mes équipes » restent celles de `meteo-equipe` et `meteo-session`.)

## Impact

- `site/index.html`, `site/app.css`, `site/js/ui.js`. Aucune règle de base à changer.
