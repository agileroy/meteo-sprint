## ADDED Requirements

### Requirement: Lancer une météo
Depuis la page d'une équipe, un animateur SHALL pouvoir cliquer sur « Lancer une météo », avec un libellé facultatif de 40 caractères au plus (proposé : « Sprint N+1 » si le dernier libellé finit par un nombre N). Une salle SHALL être créée avec un code libre de 4 lettres (sans I, L ni O). L'animateur SHALL arriver sur la vue animateur, qui affiche le nom de l'équipe, le libellé et la carte « Rejoindre avec un téléphone ».

#### Scenario: Météo du sprint suivant
- **GIVEN** une équipe dont la dernière météo s'appelle « Sprint 41 »
- **WHEN** l'animateur clique sur « Lancer une météo » sans changer le libellé proposé
- **THEN** une salle « Sprint 42 » est créée et la vue animateur affiche le code, l'adresse avec son bouton de copie, le QR code et « 0 vote sur 0 connecté »

### Requirement: Carte « Rejoindre avec un téléphone »
Comme celle du poker planning, la carte SHALL montrer un QR code menant à la vue participant, qui s'agrandit d'un clic, l'adresse à ouvrir suivie d'un bouton qui la copie en un clic (« Lien copié »), et le code en grand.

#### Scenario: Partager le lien en un clic
- **GIVEN** la vue animateur d'une météo
- **WHEN** l'animateur clique sur le bouton de copie à côté de l'adresse
- **THEN** l'adresse de la vue participant est copiée, le bouton montre une coche et « Lien copié » s'affiche quelques secondes

#### Scenario: QR code agrandi
- **GIVEN** la vue animateur projetée
- **WHEN** l'animateur clique sur le QR code
- **THEN** une fenêtre l'affiche en grand avec l'adresse et le code, et se ferme par « Fermer » ou un clic à côté

### Requirement: Rejoindre une météo
Un participant SHALL rejoindre la salle en scannant le QR code, en ouvrant `?meteo=CODE`, ou en saisissant le code à l'accueil (majuscules et espaces ignorés). Aucun compte ni prénom n'est demandé. Un code invalide ou inconnu SHALL être signalé (« Le code fait 4 lettres. », « Aucune météo avec ce code. »).

#### Scenario: Code saisi en minuscules
- **GIVEN** une salle de code `KRTW`
- **WHEN** un participant saisit « k rtw » à l'accueil
- **THEN** il arrive sur la vue participant de la salle

### Requirement: Vue animateur réservée
La vue animateur `?animer=CODE` SHALL n'être affichée qu'au navigateur qui a créé la salle ; un autre navigateur SHALL être renvoyé vers la vue participant. L'animateur peut donc voter depuis son téléphone.

#### Scenario: Lien animateur ouvert sur un téléphone
- **GIVEN** une salle créée sur l'ordinateur de l'animateur
- **WHEN** un participant ouvre `?animer=CODE`
- **THEN** il arrive sur la vue participant

### Requirement: Présence et compteurs
Avant la révélation, la vue animateur SHALL afficher en temps réel le nombre de votes et le nombre de participants connectés (« 4 votes sur 6 connectés »), sans aucune indication des météos choisies. Un navigateur compte une fois quel que soit son nombre d'onglets ; un participant qui ferme la page ou perd le réseau SHALL cesser d'être compté comme connecté, mais son vote reste compté.

#### Scenario: Participant qui part après avoir voté
- **GIVEN** 3 participants connectés qui ont tous voté
- **WHEN** l'un ferme son onglet
- **THEN** la vue animateur affiche « 3 votes sur 2 connectés »

### Requirement: Révélation automatique
Quand la révélation automatique est activée, que la salle compte au moins un vote et que chaque participant connecté a voté, la vue animateur SHALL afficher « Tout le monde a voté : révélation dans 3 s » avec un bouton « Attendre », puis révéler les résultats 3 secondes plus tard. « Attendre » ou l'arrivée d'un participant qui n'a pas voté SHALL annuler cette révélation ; elle reprend quand la condition est de nouveau remplie.

#### Scenario: Dernier vote
- **GIVEN** la révélation automatique activée, et 5 participants connectés dont 4 ont voté
- **WHEN** le cinquième choisit sa météo
- **THEN** 3 secondes plus tard, les résultats apparaissent sur la vue animateur et sur tous les téléphones

#### Scenario: Retardataire
- **GIVEN** la révélation automatique activée, et une salle où tout le monde a voté, révélation dans 3 secondes
- **WHEN** un nouveau participant scanne le QR code
- **THEN** la révélation est annulée et la vue animateur affiche « 5 votes sur 6 connectés »

#### Scenario: Premier arrivé qui vote seul
- **GIVEN** une salle où un seul participant est connecté, révélation automatique activée par l'animateur
- **WHEN** il vote et que l'animateur clique sur « Attendre » pendant le décompte
- **THEN** les résultats restent cachés et la vue animateur affiche « 1 vote sur 1 connecté »

### Requirement: Désactiver la révélation automatique
La vue animateur SHALL proposer un interrupteur « Révélation automatique », désactivé par défaut et mémorisé dans le navigateur de l'animateur pour ses météos suivantes. Désactivé, la salle ne SHALL être révélée que par « Révéler maintenant » ; le désactiver pendant le décompte SHALL annuler la révélation.

#### Scenario: Par défaut, l'animateur révèle lui-même
- **GIVEN** un navigateur qui n'a jamais animé de météo
- **WHEN** l'animateur lance une météo et que tous les participants connectés votent
- **WHEN** tous les participants connectés ont voté
- **THEN** rien n'est révélé tant que l'animateur n'a pas cliqué sur « Révéler maintenant »

#### Scenario: Préférence mémorisée
- **GIVEN** un animateur qui a activé la révélation automatique lors d'une météo
- **WHEN** il lance la météo suivante dans le même navigateur
- **THEN** l'interrupteur est activé

### Requirement: Révéler maintenant et rouvrir
L'animateur SHALL pouvoir cliquer sur « Révéler maintenant » dès qu'il y a au moins un vote, sans attendre les autres. Après la révélation, « Rouvrir les votes » SHALL remettre la salle en vote : les votes déjà donnés sont conservés et redeviennent cachés aux participants ; la révélation suivante remplace l'entrée de ce sprint dans l'historique.

#### Scenario: Quelqu'un ne vote pas
- **GIVEN** 6 votes sur 7 connectés depuis une minute
- **WHEN** l'animateur clique sur « Révéler maintenant »
- **THEN** les résultats apparaissent pour tous, calculés sur 6 votes

### Requirement: Purge après 30 jours
Les salles SHALL être supprimées 30 jours après leur création : n'importe quel navigateur SHALL pouvoir supprimer une salle expirée, et le lancement d'une météo SHALL supprimer les salles expirées. Avant 30 jours, seul l'animateur de la salle SHALL pouvoir la supprimer. La purge MUST NOT toucher à l'historique des équipes.

#### Scenario: Salle ancienne
- **GIVEN** une salle créée il y a 31 jours, révélée et inscrite dans l'historique de son équipe
- **WHEN** un animateur lance une nouvelle météo
- **THEN** l'ancienne salle est supprimée et l'entrée de l'historique est intacte
