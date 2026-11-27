## ADDED Requirements

### Requirement: Les 5 météos
La vue participant SHALL afficher le nom de l'équipe, le libellé de la météo et les 5 météos, de la meilleure à la pire, chacune avec son icône, son nom et sa phrase : Grand soleil « Super sprint, j'en redemande » (5), Éclaircies « Bon sprint, quelques nuages » (4), Nuageux « Mitigé, des hauts et des bas » (3), Pluie « Sprint difficile » (2), Orage « Très dur, ça n'a pas été » (1).

#### Scenario: Arrivée dans la salle
- **GIVEN** une salle « Sprint 42 » de l'équipe « Phénix »
- **WHEN** un participant scanne le QR code
- **THEN** il voit « Phénix — Sprint 42 » et les 5 météos de Grand soleil à Orage, sans aucune sélectionnée

### Requirement: Choix de la météo
Toucher une météo SHALL l'enregistrer aussitôt, sans autre validation, avec la confirmation « C'est noté ! Vous pouvez changer d'avis jusqu'à la révélation. ». Les choix SHALL être utilisables au clavier (flèches) et au doigt (au moins 44 × 44 px).

#### Scenario: Premier vote
- **GIVEN** un participant dans une salle aux votes ouverts
- **WHEN** il touche « Pluie »
- **THEN** « Pluie » est mis en évidence, la valeur 2 est enregistrée et la confirmation s'affiche

### Requirement: Changer d'avis
Un participant SHALL avoir une seule météo par salle, qu'il SHALL pouvoir changer tant que les votes sont ouverts. Après la révélation, son choix SHALL être figé. Un participant qui recharge la page SHALL retrouver son choix.

#### Scenario: Changement d'avis
- **GIVEN** un participant qui a choisi « Nuageux »
- **WHEN** il touche « Éclaircies » avant la révélation
- **THEN** son vote devient 4 et la salle compte toujours un seul vote pour lui

#### Scenario: Après la révélation
- **GIVEN** une salle révélée
- **WHEN** le participant essaie de changer de météo
- **THEN** les choix sont désactivés et la base refuse l'écriture

### Requirement: Anonymat
Aucun prénom ni identifiant visible ne SHALL être demandé ni affiché. Personne, pas même l'animateur, MUST NOT pouvoir relier une météo à une personne, ni dans l'interface, ni dans la base, ni dans l'historique. La vue participant SHALL rappeler que le vote est anonyme.

#### Scenario: L'animateur tente de relier
- **GIVEN** une salle révélée avec 5 votes
- **WHEN** l'animateur lit tout ce que la base lui permet de lire
- **THEN** il obtient 5 valeurs indexées par des identifiants anonymes, sans nom ni ordre d'arrivée

### Requirement: Votes cachés avant la révélation
Avant la révélation, un participant MUST NOT pouvoir lire les votes des autres, ni dans l'interface ni dans la base. Après la révélation, il SHALL voir les mêmes résultats que l'animateur ; si les votes sont rouverts, les résultats SHALL de nouveau lui être cachés.

#### Scenario: Participant curieux
- **GIVEN** une salle aux votes ouverts
- **WHEN** un participant tente de lire les votes de la salle
- **THEN** la base refuse la lecture

### Requirement: Résultats
Après la révélation, la vue animateur et les vues participants SHALL afficher : la répartition (une barre par météo, de Grand soleil à Orage, avec le nombre de votes et le pourcentage), la météo la plus choisie (ou les ex æquo), l'indice moyen arrondi à une décimale et écrit à la française (« 3,4 ») et le nombre de votes. Sous 3 votes, la mention « Peu de votes : chacun peut deviner le vote des autres. » SHALL s'afficher. La vue participant SHALL rappeler le choix du participant.

#### Scenario: Répartition
- **GIVEN** une salle avec 2 Grand soleil, 3 Éclaircies, 1 Nuageux et 1 Pluie
- **WHEN** les résultats sont révélés
- **THEN** la répartition affiche 2 (29 %), 3 (43 %), 1 (14 %), 1 (14 %), 0 (0 %), « Éclaircies » comme météo la plus choisie et un indice de 3,9
