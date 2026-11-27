## MODIFIED Requirements

### Requirement: Tableau de l'historique
Sous le graphique, un tableau SHALL reprendre, pour chaque sprint, le libellé, la date, le nombre de votes par météo, le total et l'indice, pour une lecture au lecteur d'écran ou sur téléphone. Un sprint sans libellé SHALL être nommé par sa date et son heure (« 27 nov. 16:20 »).

#### Scenario: Lecture sur téléphone
- **GIVEN** une équipe avec 5 sprints d'historique
- **WHEN** un membre ouvre la page de l'équipe sur son téléphone
- **THEN** le tableau affiche les 5 sprints sans défilement horizontal de la page

#### Scenario: Deux météos le même jour sans libellé
- **GIVEN** deux météos sans libellé lancées le 27 novembre à 16:20 et à 16:45
- **WHEN** quelqu'un ouvre la page de l'équipe
- **THEN** le tableau et le graphique les nomment « 27 nov. 16:20 » et « 27 nov. 16:45 »

## REMOVED Requirements

### Requirement: Lecture et étendue du graphique
**Reason**: le graphique se limite désormais aux 10 derniers sprints, sans « Tout afficher » (retour de l'auteur).
**Migration**: remplacé par « Lecture du graphique et 10 derniers sprints ».

## ADDED Requirements

### Requirement: Lecture du graphique et 10 derniers sprints
Une mention sous le graphique SHALL expliquer sa lecture : « Hauteur de la colonne : indice moyen de l'équipe, sur 5. Couleurs : répartition des votes. ». Le graphique SHALL montrer les 10 derniers sprints seulement ; le tableau SHALL garder tout l'historique.

#### Scenario: Plus de 10 sprints
- **GIVEN** une équipe avec 14 sprints d'historique
- **WHEN** quelqu'un ouvre la page de l'équipe
- **THEN** le graphique montre les 10 derniers sprints et le tableau les 14


### Requirement: Ouvrir une météo depuis l'historique
Cliquer sur une ligne du tableau ou sur une colonne du graphique SHALL ouvrir la météo correspondante. Si ce navigateur l'a lancée et que sa salle existe encore, la vue animateur de la salle SHALL s'ouvrir, avec le bulletin et « Rouvrir les votes ». Sinon, le bilan de la météo SHALL s'ouvrir.

#### Scenario: Rouvrir pour un retardataire
- **GIVEN** une météo révélée hier depuis ce navigateur
- **WHEN** l'animateur clique sur sa ligne dans le tableau
- **THEN** la vue animateur de la salle s'ouvre avec le bulletin, et « Rouvrir les votes » fait revenir le QR code

#### Scenario: Colonne du graphique
- **GIVEN** la page d'équipe affichée
- **WHEN** quelqu'un clique sur une colonne du graphique, ou appuie sur Entrée quand elle a le focus
- **THEN** la météo de cette colonne s'ouvre

### Requirement: Bilan d'une météo passée
Le bilan SHALL présenter, en lecture seule, le bulletin de la météo construit à partir des totaux de l'historique (prévision, indice, répartition), avec « Retour à l'équipe », et SHALL dire pourquoi les votes ne peuvent pas être rouverts : « Les votes de cette météo ont été effacés : seul le bilan est conservé. » si la salle n'existe plus, « Seul le navigateur qui a lancé cette météo peut rouvrir ses votes. » sinon.

#### Scenario: Météo de plus de 30 jours
- **GIVEN** une météo dont la salle a été purgée
- **WHEN** l'animateur clique sur sa colonne dans le graphique
- **THEN** le bilan s'affiche avec la mention « Les votes de cette météo ont été effacés : seul le bilan est conservé. »

#### Scenario: Membre de l'équipe avec le lien public
- **GIVEN** le lien public de l'équipe ouvert par un membre
- **WHEN** il clique sur une ligne du tableau
- **THEN** il voit le bilan de cette météo, sans bouton d'animation
