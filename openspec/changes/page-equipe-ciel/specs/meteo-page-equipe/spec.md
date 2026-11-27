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

### Requirement: Partager
Un bouton « Partager » SHALL ouvrir et fermer un panneau avec le lien public de l'équipe et, pour un animateur, le lien d'animation, chacun copiable. Juste après la création de l'équipe, le panneau SHALL être ouvert avec le lien d'animation visible et le message « Gardez ce lien ».

#### Scenario: Équipe qui vient d'être créée
- **GIVEN** l'accueil
- **WHEN** l'animateur crée l'équipe « Phénix »
- **THEN** la page de l'équipe s'ouvre avec le panneau « Partager » ouvert et le lien d'animation affiché

### Requirement: Cartes des dernières météos
La page d'équipe SHALL montrer les 6 derniers sprints en cartes, du plus ancien au plus récent, chacune avec le nom du sprint, l'icône de sa météo, son indice en grand et le nom de sa météo ; la plus récente SHALL être mise en avant. Cliquer une carte SHALL ouvrir la météo comme depuis le tableau. Pour un animateur, une dernière carte « Prochaine météo ? » SHALL placer le curseur dans le champ du libellé.

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
