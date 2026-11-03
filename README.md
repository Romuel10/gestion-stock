# NutriStock Orphelinat

Site web de gestion nutritionnelle et de stock pour le Centre Orphelinat de la Gendarmerie.

## Fonctionnalités actuelles

- Tableau de bord avec alertes de stock et de péremption.
- Gestion des aliments, quantités disponibles, seuils minimums et prix en ariary.
- Planification des repas sur 7 jours : petit-déjeuner, déjeuner, goûter et dîner.
- Calcul automatique des quantités nécessaires selon le nombre d'enfants.
- Calcul automatique du coût des repas.
- Comparaison avec le stock disponible.
- Génération automatique de la liste de courses et du coût estimé des achats manquants.
- Budget mensuel et estimation du budget hebdomadaire.
- Catalogue initial de recettes et portions par enfant.
- Sauvegarde locale des modifications dans le navigateur.
- Interface responsive pour ordinateur, tablette et téléphone.
- PWA installable avec cache hors ligne de base.
- Impression de la liste de courses.
- Schéma Supabase multi-utilisateur préparé avec Row Level Security (RLS).

## Technologies

- React 19
- TypeScript
- Vite
- Supabase JS
- CSS responsive sans framework UI externe
- GitHub Pages ou Netlify pour l'hébergement statique

## Démarrage local

Prérequis : Node.js 22.12 ou supérieur.

```bash
npm ci
npm run dev
```

Pour vérifier la version de production :

```bash
npm run build
npm run preview
```

## Site web GitHub Pages

Le dépôt contient `.github/workflows/deploy-pages.yml`. À chaque modification de `main`, GitHub construit automatiquement le site puis le publie sur GitHub Pages.

Une seule activation initiale est nécessaire dans GitHub :

1. Ouvrir `Settings` du dépôt.
2. Ouvrir `Pages`.
3. Dans `Build and deployment`, choisir `GitHub Actions` comme source.

Après cette activation, l'adresse prévue est :

`https://romuel10.github.io/gestion-stock/`

Le build Vite utilise des chemins relatifs afin que le même projet puisse aussi être hébergé sur Netlify ou un autre hébergeur statique.

## Données

La version actuelle fonctionne immédiatement en mode navigateur. Les données de démonstration sont définies dans `src/data.ts` puis sauvegardées dans le `localStorage` du navigateur lorsque l'utilisateur les modifie.

Cette approche permet de tester le logiciel avant de créer la base de production.

## Connexion à Supabase

Le fichier `supabase/schema.sql` contient le modèle préparatoire pour :

- centres ;
- utilisateurs et rôles ;
- aliments ;
- recettes et ingrédients ;
- menus hebdomadaires ;
- mouvements de stock ;
- fournisseurs ;
- achats ;
- budgets.

Les tables publiques ont RLS activé et l'accès anonyme n'est pas autorisé.

Créer ensuite un fichier `.env.local` à partir de `.env.example` :

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Ne jamais mettre une clé `service_role` ou une clé secrète Supabase dans le frontend.

> Le schéma n'est volontairement pas appliqué automatiquement à une base distante. Il doit d'abord être validé avec l'organisation réelle du centre et le projet Supabase choisi.

## Déploiement Netlify

Le dépôt contient également `netlify.toml` :

- commande de build : `npm run build`
- dossier publié : `dist`
- Node.js : 22

Le dépôt peut donc être connecté à Netlify si cette plateforme est préférée.

## Vérification automatique

Le workflow `.github/workflows/build.yml` installe les dépendances avec `npm ci` et lance `npm run build` à chaque push et pull request vers `main`.

## Sécurité et nutrition

NutriStock automatise les calculs de stock, coût, quantités et planification. Les portions fournies dans les données de démonstration sont des exemples de développement et ne constituent pas une prescription nutritionnelle.

Avant utilisation réelle auprès des enfants, les portions, règles nutritionnelles, allergies, restrictions alimentaires et procédures d'hygiène doivent être validées par les professionnels compétents du centre.

## Prochaines évolutions prévues

1. Connexion réelle à Supabase et authentification.
2. Rôles Administrateur, Direction, Gestionnaire et Cuisine.
3. Entrées/sorties de stock avec historique complet.
4. Gestion des fournisseurs et bons d'achat.
5. Historique des prix.
6. Validation et consommation d'un repas avec déduction automatique du stock.
7. Rapports PDF/Excel.
8. Suggestions de menus optimisées selon stock, budget, variété et produits proches de péremption.
9. Gestion configurable des groupes d'âge et règles nutritionnelles validées.
10. Journal d'audit des actions sensibles.
