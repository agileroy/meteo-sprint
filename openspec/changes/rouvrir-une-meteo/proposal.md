## Why

Sur la page de l'équipe, on voit l'évolution des météos mais on ne peut pas revenir sur l'une d'elles : la rouvrir pour un retardataire, ou la reprojeter pour en reparler. Et avec beaucoup de sprints, le graphique devient illisible.

## What Changes

- **Rouvrir une météo** : cliquer sur une ligne du tableau ou sur une colonne du graphique ouvre cette météo. Pour le navigateur qui l'a lancée, tant que la salle existe (30 jours), c'est la vue animateur (bulletin, « Rouvrir les votes »). Sinon, c'est son bilan : le bulletin refait à partir des totaux de l'historique, en lecture seule.
- **Graphique limité aux 10 derniers sprints**, sans « Tout afficher » ; le tableau garde tout l'historique.
- **Nom d'un sprint sans libellé** : sa date et son heure (« 27 nov. 16:20 »), pour distinguer deux météos du même jour.

## Capabilities

### New Capabilities

_Aucune._

### Modified Capabilities

- `meteo-historique` : graphique sur les 10 derniers sprints ; ouverture d'une météo depuis le tableau ou le graphique ; bilan d'une météo passée ; nom d'un sprint sans libellé.

## Impact

- `site/js/ui.js`, `site/index.html`, `site/app.css`, `site/js/meteo-core.js`. Aucune règle de base à changer (le bilan lit l'historique, déjà lisible par le lien de l'équipe).
