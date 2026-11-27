## Why

Les rétrospectives de l'auteur commencent par un ice breaker, aujourd'hui improvisé. La « météo du sprint » en est la première brique : chacun dit en un geste comment il a vécu le sprint, l'équipe voit la tendance d'un coup, et l'animateur sait sur quel ton ouvrir la rétro. Faite à main levée, elle n'est ni anonyme (on s'aligne sur les premiers qui parlent) ni mémorisée (impossible de voir que l'équipe glisse de « Éclaircies » vers « Pluie » depuis trois sprints).

## What Changes

- **Nouveau dépôt `meteo-sprint`**, publié sur https://agileroy.github.io/meteo-sprint/, sur le modèle du ROTI (salle à code, QR code, vote au téléphone, révélation).
- **Équipes** : l'animateur crée une équipe (un nom), retrouve ses équipes dans son navigateur, et peut confier l'animation à un autre navigateur ou à un co-animateur par un lien d'animation.
- **Météo d'un sprint** : depuis une équipe, l'animateur lance une météo (libellé facultatif, ex. « Sprint 42 ») ; les participants choisissent anonymement l'une des 5 météos et peuvent changer d'avis jusqu'à la révélation.
- **Révélation** : automatique dès que tous les participants connectés ont voté, ou à la demande de l'animateur (« Révéler maintenant ») ; tout le monde voit alors la répartition et l'indice moyen.
- **Historique de l'équipe** : à chaque révélation, les seuls totaux (nombre de votes par météo) sont ajoutés à l'historique de l'équipe ; une page d'équipe montre l'évolution sprint après sprint (graphique et tableau).
- **Base** : branche `meteo` du projet Firebase `roti-vleroy`, partagé avec le ROTI ; les règles sont écrites, testées et publiées par le dépôt `roti` (changement `partager-projet-meteo` de ce dépôt).
- **Carte « Météo du sprint »** sur https://agileroy.github.io/outils/.

Hors périmètre : les autres ice breakers (questions, ceci-ou-cela…), les commentaires libres, les comptes, l'export, la comparaison entre équipes.

## Capabilities

### New Capabilities

- `meteo-equipe` : création d'une équipe, liste « Mes équipes », lien d'animation, suppression.
- `meteo-session` : lancement d'une météo, code et QR code, présence, révélation automatique ou manuelle, purge après 30 jours.
- `meteo-vote` : la vue participant, les 5 météos, changement d'avis, anonymat, votes cachés avant la révélation.
- `meteo-historique` : totaux conservés à chaque révélation, page d'évolution de l'équipe.
- `site-publication` : publication sur GitHub Pages, base partagée avec le ROTI, aucune ressource externe.

### Modified Capabilities

_Aucune (dépôt neuf)._

## Impact

- Nouveau dépôt `agileroy/meteo-sprint` (à créer par l'auteur, public).
- Dépôt `roti` : branche `meteo` ajoutée à `database.rules.json` et à ses tests (changement `partager-projet-meteo`).
- Projet Firebase `roti-vleroy` : aucun réglage à changer (connexion anonyme et domaine `agileroy.github.io` déjà en place) ; quota de 100 connexions simultanées partagé entre la météo et le ROTI d'une même rétro, sans recouvrement en pratique.
- Dépôt `agileroy.github.io` : carte ajoutée dans la page des outils.
