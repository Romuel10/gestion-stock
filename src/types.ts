export type MealType = 'Petit-déjeuner' | 'Déjeuner' | 'Goûter' | 'Dîner'

export type Food = {
  id: string
  name: string
  category: string
  unit: 'kg' | 'L' | 'unité'
  stock: number
  minimumStock: number
  price: number
  expiryDate?: string
}

export type RecipeIngredient = {
  foodId: string
  quantityPerChild: number
}

export type Recipe = {
  id: string
  name: string
  mealType: MealType
  ingredients: RecipeIngredient[]
  note?: string
}

export type DayMenu = {
  day: string
  breakfast: string
  lunch: string
  snack: string
  dinner: string
}

export type ShoppingNeed = {
  food: Food
  required: number
  available: number
  toBuy: number
  estimatedCost: number
}
