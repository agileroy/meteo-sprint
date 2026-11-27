## 1. Logique

- [x] 1.1 Ajouter à `meteo-core.js` la tendance (entrée précédente par date, écart arrondi, sens, seuil de 0,1) et le texte du bandeau. Vérification : tests de `tests/meteo-core.test.mjs` (hausse, baisse, stable, premier sprint, sprint précédent choisi par date).
- [x] 1.2 Ajouter à `meteo-store.js` la lecture de l'historique d'une équipe pour l'animateur. Vérification : `npm test` au vert sous les règles.

## 2. Interface

- [x] 2.1 Ciel vivant : calques SVG et CSS derrière la vue participant, neutre puis météo choisie, fondu, jour et nuit, encre de titre contrastée, animations coupées sous « réduire les animations ». Vérification : parcours de démo, captures des 6 ciels en clair et en sombre.
- [x] 2.2 Bulletin : disposition pleine largeur à la révélation (carte « Rejoindre » masquée, revient à la réouverture), carte de l'équipe, prévision, indice, tendance, répartition, bandeau défilant. Vérification : parcours de démo avec un sprint précédent, captures à 1280 et 1440 px et sur téléphone. Fait le 27 novembre 2026 : 21 tests, parcours de démo (ciel neutre puis « pluie », pas de ciel côté animateur, bulletin sans tendance au premier sprint puis « En baisse : −2,3 », carte « Rejoindre » masquée puis revenue), 12 captures de ciels et bulletin à 390, 1280 et 1440 px.

## 3. Vérification et publication

- [x] 3.1 Rejouer le parcours complet de démo et les captures (6 vues × 4 largeurs × 2 thèmes, sans défilement horizontal), puis pousser sur `main` et vérifier la publication. Fait le 27 novembre 2026.
- [ ] 3.2 Validation de l'auteur sur le site publié.
