export type MealType = 'Petit-déjeuner' | 'Déjeuner' | 'Goûter' | 'Dîner'

export type AgeGroup = {
  id: string
  label: string
  minAge: number
  maxAge: number
  count: number
  portionFactor: number
  restrictions: string[]
}

export type Supplier = {
  id: string
  name: string
  contact?: string
  location?: string
  type?: string
  phone?: string
  notes?: string
}

export type PricePoint = {
  date: string
  price: number
  supplierId?: string
}

export type Food = {
  id: string
  name: string
  category: string
  unit: 'kg' | 'L' | 'unité'
  stock: number
  reserved?: number
  minimumStock: number
  price: number
  expiryDate?: string
  local?: boolean
  supplierId?: string
  priceHistory?: PricePoint[]
}

export type RecipeIngredient = {
  foodId: string
  quantityPerBasePortion: number
}

export type Recipe = {
  id: string
  name: string
  mealType: MealType
  ingredients: RecipeIngredient[]
  groups: string[]
  localScore: number
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
  reserved: number
  toBuy: number
  estimatedCost: number
}

export type StockMovement = {
  id: string
  foodId: string
  type: 'entrée' | 'sortie' | 'don' | 'ajustement' | 'perte'
  quantity: number
  date: string
  unitPrice?: number
  note?: string
  reason?: string
  user?: string
}

export type AuditEntry = {
  id: string
  date: string
  user: string
  action: string
}

export type SmartSuggestion = {
  recipeId: string
  score: number
  stockCoverage: number
  estimatedCost: number
  expiringBonus: number
  reasons: string[]
}
