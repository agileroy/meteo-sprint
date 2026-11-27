## 1. Logique

- [x] 1.1 Ajouter à `meteo-core.js` les éléments du bandeau (répartition) et le ciel d'une météo. Vérification : tests de `tests/meteo-core.test.mjs`.

## 2. Interface

- [x] 2.1 Ciel vivant : calques SVG et CSS derrière la vue participant, neutre puis météo choisie, fondu, jour et nuit, encre de titre contrastée, animations coupées sous « réduire les animations ». Vérification : parcours de démo, captures des 6 ciels en clair et en sombre.
- [x] 2.2 Bulletin : disposition pleine largeur à la révélation (carte « Rejoindre » masquée, revient à la réouverture), carte de l'équipe, prévision, indice, répartition, bandeau défilant (sans comparaison avec les sprints précédents). Vérification : parcours de démo avec un sprint précédent, captures à 1280 et 1440 px et sur téléphone. Fait le 27 novembre 2026 : 21 tests, parcours de démo (ciel neutre puis « pluie », pas de ciel côté animateur, bulletin, carte « Rejoindre » masquée puis revenue), 12 captures de ciels et bulletin à 390, 1280 et 1440 px.

## 3. Vérification et publication

- [x] 3.1 Rejouer le parcours complet de démo et les captures (6 vues × 4 largeurs × 2 thèmes, sans défilement horizontal), puis pousser sur `main` et vérifier la publication. Fait le 27 novembre 2026.
- [ ] 3.2 Validation de l'auteur sur le site publié.

## 4. Retour de l'auteur (27 novembre 2026)

- [x] 4.1 Retirer du bulletin la tendance et l'indice du sprint précédent (bandeau compris), et le code qui ne sert plus (tendance, lecture de l'historique par l'animateur). Vérification : parcours de démo sur deux sprints sans « En hausse » ni « En baisse ». Fait le 27 novembre 2026 : 20 tests, bandeau réduit aux 5 météos, captures refaites.
