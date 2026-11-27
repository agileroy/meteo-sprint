## 1. Interface

- [x] 1.1 Graphique limité aux 10 derniers sprints, sans « Tout afficher » ; nom d'un sprint sans libellé par date et heure. Vérification : `tests/meteo-core.test.mjs` et parcours de démo avec 14 sprints (10 colonnes, 14 lignes).
- [x] 1.2 Ouverture depuis le tableau (lien et ligne cliquable, sauf « Retirer ») et depuis le graphique (clic, Entrée) ; redirection vers la vue animateur si ce navigateur a lancé la salle et qu'elle existe ; sinon bilan `?equipe=ID&sprint=SID`. Vérification : parcours de démo (salle existante, salle supprimée, lien public).
- [x] 1.3 Bilan : bulletin construit à partir des totaux, note sur la réouverture, « Retour à l'équipe ». Vérification : captures à 390 et 1280 px.

## 2. Publication

- [x] 2.1 Rejouer le parcours complet et les contrôles d'affichage, pousser sur `main`, vérifier la publication. Fait le 27 novembre 2026 : 21 tests ; parcours de démo (10 colonnes et 14 lignes, bilan d'une salle effacée, vue animateur d'une salle à soi, Entrée au clavier, bilan depuis le lien public) ; 7 vues × 4 largeurs × 2 thèmes sans débordement.
- [ ] 2.2 Validation de l'auteur.
