import type { DayMenu, Food, Recipe } from './types'

export const demoFoods: Food[] = [
  { id: 'riz', name: 'Riz', category: 'Féculents', unit: 'kg', stock: 55, minimumStock: 20, price: 3200 },
  { id: 'poulet', name: 'Poulet', category: 'Protéines', unit: 'kg', stock: 12, minimumStock: 8, price: 15000, expiryDate: '2026-11-06' },
  { id: 'haricots', name: 'Haricots secs', category: 'Légumineuses', unit: 'kg', stock: 18, minimumStock: 7, price: 6500 },
  { id: 'oeufs', name: 'Œufs', category: 'Protéines', unit: 'unité', stock: 95, minimumStock: 40, price: 800, expiryDate: '2026-11-10' },
  { id: 'carotte', name: 'Carottes', category: 'Légumes', unit: 'kg', stock: 10, minimumStock: 5, price: 4000, expiryDate: '2026-11-05' },
  { id: 'tomate', name: 'Tomates', category: 'Légumes', unit: 'kg', stock: 7, minimumStock: 5, price: 3500, expiryDate: '2026-11-04' },
  { id: 'banane', name: 'Bananes', category: 'Fruits', unit: 'kg', stock: 9, minimumStock: 5, price: 4500, expiryDate: '2026-11-05' },
  { id: 'huile', name: 'Huile', category: 'Matières grasses', unit: 'L', stock: 8, minimumStock: 5, price: 9000 },
  { id: 'lait', name: 'Lait', category: 'Produits laitiers', unit: 'L', stock: 14, minimumStock: 8, price: 5000, expiryDate: '2026-11-08' },
  { id: 'pain', name: 'Pain', category: 'Féculents', unit: 'unité', stock: 110, minimumStock: 50, price: 700 },
  { id: 'pates', name: 'Pâtes', category: 'Féculents', unit: 'kg', stock: 14, minimumStock: 6, price: 5200 },
  { id: 'poisson', name: 'Poisson', category: 'Protéines', unit: 'kg', stock: 9, minimumStock: 6, price: 13000, expiryDate: '2026-11-05' }
]

export const demoRecipes: Recipe[] = [
  {
    id: 'pain-lait-banane',
    name: 'Pain, lait et banane',
    mealType: 'Petit-déjeuner',
    ingredients: [
      { foodId: 'pain', quantityPerChild: 1 },
      { foodId: 'lait', quantityPerChild: 0.2 },
      { foodId: 'banane', quantityPerChild: 0.08 }
    ]
  },
  {
    id: 'pain-oeuf-lait',
    name: 'Pain, œuf et lait',
    mealType: 'Petit-déjeuner',
    ingredients: [
      { foodId: 'pain', quantityPerChild: 1 },
      { foodId: 'oeufs', quantityPerChild: 1 },
      { foodId: 'lait', quantityPerChild: 0.2 }
    ]
  },
  {
    id: 'riz-poulet-legumes',
    name: 'Riz, poulet et légumes',
    mealType: 'Déjeuner',
    ingredients: [
      { foodId: 'riz', quantityPerChild: 0.15 },
      { foodId: 'poulet', quantityPerChild: 0.09 },
      { foodId: 'carotte', quantityPerChild: 0.04 },
      { foodId: 'tomate', quantityPerChild: 0.03 },
      { foodId: 'huile', quantityPerChild: 0.012 }
    ],
    note: 'Repas complet : féculent, protéine et légumes.'
  },
  {
    id: 'riz-poisson-legumes',
    name: 'Riz, poisson et légumes',
    mealType: 'Déjeuner',
    ingredients: [
      { foodId: 'riz', quantityPerChild: 0.15 },
      { foodId: 'poisson', quantityPerChild: 0.09 },
      { foodId: 'carotte', quantityPerChild: 0.04 },
      { foodId: 'tomate', quantityPerChild: 0.03 },
      { foodId: 'huile', quantityPerChild: 0.012 }
    ]
  },
  {
    id: 'riz-haricots',
    name: 'Riz, haricots et légumes',
    mealType: 'Dîner',
    ingredients: [
      { foodId: 'riz', quantityPerChild: 0.13 },
      { foodId: 'haricots', quantityPerChild: 0.08 },
      { foodId: 'carotte', quantityPerChild: 0.035 },
      { foodId: 'tomate', quantityPerChild: 0.025 },
      { foodId: 'huile', quantityPerChild: 0.01 }
    ]
  },
  {
    id: 'pates-oeufs-legumes',
    name: 'Pâtes, œufs et légumes',
    mealType: 'Dîner',
    ingredients: [
      { foodId: 'pates', quantityPerChild: 0.12 },
      { foodId: 'oeufs', quantityPerChild: 1 },
      { foodId: 'carotte', quantityPerChild: 0.03 },
      { foodId: 'tomate', quantityPerChild: 0.025 }
    ]
  },
  {
    id: 'banane-gouter',
    name: 'Banane',
    mealType: 'Goûter',
    ingredients: [{ foodId: 'banane', quantityPerChild: 0.1 }]
  },
  {
    id: 'pain-lait-gouter',
    name: 'Pain et lait',
    mealType: 'Goûter',
    ingredients: [
      { foodId: 'pain', quantityPerChild: 1 },
      { foodId: 'lait', quantityPerChild: 0.15 }
    ]
  }
]

export const demoWeek: DayMenu[] = [
  { day: 'Lundi', breakfast: 'pain-lait-banane', lunch: 'riz-poulet-legumes', snack: 'banane-gouter', dinner: 'riz-haricots' },
  { day: 'Mardi', breakfast: 'pain-oeuf-lait', lunch: 'riz-poisson-legumes', snack: 'pain-lait-gouter', dinner: 'pates-oeufs-legumes' },
  { day: 'Mercredi', breakfast: 'pain-lait-banane', lunch: 'riz-poulet-legumes', snack: 'banane-gouter', dinner: 'riz-haricots' },
  { day: 'Jeudi', breakfast: 'pain-oeuf-lait', lunch: 'riz-poisson-legumes', snack: 'pain-lait-gouter', dinner: 'pates-oeufs-legumes' },
  { day: 'Vendredi', breakfast: 'pain-lait-banane', lunch: 'riz-poulet-legumes', snack: 'banane-gouter', dinner: 'riz-haricots' },
  { day: 'Samedi', breakfast: 'pain-oeuf-lait', lunch: 'riz-poisson-legumes', snack: 'pain-lait-gouter', dinner: 'pates-oeufs-legumes' },
  { day: 'Dimanche', breakfast: 'pain-lait-banane', lunch: 'riz-poulet-legumes', snack: 'banane-gouter', dinner: 'riz-haricots' }
]
