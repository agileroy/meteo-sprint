## Context

Dépôt neuf. Le ROTI (`roti`) donne presque tout le modèle : salle à code de 4 lettres, QR code, vue participant au téléphone, vue animateur projetée, présence, vote caché puis révélé, purge à 30 jours, abstraction `firebase-db.js` / `memory-db.js`, mode démo et simulateur de règles. Deux choses sont nouvelles : la **révélation automatique** quand tout le monde a voté, et une **équipe** qui vit plus longtemps qu'une salle et garde un historique.

Le projet Firebase `roti-vleroy` est réutilisé plutôt qu'un nouveau projet (quota de projets gratuits atteint). Les deux outils se jouent dans la même rétro, avec les mêmes personnes, l'un au début et l'autre à la fin : le partage des 100 connexions simultanées de l'offre Spark ne pose pas le problème qui avait fait quitter `poker-planning-vleroy`.

## Goals / Non-Goals

**Goals:**
- Une météo faite en moins d'une minute en début de rétro : QR code projeté, un geste au téléphone, révélation dès que tout le monde a voté.
- Un anonymat réel, garanti par les règles de la base, y compris dans l'historique.
- Un historique par équipe qui survit au navigateur de l'animateur (lien d'animation).
- La même allure que les outils frères, projetée et sur téléphone, en clair et en sombre.

**Non-Goals:**
- Comptes, équipes partagées entre plusieurs animateurs avec des droits différents, export, comparaison entre équipes.
- Garantir l'anonymat statistique des très petites équipes (à 2 votants, chacun devine celui de l'autre) : l'interface le signale, sans l'empêcher.

## Decisions

- **Carte « Rejoindre avec un téléphone »** : même mécanisme que le poker planning (retour de l'auteur) : QR code cliquable qui s'ouvre en grand dans une fenêtre, adresse suivie d'un bouton de copie en un clic (icône qui devient une coche, « Lien copié » pendant 2,5 s, repli par sélection si le presse-papiers est refusé), puis le code en grand pour la projection.

- **Adresses** : accueil `/` ; vue participant `?meteo=CODE` ; vue animateur `?animer=CODE` ; page d'équipe `?equipe=ID` ; prise en main d'une équipe `?equipe=ID&cle=CLE` (`&demo` conservé en mode démo). Le QR code mène à `?meteo=CODE`.

- **Les 5 météos** (valeur = indice) : 5 Grand soleil « Super sprint, j'en redemande », 4 Éclaircies « Bon sprint, quelques nuages », 3 Nuageux « Mitigé, des hauts et des bas », 2 Pluie « Sprint difficile », 1 Orage « Très dur, ça n'a pas été ». Icônes SVG en symboles dans `index.html` (colorées par variables CSS), une couleur par météo (jaune, jaune pâle, gris, bleu, violet), lisibles en clair et en sombre.

- **Données** (branche `meteo`) :
  ```
  meteo/teams/{teamId}/meta             { name, createdAt }
  meteo/teams/{teamId}/secret           clé d'animation (20 caractères), illisible par quiconque
  meteo/teams/{teamId}/owners/{uid}     clé d'animation recopiée : ce navigateur anime l'équipe
  meteo/teams/{teamId}/history/{sid}    { label, date, counts: {1..5}, total }   sid = « {createdAt}-{code} »
  meteo/expiry/{code}                   { createdAt, hostUid }          réservation du code et date de purge
  meteo/sessions/{code}/meta            { teamId, hostUid, createdAt, label, status: open|revealed }
  meteo/sessions/{code}/votes/{uid}     1 à 5
  meteo/sessions/{code}/participants/{uid}/connections/{id}   true (présence, une entrée par onglet)
  ```
  `teamId` : 12 caractères `[a-z0-9]` tirés avec `crypto.getRandomValues`, impossibles à deviner : connaître le lien de l'équipe suffit pour lire son historique, pas pour l'animer.

- **Animer une équipe sans compte** : à la création, le navigateur écrit en une fois `meta`, `secret` et `owners/{uid}` avec la même clé. Les règles n'acceptent `owners/{uid}` que si sa valeur égale `secret`, que personne ne peut lire : le lien d'animation `?equipe=ID&cle=CLE`, affiché une fois à l'animateur (avec un bouton « Copier »), est la seule façon de devenir animateur depuis un autre navigateur. Il sert aussi à un co-animateur. Alternative écartée : animateur = navigateur créateur seulement (comme le ROTI), car un historique de plusieurs mois ne doit pas disparaître avec un `localStorage` vidé.

- **Mes équipes** : les équipes animées sont mémorisées dans le `localStorage` (`meteo.teams`) ; l'accueil les liste avec leur nom, la date de la dernière météo et le nombre de sprints. Une équipe supprimée ou dont ce navigateur n'est plus animateur disparaît de la liste.

- **Révélation automatique** : la vue animateur compte les participants connectés (`participants`, un navigateur compte une fois) et les votes (`votes`, lisibles par l'animateur). Quand il y a au moins un vote et que chaque participant connecté a voté, elle attend 3 secondes (un retardataire qui arrive annule l'attente) puis révèle. « Révéler maintenant » reste disponible pour ne pas attendre quelqu'un qui ne vote pas. Le décompte s'affiche avec un bouton « Attendre ». L'interrupteur « Révélation automatique » est **désactivé par défaut** (retour de l'auteur) et mémorisé dans `meteo.autoReveal` : activé d'office, le premier arrivé qui vote seul déclencherait la révélation si personne ne le suit dans les 3 secondes. C'est une préférence du seul navigateur animateur, pas une donnée de la base. Le navigateur de l'animateur est le seul à écrire `status` : pas de course entre participants, et la révélation ne dépend pas d'un serveur. Un participant qui a voté puis s'est déconnecté reste compté dans les votes. Alternative écartée : nombre de participants attendu saisi par l'animateur, plus fragile (absents, retardataires) que la présence réelle.

- **Révéler écrit l'historique** : une seule écriture groupée passe `status` à `revealed` et écrit `teams/{teamId}/history/{sid}` avec les totaux. Les règles vérifient que l'auteur anime l'équipe et que `total` est la somme des `counts`. « Rouvrir les votes » remet `status` à `open` ; la révélation suivante réécrit la même entrée (clé `sid` = heure de création de la salle et code, car un code de 4 lettres peut resservir après la purge) : un sprint compte une fois.

- **Anonymat** : `votes/{uid}` est indexé par l'identifiant anonyme Firebase, qui n'est relié à aucun nom. Avant la révélation, seul l'animateur lit `votes` (pour compter), et chacun lit son propre vote ; l'écran de l'animateur n'affiche que des compteurs (« 5 votes sur 6 connectés »). Les règles refusent tout vote après la révélation. L'historique ne garde que des totaux, et la salle (donc les votes individuels) est purgée 30 jours après sa création. Sous 3 votes, les résultats portent la mention « Peu de votes : chacun peut deviner le vote des autres. »

- **Lectures par nœud** : pas de règle de lecture globale sur une salle ; l'interface s'abonne à `meta`, à `votes` (animateur, ou participant après la révélation, avec réabonnement au changement d'état) et à son propre vote. Comme pour le ROTI, les tests de `meteo-store` vérifient sur `memory-db.js` que chaque rôle ne lit que les chemins autorisés.

- **Codes et purge** : 4 lettres sans I, L ni O, réservés par une écriture qui échoue si le code existe ; salles supprimables par n'importe qui après 30 jours (2 592 000 000 ms), balayées à chaque création. Les équipes et leur historique ne sont jamais purgés automatiquement ; seul un animateur les supprime, après confirmation.

- **Graphique d'évolution** (page d'équipe) : une colonne par sprint (du plus ancien à gauche au plus récent à droite), haute de l'indice moyen sur un axe de 0 à 5, colorée à l'intérieur selon la répartition des votes, avec l'indice (une décimale, « 3,4 ») au-dessus. Alternative écartée (retour de l'auteur) : barres empilées à 100 % et courbe de l'indice sur un axe de 1 à 5, où une colonne pleine à 4,0 se lisait comme un 5. 12 derniers sprints par défaut, « Tout afficher » au-delà. Un tableau reprend les mêmes chiffres (lisible au lecteur d'écran et sur téléphone). SVG écrit à la main dans `ui.js`, sans bibliothèque.

- **Règles dans le dépôt `roti`** : comme `context-switching-game` dont les règles vivent dans `wip-limit-game`, la branche `meteo` est écrite et testée dans `roti/database.rules.json`, seul fichier publié dans `roti-vleroy`. Ce dépôt n'a pas de job `rules` ; son `README.md` renvoie au dépôt `roti` pour toute modification des règles. Un test de ce dépôt vérifie que les chemins utilisés par `meteo-store.js` commencent tous par `meteo/`. Les tests du store tournent sous les vraies règles : `tests/database.rules.json` est une copie de celui du dépôt `roti`, à recopier quand la branche `meteo` change (les tests de ce dépôt échouent sinon dès qu'un comportement attendu est refusé).

## Risks / Trade-offs

- [Animateur qui perd son navigateur sans avoir gardé le lien d'animation] → l'historique reste lisible par le lien de l'équipe, mais plus personne ne peut lancer de météo pour elle ; l'interface insiste au moment de la création (« Gardez ce lien ») et la page d'équipe permet de le réafficher à un animateur.
- [Règles publiées avant le site, ou l'inverse] → la branche `meteo` est ajoutée au dépôt `roti` et publiée avant la première mise en ligne de la météo ; tant qu'elle manque, la base refuse tout et le site affiche « Service indisponible ».
- [Participant connecté qui ne vote jamais] → pas de révélation automatique ; « Révéler maintenant » règle le cas.
- [Quota partagé avec le ROTI] → les deux outils sont utilisés dans la même réunion par les mêmes personnes ; à surveiller dans l'onglet Utilisation si d'autres équipes s'en servent en même temps.

## Migration Plan

1) L'auteur crée le dépôt public `agileroy/meteo-sprint` et active GitHub Pages par Actions ; 2) le changement `partager-projet-meteo` du dépôt `roti` publie la branche `meteo` ; 3) ce dépôt est poussé, testé et publié ; 4) une météo réelle est faite avec une équipe de test, puis supprimée.

## Open Questions

- Nom définitif de l'outil et du dépôt : « Météo du sprint » / `meteo-sprint` proposé.
