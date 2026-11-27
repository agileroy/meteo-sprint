## ADDED Requirements

### Requirement: Site statique publié par GitHub Pages
À chaque push sur `main`, après la réussite des tests, GitHub Actions SHALL publier le dossier `site/` sur https://agileroy.github.io/meteo-sprint/, en versionnant les fichiers pour éviter les anciennes versions en cache. Un test qui échoue SHALL bloquer la publication.

#### Scenario: Test en échec
- **GIVEN** un push sur `main` dont un test échoue
- **WHEN** le workflow s'exécute
- **THEN** le site n'est pas publié

### Requirement: Base partagée avec le ROTI
La météo SHALL utiliser la Realtime Database du projet `roti-vleroy`, et SHALL ne lire et n'écrire que sous la branche `meteo`. Ce dépôt MUST NOT publier de règles : celles de la branche `meteo` sont dans `database.rules.json` du dépôt `roti`.

#### Scenario: Chemin hors de la branche
- **GIVEN** une modification de `meteo-store.js` qui écrit sous `roti/`
- **WHEN** les tests s'exécutent
- **THEN** un test échoue et le site n'est pas publié

### Requirement: Aucune ressource externe
Le site SHALL ne charger que ses propres fichiers et le SDK Firebase (gstatic.com, comme les outils frères) : ni police web, ni autre CDN, ni traceur, ni publicité. En mode démo (`?demo`), aucune requête ne SHALL sortir du site.

#### Scenario: Mode démo
- **GIVEN** le site ouvert avec `?demo`
- **WHEN** un parcours complet est joué (équipe, météo, votes, révélation, historique)
- **THEN** aucune requête ne part vers un autre domaine

### Requirement: Service injoignable
Si Firebase est injoignable ou refuse l'accès, le site SHALL afficher « Service indisponible : réessayez depuis votre téléphone, hors VPN. » plutôt qu'une page vide.

#### Scenario: VPN de l'entreprise
- **GIVEN** un ordinateur dont le proxy bloque Firebase
- **WHEN** l'utilisateur ouvre le site
- **THEN** le message « Service indisponible » s'affiche
