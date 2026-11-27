# meteo-sprint

**Météo du sprint** : la première partie de l'ice breaker des rétrospectives, sans publicité. Chacun choisit anonymement, depuis son téléphone, la météo qui résume son sprint ; les résultats apparaissent quand tout le monde a voté, et l'équipe suit son évolution sprint après sprint.

**Site : https://agileroy.github.io/meteo-sprint/**

| Indice | Météo | Phrase |
|---|---|---|
| 5 | Grand soleil | Super sprint, j'en redemande |
| 4 | Éclaircies | Bon sprint, quelques nuages |
| 3 | Nuageux | Mitigé, des hauts et des bas |
| 2 | Pluie | Sprint difficile |
| 1 | Orage | Très dur, ça n'a pas été |

## Fonctionnement

- **Une équipe** : l'animateur crée une équipe (un nom). Juste après, il reçoit le **lien d'animation**, à garder : il permet d'animer l'équipe depuis un autre navigateur ou de la confier à un co-animateur. Le **lien public** de l'équipe, à partager, montre son historique en lecture seule.
- **Une météo par sprint** : depuis la page de l'équipe, « Lancer une météo » (libellé proposé : « Sprint 42 » après « Sprint 41 ») ; l'animateur projette le code de 4 lettres, l'adresse (copiable en un clic) et le QR code (agrandissable d'un clic). Les participants votent depuis leur téléphone, sans compte ni prénom, et peuvent changer d'avis jusqu'à la révélation.
- **Révélation automatique** (désactivée par défaut) : une fois l'interrupteur activé, dès que tous les participants connectés ont voté, un décompte de 3 secondes s'affiche (« Attendre » l'annule), puis la répartition, la météo la plus choisie et l'indice moyen (« 3,6 / 5 ») apparaissent sur tous les écrans. Un retardataire qui se connecte annule le décompte. Sinon, l'animateur révèle avec « Révéler maintenant ».
- **Anonymat** : avant la révélation, l'écran de l'animateur n'affiche que des compteurs (« 4 votes sur 6 connectés »). L'historique ne garde que des totaux par météo, jamais de vote individuel ; les salles (et donc les votes) sont supprimées 30 jours après leur création. Sous 3 votes, les résultats le signalent : chacun peut deviner le vote des autres.
- **Évolution de l'équipe** : une colonne par sprint, haute de l'indice moyen (sur 5) et colorée selon la répartition des votes, 12 derniers sprints (ou tous), avec un tableau des mêmes chiffres. Un animateur peut retirer un sprint (météo de test) ; l'historique n'est jamais purgé automatiquement.
- **Mes équipes** : l'accueil liste les équipes animées depuis ce navigateur.
- **Mode démo** : avec `?demo` dans l'adresse, l'outil fonctionne sans Firebase, entre les onglets d'un même navigateur (un onglet animateur, d'autres onglets participants). Les règles de sécurité n'y sont pas appliquées.

## Réseau d'entreprise

Le VPN de l'entreprise (proxy Zscaler) bloque GitHub Pages et Firebase : voter depuis son téléphone, hors VPN, via le QR code.

## Architecture

Site statique (HTML/CSS/JavaScript, sans build) publié sur GitHub Pages, polices système, ni CDN ni traceur. Seul service tiers : Firebase Realtime Database (connexion anonyme), branche `meteo` du projet Firebase `roti-vleroy`, **partagé avec le [ROTI](https://github.com/agileroy/roti)** : les deux outils se jouent dans la même rétro, avec les mêmes personnes, l'un au début et l'autre à la fin.

- `site/js/meteo-core.js` : logique pure (météos, codes et identifiants, validations, répartition, indice, historique, révélation automatique, « Mes équipes »), testée avec Node.js ;
- `site/js/meteo-store.js` : actions sur la base (équipes, lien d'animation, salles, votes, révélation avec écriture de l'historique, présence, purge) ;
- `site/js/firebase-db.js` (seul module qui parle à Firebase), `site/js/memory-db.js` (même interface en mémoire, pour les tests et le mode démo), `site/js/firebase-config.js` ;
- `site/js/ui.js` : accueil, page d'équipe et graphique d'évolution (SVG fait main), vue participant, vue animateur ; `site/js/theme.js` : thème clair ou sombre ; `site/js/app.js` : point d'entrée ;
- `site/index.html` : les 5 icônes météo en symboles SVG (couleurs par variables CSS) ;
- `site/vendor/qrcode-generator-1.4.4.js` : QR code de la salle (licence MIT).

### Règles de sécurité : dans le dépôt `roti`

Les règles de la branche `meteo` sont dans `database.rules.json` **du dépôt [roti](https://github.com/agileroy/roti)**, seul à publier les règles du projet `roti-vleroy` (deux dépôts qui publieraient chacun leur fichier s'écraseraient). Pour les modifier : changer et tester `database.rules.json` dans `roti` (`tests/meteo-rules.test.mjs`), puis recopier le fichier dans `tests/database.rules.json` de ce dépôt, où les tests du store tournent sous ces règles.

Données de la branche `meteo` :

```
meteo/teams/{teamId}/meta             { name, createdAt }                     lisible par le lien public
meteo/teams/{teamId}/secret           clé d'animation (20 caractères)          illisible par quiconque
meteo/teams/{teamId}/owners/{uid}     copie de la clé : ce navigateur anime l'équipe
meteo/teams/{teamId}/history/{sid}    { label, date, counts: { soleil, eclaircies, nuageux, pluie, orage }, total }
meteo/expiry/{code}                   { createdAt, hostUid }                   réservation du code, purge à 30 jours
meteo/sessions/{code}/meta            { teamId, hostUid, createdAt, label, status: open | revealed }
meteo/sessions/{code}/votes/{uid}     1 à 5, lisibles par l'animateur, ou par tous après la révélation
meteo/sessions/{code}/participants/{uid}/connections/{id}   présence (une entrée par onglet)
```

`sid` = « heure de création de la salle-code » : un code de 4 lettres peut resservir après la purge.

## Développement

```sh
npm test                                          # logique, parcours complets sous les règles
python3 -m http.server 8765 --directory site      # puis http://localhost:8765/?demo
```

Chaque push sur `main` lance les tests puis publie `site/` sur GitHub Pages ; un test en échec bloque la publication.

## Méthode

Les évolutions passent par [OpenSpec](https://github.com/Fission-AI/OpenSpec) (`openspec/`) : proposition, conception, specs et tâches, en français, avant le code.
