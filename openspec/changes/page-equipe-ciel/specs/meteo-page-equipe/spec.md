## ADDED Requirements

### Requirement: En-tête « ciel de l'équipe »
La page d'équipe SHALL s'ouvrir sur un bandeau dont le fond est le ciel de la dernière météo de l'équipe (celle de son indice arrondi), ou un ciel neutre sans historique. Le bandeau SHALL montrer le nom de l'équipe et la dernière météo (« Grand soleil · 4,7 / 5 · 3 sprints »), ou « Pas encore de météo ».

#### Scenario: Dernière météo ensoleillée
- **GIVEN** une équipe dont la dernière météo a un indice de 4,7
- **WHEN** quelqu'un ouvre la page de l'équipe
- **THEN** le bandeau affiche un ciel de grand soleil et « Grand soleil · 4,7 / 5 · 3 sprints »

### Requirement: Lancer une météo depuis le bandeau
Pour un animateur, le bandeau SHALL porter l'action principale : un champ de libellé facultatif (prérempli comme avant) et le bouton « Lancer une météo ». Le renommage et la suppression de l'équipe SHALL rester accessibles depuis le bandeau. Le lien public ne SHALL montrer aucune de ces actions.

#### Scenario: Lien public
- **GIVEN** le lien public de l'équipe
- **WHEN** un membre l'ouvre
- **THEN** il voit le bandeau sans champ de libellé ni bouton « Lancer une météo », « Renommer » ou « Supprimer l'équipe »

### Requirement: Carte « Partager » toujours visible
À côté du bandeau (un quart de la largeur sur ordinateur, dessous sur téléphone), une carte « Partager » SHALL toujours montrer le QR code du lien public de l'équipe, agrandissable d'un clic, et ce lien suivi d'un bouton qui le copie en un clic (« Lien copié »), comme la carte « Rejoindre » de la vue animateur.

#### Scenario: Partager l'historique
- **GIVEN** la page d'une équipe
- **WHEN** l'animateur clique sur le bouton de copie de la carte « Partager »
- **THEN** le lien public est copié et « Lien copié » s'affiche

### Requirement: Lien d'animation à la demande
Pour un animateur, la carte « Partager » SHALL proposer « Lien d'animation », qui ouvre un encart pleine largeur avec ce lien, copiable, et l'explication de son usage. Juste après la création de l'équipe, cet encart SHALL être ouvert avec le message « Gardez ce lien ». Le lien public ne SHALL pas proposer le lien d'animation.

#### Scenario: Équipe qui vient d'être créée
- **GIVEN** l'accueil
- **WHEN** l'animateur crée l'équipe « Phénix »
- **THEN** la page de l'équipe s'ouvre avec l'encart du lien d'animation ouvert et « Gardez ce lien »

### Requirement: Cartes des dernières météos
La page d'équipe SHALL montrer les 6 derniers sprints en cartes, du plus ancien au plus récent, chacune avec le nom du sprint, l'icône de sa météo, son indice en grand et le nom de sa météo ; la plus récente SHALL être mise en avant. Cliquer une carte SHALL ouvrir la météo comme depuis le tableau. Les cartes ne SHALL pas proposer de lancer une météo : cette action reste unique, dans le bandeau.

#### Scenario: Ouvrir depuis une carte
- **GIVEN** une équipe avec 3 sprints
- **WHEN** quelqu'un clique sur la carte du sprint « 27 nov. 15:56 »
- **THEN** la météo de ce sprint s'ouvre (vue animateur ou bilan)

### Requirement: Icônes du graphique
Chaque colonne du graphique d'évolution SHALL être coiffée de l'icône de la météo de son indice arrondi, au-dessus de l'indice.

#### Scenario: Colonne à 4,3
- **GIVEN** un sprint d'indice 4,3
- **WHEN** la page d'équipe s'affiche
- **THEN** sa colonne porte l'icône Éclaircies au-dessus de « 4,3 »
