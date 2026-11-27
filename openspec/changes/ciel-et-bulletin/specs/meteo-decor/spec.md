## ADDED Requirements

### Requirement: Ciel de la vue participant
La vue participant SHALL avoir pour fond un ciel qui suit la météo choisie par ce participant : ciel neutre tant qu'il n'a pas choisi, puis grand soleil, éclaircies, nuages, pluie ou orage. Changer de météo SHALL changer le ciel en fondu. Le ciel MUST NOT dépendre des votes des autres participants, ni apparaître sur la vue animateur.

#### Scenario: Le ciel suit le choix
- **GIVEN** un participant qui n'a pas encore voté, devant un ciel neutre
- **WHEN** il choisit « Pluie »
- **THEN** le fond passe en ciel de pluie, avec des gouttes qui tombent derrière la carte de vote

#### Scenario: Retour sur la page
- **GIVEN** un participant qui a choisi « Grand soleil »
- **WHEN** il recharge la page
- **THEN** le ciel de grand soleil est de nouveau affiché

### Requirement: Ciel lisible et discret
La carte de vote et les résultats SHALL rester sur des panneaux opaques au-dessus du ciel, et le titre de la page SHALL rester contrasté sur chaque ciel. En thème sombre, le ciel SHALL être un ciel de nuit. Pour qui a demandé à réduire les animations, le ciel SHALL être fixe.

#### Scenario: Animations réduites
- **GIVEN** un appareil réglé pour réduire les animations
- **WHEN** le participant choisit « Orage »
- **THEN** le ciel d'orage s'affiche sans nuages qui dérivent, ni pluie qui tombe, ni éclair

### Requirement: Bulletin de révélation
À la révélation, la vue animateur SHALL présenter les résultats comme un bulletin météo télé, en pleine largeur : bandeau « Bulletin météo » avec le nom de l'équipe et le libellé, carte de l'équipe montrant chaque météo votée d'autant plus grande qu'elle a de votes, prévision (météo la plus choisie, ou les ex æquo), indice moyen en grand sur 5, nombre de votes et barre de répartition.

#### Scenario: Révélation partagée
- **GIVEN** une météo avec 2 Grand soleil, 3 Éclaircies et 1 Nuageux
- **WHEN** l'animateur révèle
- **THEN** son écran affiche le bulletin en pleine largeur avec la prévision « Éclaircies », l'indice « 4,2 / 5 » et « 6 votes »

### Requirement: Carte « Rejoindre » masquée pendant le bulletin
La carte « Rejoindre avec un téléphone » SHALL être masquée tant que les résultats sont révélés, et revenir avec « Rouvrir les votes ».

#### Scenario: Retardataire après la révélation
- **GIVEN** le bulletin affiché
- **WHEN** l'animateur clique sur « Rouvrir les votes »
- **THEN** le bulletin disparaît et la carte avec le QR code, le lien et le code revient

### Requirement: Bandeau du bulletin, sans comparaison
Un bandeau en bas du bulletin SHALL faire défiler la répartition par météo du sprint révélé ; il SHALL être fixe pour qui a demandé à réduire les animations. Le bulletin MUST NOT comparer le sprint aux sprints précédents (ni tendance, ni indice d'un autre sprint) : l'évolution se lit sur la page de l'équipe.

#### Scenario: Révélation sans comparaison
- **GIVEN** une équipe dont le sprint précédent avait un indice de 3,1
- **WHEN** la météo suivante est révélée avec un indice de 3,6
- **THEN** le bulletin affiche « 3,6 / 5 » sans « En hausse » ni l'indice du sprint précédent, et le bandeau ne fait défiler que la répartition
