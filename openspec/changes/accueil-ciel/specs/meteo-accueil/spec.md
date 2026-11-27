## ADDED Requirements

### Requirement: Bandeau d'accueil
L'accueil SHALL s'ouvrir sur un bandeau au ciel d'éclaircies avec le titre « Quel temps a-t-il fait sur votre sprint ? », l'introduction, les icônes des 5 météos et le formulaire « Voter » (code de la salle et « Rejoindre »).

#### Scenario: Participant qui arrive sur l'accueil
- **GIVEN** l'accueil
- **WHEN** un participant saisit le code « KRTW » dans le bandeau et clique sur « Rejoindre »
- **THEN** il arrive sur la vue participant de la salle

### Requirement: Carte « Animer » à côté du bandeau
La carte « Animer », avec le nom de l'équipe et « Créer une équipe », SHALL être affichée à côté du bandeau (un quart de la largeur sur ordinateur, dessous sur téléphone).

#### Scenario: Écran d'ordinateur
- **GIVEN** l'accueil sur un écran de 1280 px
- **WHEN** la page s'affiche
- **THEN** le bandeau occupe environ les trois quarts de la largeur et la carte « Animer » le quart restant

### Requirement: Mes équipes en cartes
« Mes équipes » SHALL présenter chaque équipe en carte, comme les cartes de prévisions de la page d'équipe : icône de la météo de sa dernière météo (indice arrondi), indice, nom de l'équipe, nombre de sprints et date de la dernière météo, ou « Aucune météo » avec une icône neutre. Cliquer une carte SHALL ouvrir l'équipe.

#### Scenario: Équipe avec historique
- **GIVEN** une équipe « CDP » animée depuis ce navigateur, dont la dernière météo a un indice de 4,7, sur 3 sprints
- **WHEN** l'animateur ouvre l'accueil
- **THEN** il voit une carte « CDP » avec l'icône Grand soleil, « 4,7 / 5 » et « 3 sprints », qui ouvre l'équipe au clic
