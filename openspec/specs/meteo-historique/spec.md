# meteo-historique Specification

## Purpose

TBD - created by archiving change creer-meteo. Update Purpose after archive.

## Requirements

### Requirement: Totaux conservés à la révélation
Chaque révélation SHALL inscrire dans l'historique de l'équipe une entrée pour la salle : libellé, date de création de la salle, nombre de votes par météo et nombre total de votes. L'entrée MUST NOT contenir de vote individuel ni d'identifiant de participant. Une nouvelle révélation de la même salle (après « Rouvrir les votes ») SHALL remplacer son entrée, sans en ajouter une seconde.

#### Scenario: Révélation puis réouverture
- **GIVEN** une salle révélée avec 6 votes, inscrite dans l'historique
- **WHEN** l'animateur rouvre les votes, un septième participant vote, puis la salle est révélée de nouveau
- **THEN** l'historique compte une seule entrée pour ce sprint, avec 7 votes

### Requirement: Historique contrôlé par la base
La base SHALL refuser une entrée d'historique écrite par un navigateur qui n'anime pas l'équipe, ou dont le total n'est pas la somme des votes par météo.

#### Scenario: Total incohérent
- **GIVEN** un animateur dont le navigateur a été modifié
- **WHEN** il écrit une entrée avec 3 votes par météo et un total de 20
- **THEN** la base refuse l'écriture

#### Scenario: Historique falsifié
- **GIVEN** un participant qui connaît le lien public de l'équipe
- **WHEN** il tente d'écrire une entrée dans l'historique
- **THEN** la base refuse l'écriture

### Requirement: Graphique d'évolution
La page d'une équipe SHALL afficher un graphique de son historique, du sprint le plus ancien au plus récent, sur un axe de 0 à 5 : pour chaque sprint, une colonne dont la hauteur est l'indice moyen de l'équipe sur ce sprint, colorée à l'intérieur selon la répartition des votes (part de chaque météo, couleurs des météos), avec l'indice écrit au-dessus. Sans historique, la page SHALL afficher « Pas encore de météo pour cette équipe. ».

#### Scenario: Tendance qui se dégrade
- **GIVEN** une équipe avec trois sprints d'indice 4,2, 3,5 et 2,8
- **WHEN** quelqu'un ouvre la page de l'équipe
- **THEN** les trois colonnes s'arrêtent à 4,2, 3,5 et 2,8 sur l'axe de 0 à 5, et le tableau affiche « 4,2 », « 3,5 » et « 2,8 »

#### Scenario: Un seul vote Éclaircies
- **GIVEN** un sprint avec un seul vote, « Éclaircies »
- **WHEN** quelqu'un ouvre la page de l'équipe
- **THEN** sa colonne, entièrement de la couleur d'Éclaircies, monte jusqu'à 4 sur l'axe, et non jusqu'en haut

#### Scenario: Survol d'un sprint
- **GIVEN** le graphique d'évolution
- **WHEN** l'utilisateur survole ou touche la barre d'un sprint
- **THEN** une bulle affiche son libellé, sa date, la répartition et l'indice

### Requirement: Lecture et étendue du graphique
Une mention sous le graphique SHALL expliquer sa lecture : « Hauteur de la colonne : indice moyen de l'équipe, sur 5. Couleurs : répartition des votes. ». Le graphique SHALL montrer les 12 derniers sprints, avec « Tout afficher » au-delà.

#### Scenario: Plus de 12 sprints
- **GIVEN** une équipe avec 14 sprints d'historique
- **WHEN** quelqu'un clique sur « Tout afficher »
- **THEN** le graphique montre les 14 colonnes, au lieu des 12 dernières

### Requirement: Tableau de l'historique
Sous le graphique, un tableau SHALL reprendre, pour chaque sprint, le libellé, la date, le nombre de votes par météo, le total et l'indice, pour une lecture au lecteur d'écran ou sur téléphone.

#### Scenario: Lecture sur téléphone
- **GIVEN** une équipe avec 5 sprints d'historique
- **WHEN** un membre ouvre la page de l'équipe sur son téléphone
- **THEN** le tableau affiche les 5 sprints sans défilement horizontal de la page

### Requirement: Retirer un sprint de l'historique
Un animateur SHALL pouvoir retirer une entrée de l'historique après confirmation (ex. une météo lancée par erreur).

#### Scenario: Météo de test
- **GIVEN** une entrée « Test » dans l'historique
- **WHEN** l'animateur clique sur « Retirer » sur sa ligne et confirme
- **THEN** l'entrée disparaît du tableau et du graphique
