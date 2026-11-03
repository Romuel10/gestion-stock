import type { AgeGroup, DayMenu, Food, Recipe, StockMovement, Supplier } from './types'

export const demoAgeGroups: AgeGroup[] = [
  { id: '2-5', label: '2–5 ans', minAge: 2, maxAge: 5, count: 18, portionFactor: 0.75, restrictions: [] },
  { id: '6-9', label: '6–9 ans', minAge: 6, maxAge: 9, count: 24, portionFactor: 0.9, restrictions: [] },
  { id: '10-14', label: '10–14 ans', minAge: 10, maxAge: 14, count: 22, portionFactor: 1.05, restrictions: [] },
  { id: '15-17', label: '15–17 ans', minAge: 15, maxAge: 17, count: 11, portionFactor: 1.2, restrictions: [] }
]

export const demoSuppliers: Supplier[] = [
  { id: 'marche', name: 'Marché local', contact: 'Prix variables selon arrivage', location: 'Antananarivo' },
  { id: 'grossiste', name: 'Grossiste alimentaire', contact: 'Livraison hebdomadaire', location: 'Analamanga' },
  { id: 'producteur', name: 'Producteurs partenaires', contact: 'Produits frais et saisonniers', location: 'Périphérie' }
]

export const demoFoods: Food[] = [
  { id: 'riz', name: 'Vary / Riz', category: 'Féculents', unit: 'kg', stock: 64, reserved: 0, minimumStock: 25, price: 3200, local: true, supplierId: 'grossiste', priceHistory: [{ date: '2026-10-01', price: 3000 }, { date: '2026-11-01', price: 3200 }] },
  { id: 'tsaramaso', name: 'Tsaramaso / Haricots', category: 'Légumineuses', unit: 'kg', stock: 16, reserved: 0, minimumStock: 8, price: 6500, local: true, supplierId: 'marche' },
  { id: 'voanjobory', name: 'Voanjobory', category: 'Légumineuses', unit: 'kg', stock: 12, reserved: 0, minimumStock: 6, price: 7200, local: true, supplierId: 'marche' },
  { id: 'lentilles', name: 'Lentilles', category: 'Légumineuses', unit: 'kg', stock: 8, reserved: 0, minimumStock: 5, price: 8200, supplierId: 'grossiste' },
  { id: 'poulet', name: 'Poulet', category: 'Protéines', unit: 'kg', stock: 9, reserved: 0, minimumStock: 8, price: 15500, local: true, supplierId: 'producteur', expiryDate: '2026-11-06' },
  { id: 'viande', name: 'Viande de bœuf', category: 'Protéines', unit: 'kg', stock: 7, reserved: 0, minimumStock: 6, price: 19000, local: true, supplierId: 'marche', expiryDate: '2026-11-06' },
  { id: 'poisson', name: 'Poisson', category: 'Protéines', unit: 'kg', stock: 8, reserved: 0, minimumStock: 6, price: 13500, local: true, supplierId: 'marche', expiryDate: '2026-11-05' },
  { id: 'oeufs', name: 'Œufs', category: 'Protéines', unit: 'unité', stock: 120, reserved: 0, minimumStock: 45, price: 850, local: true, supplierId: 'producteur', expiryDate: '2026-11-11' },
  { id: 'anana', name: 'Anana / Brèdes', category: 'Légumes', unit: 'kg', stock: 11, reserved: 0, minimumStock: 5, price: 2800, local: true, supplierId: 'producteur', expiryDate: '2026-11-05' },
  { id: 'carotte', name: 'Carottes', category: 'Légumes', unit: 'kg', stock: 9, reserved: 0, minimumStock: 5, price: 4000, local: true, supplierId: 'marche', expiryDate: '2026-11-07' },
  { id: 'tomate', name: 'Tomates', category: 'Légumes', unit: 'kg', stock: 7, reserved: 0, minimumStock: 5, price: 3500, local: true, supplierId: 'marche', expiryDate: '2026-11-04' },
  { id: 'courgette', name: 'Courgettes', category: 'Légumes', unit: 'kg', stock: 6, reserved: 0, minimumStock: 4, price: 4500, local: true, supplierId: 'producteur', expiryDate: '2026-11-08' },
  { id: 'ovy', name: 'Ovy / Pomme de terre', category: 'Féculents', unit: 'kg', stock: 15, reserved: 0, minimumStock: 8, price: 4200, local: true, supplierId: 'marche' },
  { id: 'mangahazo', name: 'Mangahazo / Manioc', category: 'Féculents', unit: 'kg', stock: 14, reserved: 0, minimumStock: 7, price: 2600, local: true, supplierId: 'producteur' },
  { id: 'patate-douce', name: 'Patate douce', category: 'Féculents', unit: 'kg', stock: 13, reserved: 0, minimumStock: 7, price: 3000, local: true, supplierId: 'producteur' },
  { id: 'pates', name: 'Pâtes', category: 'Féculents', unit: 'kg', stock: 10, reserved: 0, minimumStock: 6, price: 5400, supplierId: 'grossiste' },
  { id: 'huile', name: 'Huile', category: 'Matières grasses', unit: 'L', stock: 9, reserved: 0, minimumStock: 5, price: 9000, supplierId: 'grossiste' },
  { id: 'lait', name: 'Lait', category: 'Produits laitiers', unit: 'L', stock: 15, reserved: 0, minimumStock: 8, price: 5200, supplierId: 'grossiste', expiryDate: '2026-11-09' },
  { id: 'pain', name: 'Pain', category: 'Féculents', unit: 'unité', stock: 115, reserved: 0, minimumStock: 50, price: 700, local: true, supplierId: 'marche' },
  { id: 'banane', name: 'Banane', category: 'Fruits', unit: 'kg', stock: 10, reserved: 0, minimumStock: 5, price: 4500, local: true, supplierId: 'producteur', expiryDate: '2026-11-05' },
  { id: 'papaye', name: 'Papaye', category: 'Fruits', unit: 'kg', stock: 7, reserved: 0, minimumStock: 4, price: 5200, local: true, supplierId: 'producteur', expiryDate: '2026-11-06' },
  { id: 'orange', name: 'Orange', category: 'Fruits', unit: 'kg', stock: 8, reserved: 0, minimumStock: 4, price: 4800, local: true, supplierId: 'marche', expiryDate: '2026-11-10' }
]

export const demoRecipes: Recipe[] = [
  { id: 'pain-lait-banane', name: 'Pain, lait et banane', mealType: 'Petit-déjeuner', groups: ['féculent', 'laitier', 'fruit'], localScore: 4, ingredients: [{ foodId: 'pain', quantityPerBasePortion: 1 }, { foodId: 'lait', quantityPerBasePortion: 0.2 }, { foodId: 'banane', quantityPerBasePortion: 0.1 }] },
  { id: 'patate-lait-fruit', name: 'Patate douce, lait et fruit', mealType: 'Petit-déjeuner', groups: ['féculent', 'laitier', 'fruit'], localScore: 5, ingredients: [{ foodId: 'patate-douce', quantityPerBasePortion: 0.18 }, { foodId: 'lait', quantityPerBasePortion: 0.18 }, { foodId: 'papaye', quantityPerBasePortion: 0.1 }] },
  { id: 'pain-oeuf-orange', name: 'Pain, œuf et orange', mealType: 'Petit-déjeuner', groups: ['féculent', 'protéine', 'fruit'], localScore: 4, ingredients: [{ foodId: 'pain', quantityPerBasePortion: 1 }, { foodId: 'oeufs', quantityPerBasePortion: 1 }, { foodId: 'orange', quantityPerBasePortion: 0.1 }] },
  { id: 'riz-poulet-legumes-banane', name: 'Riz, poulet, légumes et banane', mealType: 'Déjeuner', groups: ['féculent', 'protéine', 'légumes', 'fruit'], localScore: 5, ingredients: [{ foodId: 'riz', quantityPerBasePortion: 0.16 }, { foodId: 'poulet', quantityPerBasePortion: 0.09 }, { foodId: 'carotte', quantityPerBasePortion: 0.04 }, { foodId: 'anana', quantityPerBasePortion: 0.03 }, { foodId: 'huile', quantityPerBasePortion: 0.012 }, { foodId: 'banane', quantityPerBasePortion: 0.08 }] },
  { id: 'riz-tsaramaso-viande-anana', name: 'Riz, tsaramaso, viande et anana', mealType: 'Déjeuner', groups: ['féculent', 'protéine', 'légumineuse', 'légumes'], localScore: 5, ingredients: [{ foodId: 'riz', quantityPerBasePortion: 0.15 }, { foodId: 'tsaramaso', quantityPerBasePortion: 0.055 }, { foodId: 'viande', quantityPerBasePortion: 0.06 }, { foodId: 'anana', quantityPerBasePortion: 0.045 }, { foodId: 'tomate', quantityPerBasePortion: 0.025 }, { foodId: 'huile', quantityPerBasePortion: 0.01 }] },
  { id: 'riz-poisson-legumes', name: 'Riz, poisson et légumes', mealType: 'Déjeuner', groups: ['féculent', 'protéine', 'légumes'], localScore: 5, ingredients: [{ foodId: 'riz', quantityPerBasePortion: 0.16 }, { foodId: 'poisson', quantityPerBasePortion: 0.09 }, { foodId: 'carotte', quantityPerBasePortion: 0.035 }, { foodId: 'courgette', quantityPerBasePortion: 0.04 }, { foodId: 'huile', quantityPerBasePortion: 0.012 }] },
  { id: 'riz-voanjobory-viande', name: 'Riz, voanjobory, viande et légumes', mealType: 'Déjeuner', groups: ['féculent', 'protéine', 'légumineuse', 'légumes'], localScore: 5, ingredients: [{ foodId: 'riz', quantityPerBasePortion: 0.15 }, { foodId: 'voanjobory', quantityPerBasePortion: 0.06 }, { foodId: 'viande', quantityPerBasePortion: 0.055 }, { foodId: 'tomate', quantityPerBasePortion: 0.025 }, { foodId: 'anana', quantityPerBasePortion: 0.04 }, { foodId: 'huile', quantityPerBasePortion: 0.01 }] },
  { id: 'riz-lentilles-oeuf', name: 'Riz, lentilles, œuf et légumes', mealType: 'Déjeuner', groups: ['féculent', 'protéine', 'légumineuse', 'légumes'], localScore: 4, ingredients: [{ foodId: 'riz', quantityPerBasePortion: 0.15 }, { foodId: 'lentilles', quantityPerBasePortion: 0.06 }, { foodId: 'oeufs', quantityPerBasePortion: 1 }, { foodId: 'carotte', quantityPerBasePortion: 0.035 }, { foodId: 'tomate', quantityPerBasePortion: 0.025 }] },
  { id: 'soupe-legumes-oeuf', name: 'Soupe de légumes, pomme de terre et œuf', mealType: 'Dîner', groups: ['féculent', 'protéine', 'légumes'], localScore: 4, ingredients: [{ foodId: 'ovy', quantityPerBasePortion: 0.14 }, { foodId: 'oeufs', quantityPerBasePortion: 1 }, { foodId: 'carotte', quantityPerBasePortion: 0.04 }, { foodId: 'courgette', quantityPerBasePortion: 0.04 }, { foodId: 'tomate', quantityPerBasePortion: 0.025 }] },
  { id: 'mangahazo-tsaramaso-anana', name: 'Manioc, tsaramaso et anana', mealType: 'Dîner', groups: ['féculent', 'légumineuse', 'légumes'], localScore: 5, ingredients: [{ foodId: 'mangahazo', quantityPerBasePortion: 0.2 }, { foodId: 'tsaramaso', quantityPerBasePortion: 0.065 }, { foodId: 'anana', quantityPerBasePortion: 0.05 }, { foodId: 'tomate', quantityPerBasePortion: 0.025 }] },
  { id: 'pates-legumes-oeuf', name: 'Pâtes, légumes et œuf', mealType: 'Dîner', groups: ['féculent', 'protéine', 'légumes'], localScore: 3, ingredients: [{ foodId: 'pates', quantityPerBasePortion: 0.12 }, { foodId: 'oeufs', quantityPerBasePortion: 1 }, { foodId: 'carotte', quantityPerBasePortion: 0.035 }, { foodId: 'tomate', quantityPerBasePortion: 0.025 }] },
  { id: 'patate-lait-fruit-diner', name: 'Patate douce, lait et fruit', mealType: 'Dîner', groups: ['féculent', 'laitier', 'fruit'], localScore: 5, ingredients: [{ foodId: 'patate-douce', quantityPerBasePortion: 0.2 }, { foodId: 'lait', quantityPerBasePortion: 0.18 }, { foodId: 'banane', quantityPerBasePortion: 0.08 }] },
  { id: 'banane-gouter', name: 'Banane', mealType: 'Goûter', groups: ['fruit'], localScore: 5, ingredients: [{ foodId: 'banane', quantityPerBasePortion: 0.1 }] },
  { id: 'papaye-gouter', name: 'Papaye', mealType: 'Goûter', groups: ['fruit'], localScore: 5, ingredients: [{ foodId: 'papaye', quantityPerBasePortion: 0.1 }] },
  { id: 'pain-lait-gouter', name: 'Pain et lait', mealType: 'Goûter', groups: ['féculent', 'laitier'], localScore: 3, ingredients: [{ foodId: 'pain', quantityPerBasePortion: 1 }, { foodId: 'lait', quantityPerBasePortion: 0.15 }] }
]

export const demoWeek: DayMenu[] = [
  { day: 'Lundi', breakfast: 'pain-lait-banane', lunch: 'riz-poulet-legumes-banane', snack: 'papaye-gouter', dinner: 'soupe-legumes-oeuf' },
  { day: 'Mardi', breakfast: 'patate-lait-fruit', lunch: 'riz-tsaramaso-viande-anana', snack: 'banane-gouter', dinner: 'mangahazo-tsaramaso-anana' },
  { day: 'Mercredi', breakfast: 'pain-oeuf-orange', lunch: 'riz-poisson-legumes', snack: 'pain-lait-gouter', dinner: 'pates-legumes-oeuf' },
  { day: 'Jeudi', breakfast: 'pain-lait-banane', lunch: 'riz-voanjobory-viande', snack: 'papaye-gouter', dinner: 'soupe-legumes-oeuf' },
  { day: 'Vendredi', breakfast: 'patate-lait-fruit', lunch: 'riz-lentilles-oeuf', snack: 'banane-gouter', dinner: 'mangahazo-tsaramaso-anana' },
  { day: 'Samedi', breakfast: 'pain-oeuf-orange', lunch: 'riz-poisson-legumes', snack: 'pain-lait-gouter', dinner: 'pates-legumes-oeuf' },
  { day: 'Dimanche', breakfast: 'pain-lait-banane', lunch: 'riz-poulet-legumes-banane', snack: 'papaye-gouter', dinner: 'patate-lait-fruit-diner' }
]

export const demoMovements: StockMovement[] = [
  { id: 'm1', foodId: 'riz', type: 'entrée', quantity: 50, date: '2026-11-01', reason: 'Achat hebdomadaire', user: 'Responsable stock' },
  { id: 'm2', foodId: 'banana', type: 'don', quantity: 8, date: '2026-11-02', reason: 'Don reçu', user: 'Direction' },
  { id: 'm3', foodId: 'poulet', type: 'entrée', quantity: 10, date: '2026-11-02', reason: 'Achat fournisseur', user: 'Responsable stock' }
]
