## ADDED Requirements

### Requirement: Bandeau d'aube de la vue animateur
Avant la révélation, la vue animateur SHALL s'ouvrir sur un bandeau au ciel d'aube, le même quelle que soit la météo, avec le nom de l'équipe, la date, le libellé, « Retour à l'équipe », les compteurs de votes et de connectés, « Révéler maintenant » et l'interrupteur « Révélation automatique ». Le ciel MUST NOT dépendre des votes en cours ni de l'historique de l'équipe.

#### Scenario: Vote en cours
- **GIVEN** une météo avec 2 votes « Orage » sur 3 connectés
- **WHEN** l'animateur partage son écran
- **THEN** le bandeau montre le ciel d'aube et « 2 votes sur 3 connectés », sans rien qui évoque un orage

### Requirement: Carte « Rejoindre » à côté du bandeau
La carte « Rejoindre avec un téléphone » SHALL être affichée à côté du bandeau (un quart de la largeur sur ordinateur, dessous sur téléphone), et masquée à la révélation.

#### Scenario: Écran d'ordinateur
- **GIVEN** une vue animateur sur un écran de 1280 px
- **WHEN** la météo est ouverte au vote
- **THEN** le bandeau occupe environ les trois quarts de la largeur et la carte « Rejoindre » le quart restant

### Requirement: Bulletins de vote anonymes
Le bandeau SHALL montrer un petit nuage par participant connecté ou ayant voté : en pointillés tant qu'il n'a pas voté, plein et coché dès qu'il a voté, sans jamais indiquer la météo choisie. Au-delà de 24 participants, les suivants SHALL être résumés par « +N ».

#### Scenario: Un vote arrive
- **GIVEN** 3 participants connectés dont aucun n'a voté
- **WHEN** l'un d'eux vote
- **THEN** un nuage sur trois se coche, et les compteurs passent à « 1 vote sur 3 connectés »

### Requirement: Révélation sous le bandeau
À la révélation, le bandeau SHALL rester en haut avec le titre et « Rouvrir les votes », la carte « Rejoindre », les compteurs et les bulletins SHALL être masqués, et le bulletin météo SHALL s'afficher dessous en pleine largeur.

#### Scenario: Révéler
- **GIVEN** une météo avec des votes
- **WHEN** l'animateur clique sur « Révéler maintenant »
- **THEN** le bulletin s'affiche sous le bandeau, et « Rouvrir les votes » remplace « Révéler maintenant »
