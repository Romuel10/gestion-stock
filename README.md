# OrphéNutri Local

Application web **100 % locale** de gestion de restauration collective pour le Centre Orphelinat de la Gendarmerie.

OrphéNutri est conçu pour fonctionner sur **un seul ordinateur du centre**. Les données ne sont pas envoyées vers Supabase, Netlify, GitHub Pages ou une autre base distante.

## Objectif

Chaque matin, l'application aide à répondre à quatre questions :

1. Que préparer aujourd'hui ?
2. En quelle quantité ?
3. Combien cela va coûter ?
4. Le stock disponible est-il suffisant ?

## Fonctionnement local

- L'interface s'ouvre dans le navigateur à l'adresse `http://127.0.0.1:4173`.
- `127.0.0.1` signifie que le serveur écoute uniquement sur l'ordinateur lui-même.
- Les données métier sont enregistrées dans le stockage local du navigateur de ce PC.
- Aucun compte Internet n'est nécessaire.
- Aucune synchronisation cloud n'est effectuée.
- Une sauvegarde complète peut être exportée au format JSON puis restaurée plus tard.
- Il est recommandé de conserver régulièrement une copie de sauvegarde sur une clé USB ou un deuxième disque.

## Démarrage sous Windows

Prérequis : Node.js 22.12 ou supérieur.

1. Télécharger ou cloner le dépôt sur l'ordinateur du centre.
2. Double-cliquer sur `LANCER-ORPHENUTRI.bat`.
3. Lors du premier lancement seulement, les dépendances de développement peuvent nécessiter une connexion Internet pour être installées.
4. Ensuite l'application est construite localement et s'ouvre sur `http://127.0.0.1:4173`.
5. Fermer la fenêtre de commande OrphéNutri arrête le serveur local.

Pour lancer manuellement :

```bash
npm ci
npm run build
node local-server.mjs
```

## Sauvegarde des données

Dans **Paramètres** ou **Rapports** :

- `Exporter une sauvegarde` crée un fichier `orphe-nutri-sauvegarde-AAAA-MM-JJ.json` ;
- `Restaurer une sauvegarde` recharge ce fichier sur le PC ;
- les sauvegardes comprennent les effectifs, stocks, menus, mouvements, fournisseurs et budget.

Cette sauvegarde est importante car supprimer les données du navigateur, réinstaller Windows ou changer de profil navigateur peut effacer le stockage local.

## Fonctions principales

- Tableau de bord opérationnel.
- Groupes d'âge 2–5, 6–9, 10–14 et 15–17 ans.
- Facteurs de portion configurables.
- Allergies et aliments interdits.
- Aliments adaptés au contexte malgache : vary, tsaramaso, voanjobory, anana, mangahazo, patate douce, poisson, poulet, fruits locaux, etc.
- Menus sur 7 jours avec quatre repas par jour.
- Génération selon stock, budget, diversité, péremption et restrictions.
- Simulation de la diminution du stock au fil de la semaine.
- Calcul des quantités, coûts et achats manquants.
- Gestion du stock et réservations.
- Entrées, dons, sorties cuisine et pertes avec historique local.
- Fournisseurs.
- Liste de courses et export CSV.
- Rapports imprimables.
- Sauvegarde/restauration locale complète.

## Important : nutrition

Les facteurs de portion et recettes de démonstration permettent de tester les calculs. Ils ne constituent pas des prescriptions nutritionnelles.

Avant utilisation réelle, les portions, allergies, restrictions, règles alimentaires et procédures d'hygiène doivent être validées par les professionnels compétents du centre. OrphéNutri applique ensuite les règles configurées.

## Architecture

- `src/data.ts` : aliments, recettes et données de démonstration ;
- `src/engine.ts` : moteur de proposition des menus ;
- `src/App.tsx` : interface, gestion locale et sauvegardes ;
- `local-server.mjs` : serveur HTTP limité à `127.0.0.1` ;
- `LANCER-ORPHENUTRI.bat` : lancement simplifié sous Windows.

## Confidentialité

Cette édition est volontairement **mono-PC et locale**. Elle n'a pas pour objectif de partager les données entre plusieurs ordinateurs ou utilisateurs. Pour déplacer les données sur un autre PC, utiliser l'export/import de sauvegarde.
