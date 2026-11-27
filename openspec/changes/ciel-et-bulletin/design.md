## Context

Choix de l'auteur parmi trois pistes maquettées : « ciel vivant » pour le vote, « bulletin télé » pour la révélation (combinaison A + B). Usage principal sur ordinateur, avec partage d'écran de l'animateur.

## Goals / Non-Goals

**Goals:**
- Un retour visuel immédiat et joyeux au moment du vote, sans gêner la lecture.
- Une révélation lisible à distance (partage d'écran, vignette de visio).
- Aucun coût de chargement notable : décor en SVG et CSS, pas d'image.

**Non-Goals:**
- Décor des autres écrans ; personnalisation par équipe.

## Decisions

- **Ciel en calques** : un conteneur fixe derrière la page (`#sky`, `aria-hidden`) porte six calques (neutre et une par météo), chacun avec son dégradé et ses éléments (soleil, nuages, gouttes, éclair) ; seul le calque actif est opaque, avec un fondu de 0,8 s (les dégradés CSS ne se fondent pas entre eux, des calques si). Le calque est choisi par `data-sky` sur `<body>`, piloté par la vue participant : neutre sans vote, sinon la météo du participant. Il suit son choix après la révélation ; il ne reflète jamais les votes des autres. Les autres écrans n'ont pas de ciel.
- **Jour et nuit** : en thème sombre, les mêmes calques passent en ciel de nuit (bleus profonds, soleil voilé en lune), par variables CSS.
- **Lisibilité** : la carte de vote et les résultats restent sur des panneaux opaques ; le titre au-dessus prend une couleur d'encre propre à chaque ciel (`--sky-ink`), contrastée.
- **Animations** : dérive des nuages (60 à 120 s), pluie en traits qui tombent, éclair bref toutes les 6 s ; toutes coupées sous `prefers-reduced-motion: reduce` (décor statique).
- **Bulletin** : à la révélation, la vue animateur passe en disposition pleine largeur (la carte « Rejoindre » est masquée ; « Rouvrir les votes » la fait revenir). Le bulletin a ses propres couleurs (bleu nuit, bandeau jaune) dans les deux thèmes, comme un plateau télé. La « carte » est une forme fixe où chaque météo votée apparaît à son emplacement, d'autant plus grande qu'elle a de votes. Le bandeau défile (pause au survol, figé sous animations réduites) et reprend la répartition. Pas de tendance ni d'indice d'un autre sprint : la révélation parle du sprint en cours, l'évolution se lit sur la page d'équipe (retour de l'auteur, qui a écarté une première version avec « En hausse : +0,5 par rapport à … »).
- **Données** : rien de nouveau n'est lu ni écrit.

## Risks / Trade-offs

- [Distraction pendant le vote] → animations lentes et discrètes, panneau de vote opaque.
- [Un voisin voit le ciel de mon écran] → c'est le cas aussi de la météo choisie à l'écran ; en visio chacun vote sur son propre écran, et la vue animateur n'a jamais de ciel avant la révélation.

## Open Questions

_Aucune._
