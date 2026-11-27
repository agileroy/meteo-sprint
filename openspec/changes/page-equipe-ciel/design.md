## Context

Le ciel vivant (changement `ciel-et-bulletin`) est un empilement de calques SVG et CSS piloté par `data-sky`. La page d'équipe le réutilise dans un bandeau.

## Goals / Non-Goals

**Goals:**
- Une page d'équipe qui ressemble au reste de l'outil, et dont l'action principale saute aux yeux.
- Un historique qui donne envie de cliquer.

**Non-Goals:**
- Changer les données ou les règles.

## Decisions

- **Météo d'un sprint pour l'icône et le ciel** : celle de l'indice arrondi (4,7 → Grand soleil, 4,3 → Éclaircies), une seule icône même en cas d'égalité de votes ; le bulletin, lui, garde « la plus choisie ». Équipe sans historique : ciel neutre.
- **Ciel réutilisé** : `buildSky` construit les mêmes calques dans le bandeau (`.hero-sky`), activés par `data-sky` sur le bandeau. Les positions passent en unités de conteneur (`cqw`, `cqh`, avec `container-type: size`) pour que le même décor tienne dans la page entière et dans le bandeau.
- **Lisibilité** : le titre prend l'encre du ciel (`--sky-ink`) ; les boutons et le champ du libellé restent sur fond opaque ; dans le bandeau, nuages réduits de moitié (trois par calque au plus) et soleil en bas à droite ; sur téléphone, le bandeau ne garde que la couleur du ciel, la pluie et les étoiles.
- **Partager** : bouton à bascule (`aria-expanded`) qui ouvre un panneau sous le bandeau, avec le lien public, et pour l'animateur le lien d'animation (masqué derrière « Afficher ») et l'encart « Gardez ce lien » juste après la création.
- **Cartes** : les 6 derniers sprints, du plus ancien au plus récent, dans une rangée qui défile horizontalement si la place manque (sans faire défiler la page) ; carte la plus récente mise en avant ; chaque carte est un bouton qui ouvre la météo (`?equipe=ID&sprint=SID`). Pour l'animateur, une carte en pointillés « Prochaine météo ? » place le curseur dans le libellé.
- **Icônes du graphique** : au-dessus de l'indice de chaque colonne, taille adaptée à la largeur des colonnes.

## Risks / Trade-offs

- [Unités de conteneur] → prises en charge par les navigateurs récents (Chrome et Edge 105, Safari 16, Firefox 110) ; ailleurs, le décor se place mal mais la page reste utilisable.

## Open Questions

_Aucune._
