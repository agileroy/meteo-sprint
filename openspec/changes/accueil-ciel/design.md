## Context

La page d'équipe et la vue animateur ont un bandeau à ciel (`.hero`, calques de `buildSky`) et une grille trois quarts / un quart. L'accueil reprend ces éléments.

## Goals / Non-Goals

**Goals:**
- Un accueil qui donne le ton de l'outil, et où chacun trouve tout de suite son entrée : voter (le plus fréquent) ou animer.

**Non-Goals:**
- Changer la création d'équipe ou la saisie du code.

## Decisions

- **Ciel « éclaircies »** fixe pour l'accueil : le plus engageant sans être un grand beau temps qui laisserait peu de place au texte.
- **Voter dans le bandeau** : c'est l'action de la majorité (les participants) ; « Animer » dans la carte d'à côté, comme « Partager » et « Rejoindre » sur les autres pages. Empilés sous 860 px, bandeau d'abord.
- **5 icônes météo** sous l'introduction, à la manière d'une légende : elles annoncent le vote.
- **Cartes « Mes équipes »** : même composant visuel que les cartes de prévisions (`forecast-card`) : icône de la météo de l'indice arrondi de la dernière météo (ou un nuage neutre en pointillés sans historique), indice en grand, nom de l'équipe, « 3 sprints · 27 nov. » ; tout la carte est un lien vers l'équipe. Rangée qui passe à la ligne (pas de défilement horizontal : la liste peut être longue).

## Risks / Trade-offs

- [Beaucoup d'équipes] → les cartes passent à la ligne ; la liste reste limitée à 50 équipes par la logique existante.

## Open Questions

_Aucune._
