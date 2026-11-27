## ADDED Requirements

### Requirement: Création d'une équipe
Depuis l'accueil, « Créer une équipe » SHALL demander un nom de 1 à 50 caractères, créer l'équipe avec un identifiant impossible à deviner et faire du navigateur appelant un animateur de cette équipe. Juste après la création, l'animateur SHALL voir le lien d'animation de l'équipe avec un bouton « Copier » et le message « Gardez ce lien : il permet d'animer cette équipe depuis un autre navigateur. »

#### Scenario: Équipe créée
- **GIVEN** l'accueil
- **WHEN** l'animateur saisit « Équipe Phénix » et clique sur « Créer une équipe »
- **THEN** la page de l'équipe « Équipe Phénix » s'ouvre, avec le lien d'animation, « Lancer une météo » et un historique vide

#### Scenario: Nom vide
- **GIVEN** l'accueil
- **WHEN** l'animateur clique sur « Créer une équipe » sans saisir de nom
- **THEN** l'équipe n'est pas créée et le champ affiche « Donnez un nom à l'équipe. »

### Requirement: Mes équipes
L'accueil SHALL lister les équipes animées depuis ce navigateur, de la plus récemment utilisée à la plus ancienne, avec leur nom, la date de leur dernière météo (ou « Aucune météo ») et le nombre de sprints de leur historique. Chaque équipe SHALL pouvoir être ouverte. Une équipe supprimée, ou dont ce navigateur n'est plus animateur, SHALL disparaître de la liste. La liste SHALL indiquer qu'elle est propre à ce navigateur.

#### Scenario: Retrouver son équipe
- **GIVEN** une équipe créée dans ce navigateur, avec 4 sprints d'historique
- **WHEN** l'animateur ouvre l'accueil
- **THEN** il voit l'équipe avec « 4 sprints » et la date de la dernière météo, et peut l'ouvrir

### Requirement: Lien d'animation
Ouvrir le lien d'animation `?equipe=ID&cle=CLE` SHALL faire du navigateur un animateur de l'équipe et l'ajouter à « Mes équipes ». Une clé fausse SHALL être refusée par la base et signalée par « Ce lien d'animation n'est pas valide. ». La clé MUST NOT être lisible dans la base, ni par un participant ni par un animateur. Un animateur SHALL pouvoir réafficher le lien d'animation depuis la page de l'équipe.

#### Scenario: Nouveau navigateur
- **GIVEN** une équipe créée sur l'ordinateur de l'animateur
- **WHEN** l'animateur ouvre le lien d'animation sur son portable
- **THEN** le portable peut lancer une météo pour cette équipe et l'équipe apparaît dans son « Mes équipes »

#### Scenario: Clé devinée
- **GIVEN** le lien public d'une équipe `?equipe=ID`
- **WHEN** quelqu'un ajoute une clé inventée à l'adresse
- **THEN** la base refuse l'écriture et le message « Ce lien d'animation n'est pas valide. » s'affiche

### Requirement: Lien public de l'équipe
Le lien `?equipe=ID` sans clé SHALL afficher la page de l'équipe en lecture seule (nom et historique), sans bouton d'animation, pour que l'équipe puisse consulter son évolution.

#### Scenario: Membre de l'équipe qui consulte
- **GIVEN** le lien public d'une équipe partagé dans le canal de l'équipe
- **WHEN** un membre l'ouvre
- **THEN** il voit le graphique d'évolution et le tableau, sans « Lancer une météo » ni « Supprimer »

### Requirement: Suppression d'une équipe
Un animateur SHALL pouvoir renommer l'équipe et la supprimer après confirmation (« L'historique de l'équipe sera effacé définitivement. »). La suppression SHALL effacer l'équipe et tout son historique.

#### Scenario: Équipe dissoute
- **GIVEN** une équipe avec un historique
- **WHEN** l'animateur clique sur « Supprimer l'équipe » et confirme
- **THEN** l'équipe et son historique n'existent plus et son lien public affiche « Équipe introuvable. »
