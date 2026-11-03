# OrphéNutri

Application web de gestion de restauration collective conçue pour le Centre Orphelinat de la Gendarmerie.

## Objectif opérationnel

Chaque matin, OrphéNutri doit aider le centre à répondre rapidement à quatre questions :

1. Que préparer aujourd’hui ?
2. En quelle quantité ?
3. Combien cela va coûter ?
4. Le stock disponible est-il suffisant ?

## Fonctionnalités actuellement implémentées

- Tableau de bord centré sur les quatre questions opérationnelles.
- Gestion des enfants par tranches d’âge : 2–5, 6–9, 10–14 et 15–17 ans.
- Facteurs de portion configurables par tranche d’âge.
- Saisie d’allergies et aliments interdits par groupe.
- Catalogue d’aliments adapté au contexte malgache : vary, tsaramaso, voanjobory, anana, mangahazo, patate douce, poisson, poulet, fruits locaux, etc.
- Planification de quatre repas quotidiens sur 7 jours.
- Moteur de génération automatique des menus selon stock, budget, diversité, proximité de péremption et place des aliments locaux.
- Exclusion automatique des recettes utilisant un aliment déclaré interdit lors de la génération.
- Simulation de la consommation du stock au fil des 28 repas de la semaine.
- Calcul automatique des quantités nécessaires selon les groupes d’âge.
- Calcul du coût par repas, par jour, par semaine et par enfant.
- Gestion du stock, seuils minimums, réservations et dates de péremption.
- Réservation du stock correspondant à un menu hebdomadaire validé.
- Liste de courses automatique avec quantités manquantes et coût estimé.
- Entrées de stock, dons, sorties/consommations et ajustements avec historique local.
- Budget alimentaire hebdomadaire et détection des dépassements.
- Fournisseurs de démonstration et historique de prix.
- Export CSV du stock, des courses et des mouvements.
- Impression des rapports et menus via le navigateur.
- Interface responsive PC, tablette et téléphone.
- PWA installable avec cache hors ligne de base.

## Important : nutrition

Les facteurs de portion et recettes fournis dans `src/data.ts` sont des paramètres de démonstration permettant de tester les calculs. Ils ne constituent pas des prescriptions nutritionnelles.

Avant utilisation réelle, le centre doit faire valider les portions, allergies, restrictions, règles alimentaires et procédures d’hygiène par les professionnels compétents. OrphéNutri applique ensuite les règles configurées.

## Moteur intelligent

Le moteur se trouve dans `src/engine.ts`.

Il prend en compte :

`groupes d’âge + portions configurées + restrictions + stock restant + réservations + dates de péremption + prix + budget + historique récent des plats → classement des recettes et génération de la semaine`

Lorsqu’il génère une semaine, il simule la diminution du stock après chaque repas afin que les choix des jours suivants utilisent le stock restant et non le stock initial.

## Technologies

- React 19
- TypeScript
- Vite
- CSS responsive
- Supabase JS préparé pour la prochaine phase
- GitHub Pages pour la version publique

## Site public

https://romuel10.github.io/gestion-stock/

Le workflow `.github/workflows/deploy-pages.yml` publie automatiquement la branche `main` sur GitHub Pages.

## Données actuelles

La version publique fonctionne actuellement en mode navigateur avec `localStorage`. Cela permet de tester l’ensemble du fonctionnement sans dépendre d’une base distante.

Les données principales se trouvent dans :

- `src/data.ts` : aliments, recettes, fournisseurs, groupes d’âge et données de démonstration ;
- `src/engine.ts` : moteur de décision ;
- `src/App.tsx` : interface et logique utilisateur ;
- `supabase/schema.sql` : première architecture de base de données pour le futur mode multi-utilisateur.

## Prochaine phase institutionnelle

La prochaine phase consiste à connecter réellement Supabase afin d’obtenir : authentification, rôles Administrateur / Direction / Responsable de stock / Cuisine / Nutrition, données partagées entre appareils, fournisseurs et achats centralisés, journal d’audit, historique permanent et rapports institutionnels.
