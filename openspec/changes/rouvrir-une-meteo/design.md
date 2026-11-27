## Context

L'historique garde, pour chaque météo révélée, les totaux et la clé `sid` (« heure de création-code »). La salle elle-même (votes, état) est purgée 30 jours après sa création, et seule la vue animateur du navigateur qui l'a lancée permet de rouvrir les votes (règle `meta.hostUid`).

## Goals / Non-Goals

**Goals:**
- Un clic sur un sprint mène toujours quelque part d'utile : la salle si on peut l'animer, sinon le bilan.
- Un graphique lisible quel que soit l'âge de l'équipe.

**Non-Goals:**
- Rouvrir les votes d'une salle purgée, ou depuis un autre navigateur que celui qui l'a lancée (il faudrait changer les règles).

## Decisions

- **Adresse du bilan** : `?equipe=ID&sprint=SID`. Au chargement, la page lit la salle `CODE` tirée du `sid` : si elle existe, a la même heure de création et a été lancée par ce navigateur, elle redirige vers `?animer=CODE`. Sinon elle affiche le bilan : en-tête (équipe, libellé, date), le même bulletin que la révélation, construit avec les totaux de l'entrée, une note qui dit pourquoi on ne peut pas rouvrir (« Les votes de cette météo ont été effacés : seul le bilan est conservé. » au-delà de 30 jours, « Seul le navigateur qui a lancé cette météo peut rouvrir ses votes. » sinon) et « Retour à l'équipe ». Si l'entrée n'existe plus (retirée), retour à la page d'équipe.
- **Bulletin à partir de totaux** : `renderBulletin` prend désormais des totaux (`counts`) ; la vue animateur les calcule à partir des votes.
- **Clic** : dans le tableau, le nom du sprint est un lien, et toute la ligne est cliquable (sauf le bouton « Retirer ») ; dans le graphique, cliquer une colonne, ou Entrée quand elle a le focus, ouvre la météo. Le survol et le focus continuent d'afficher la bulle, qui mentionne « Cliquez pour ouvrir ».
- **10 derniers sprints** sur le graphique, sans bouton ; le tableau, du plus récent au plus ancien, garde tout.
- **Nom sans libellé** : date courte et heure (« 27 nov. 16:20 ») au lieu de la date seule.

## Risks / Trade-offs

- [Un clic involontaire sur le graphique quitte la page] → retour par « Retour à l'équipe » ou le bouton précédent du navigateur (l'adresse change).
- [Sur téléphone, toucher une colonne ouvre la météo sans montrer la bulle] → le tableau donne les mêmes chiffres.

## Open Questions

_Aucune._
