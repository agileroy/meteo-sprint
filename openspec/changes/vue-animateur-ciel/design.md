## Context

La page d'équipe a déjà un bandeau à ciel (calques de `buildSky` dans `.hero-sky`) et une grille trois quarts / un quart. La vue animateur garde ses compteurs, sa révélation automatique et son bulletin.

## Goals / Non-Goals

**Goals:**
- Une vue animateur vivante pendant le vote, cohérente avec la page d'équipe.
- Aucun indice sur le contenu des votes avant la révélation.

**Non-Goals:**
- Changer la logique de révélation.

## Decisions

- **Ciel « aube »** : septième calque de `buildSky`, toujours le même avant la révélation (ni la dernière météo de l'équipe, ni les votes en cours, pour ne rien suggérer) : dégradé de lever du jour, soleil à moitié levé, deux nuages ; en sombre, fin de nuit avec étoiles et lune basse.
- **Mise en page** : `.host-top` en grille 3fr / 1fr (empilée sous 860 px). Le bandeau porte le titre, « Retour à l'équipe », les compteurs (fond opaque), les bulletins, l'aide, le décompte, « Révéler maintenant » / « Rouvrir les votes » et l'interrupteur. À la révélation, la grille passe à une colonne, la carte « Rejoindre », les compteurs et les bulletins sont masqués, le bulletin s'affiche sous le bandeau.
- **Bulletins** : un élément par participant connecté ou ayant voté, trié par identifiant anonyme (un ordre qui ne dit rien de l'arrivée), nuage en pointillés s'il n'a pas voté, nuage plein coché s'il a voté, petite animation à la coche ; au-delà de 24, « +N ». Logique dans `meteo-core.js` (`ballotsOf`), testée.

## Risks / Trade-offs

- [L'ordre des bulletins pourrait relier un nuage à une personne] → tri par identifiant anonyme aléatoire, et la coche ne dit que « a voté », ce que les compteurs disaient déjà.

## Open Questions

_Aucune._
