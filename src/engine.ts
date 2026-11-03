import type { AgeGroup, DayMenu, Food, MealType, Recipe, SmartSuggestion } from './types'

const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const mealSlots: Array<{ key: keyof Omit<DayMenu, 'day'>; type: MealType }> = [
  { key: 'breakfast', type: 'Petit-déjeuner' },
  { key: 'lunch', type: 'Déjeuner' },
  { key: 'snack', type: 'Goûter' },
  { key: 'dinner', type: 'Dîner' }
]

export function totalChildren(groups: AgeGroup[]) {
  return groups.reduce((sum, group) => sum + group.count, 0)
}

export function basePortions(groups: AgeGroup[]) {
  return groups.reduce((sum, group) => sum + group.count * group.portionFactor, 0)
}

export function daysUntil(date?: string) {
  if (!date) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(`${date}T00:00:00`)
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
}

export function recipeRequirements(recipe: Recipe, groups: AgeGroup[]) {
  const portions = basePortions(groups)
  return recipe.ingredients.map((ingredient) => ({
    foodId: ingredient.foodId,
    quantity: ingredient.quantityPerBasePortion * portions
  }))
}

export function recipeCost(recipe: Recipe, groups: AgeGroup[], foods: Food[]) {
  const foodMap = new Map(foods.map((food) => [food.id, food]))
  return recipeRequirements(recipe, groups).reduce((sum, need) => {
    const food = foodMap.get(need.foodId)
    return sum + (food?.price ?? 0) * need.quantity
  }, 0)
}

export function evaluateRecipe(
  recipe: Recipe,
  groups: AgeGroup[],
  foods: Food[],
  budgetPerMeal: number,
  recentRecipeIds: string[] = []
): SmartSuggestion {
  const foodMap = new Map(foods.map((food) => [food.id, food]))
  const needs = recipeRequirements(recipe, groups)
  const cost = recipeCost(recipe, groups, foods)
  let covered = 0
  let total = 0
  let expiringBonus = 0
  const reasons: string[] = []

  needs.forEach((need) => {
    const food = foodMap.get(need.foodId)
    if (!food) return
    const available = Math.max(0, food.stock - (food.reserved ?? 0))
    total += need.quantity
    covered += Math.min(need.quantity, available)
    const expiry = daysUntil(food.expiryDate)
    if (expiry !== null && expiry >= 0 && expiry <= 5 && available > 0) {
      expiringBonus += Math.max(0, 6 - expiry)
    }
  })

  const stockCoverage = total > 0 ? covered / total : 1
  const budgetRatio = budgetPerMeal > 0 ? cost / budgetPerMeal : 1
  const budgetScore = budgetRatio <= 1 ? 18 : Math.max(-25, 18 - (budgetRatio - 1) * 35)
  const diversityPenalty = recentRecipeIds.includes(recipe.id) ? 22 : 0
  const localBonus = recipe.localScore * 2
  const groupBonus = Math.min(recipe.groups.length, 4) * 3

  const score = stockCoverage * 48 + budgetScore + expiringBonus * 2 + localBonus + groupBonus - diversityPenalty

  if (stockCoverage >= 0.95) reasons.push('Presque entièrement couvert par le stock')
  else if (stockCoverage >= 0.7) reasons.push('Stock partiellement disponible')
  else reasons.push('Achats importants nécessaires')
  if (expiringBonus > 0) reasons.push('Utilise des produits proches de la péremption')
  if (budgetRatio <= 1) reasons.push('Compatible avec le budget cible du repas')
  else reasons.push('Dépasse le budget cible du repas')
  if (recipe.localScore >= 4) reasons.push('Valorise des aliments locaux')
  if (recentRecipeIds.includes(recipe.id)) reasons.push('Pénalisé pour éviter les répétitions')

  return { recipeId: recipe.id, score, stockCoverage, estimatedCost: cost, expiringBonus, reasons }
}

export function suggestRecipes(
  mealType: MealType,
  groups: AgeGroup[],
  foods: Food[],
  recipes: Recipe[],
  weeklyBudget: number,
  recentRecipeIds: string[] = []
) {
  const budgetPerMeal = weeklyBudget / 28
  return recipes
    .filter((recipe) => recipe.mealType === mealType)
    .map((recipe) => evaluateRecipe(recipe, groups, foods, budgetPerMeal, recentRecipeIds))
    .sort((a, b) => b.score - a.score)
}

export function generateSmartWeek(
  groups: AgeGroup[],
  foods: Food[],
  recipes: Recipe[],
  weeklyBudget: number
): DayMenu[] {
  const recentByType = new Map<MealType, string[]>()
  const result: DayMenu[] = []

  days.forEach((day) => {
    const menu: DayMenu = { day, breakfast: '', lunch: '', snack: '', dinner: '' }
    mealSlots.forEach(({ key, type }) => {
      const recent = recentByType.get(type) ?? []
      const suggestions = suggestRecipes(type, groups, foods, recipes, weeklyBudget, recent.slice(-2))
      const chosen = suggestions[0]
      if (chosen) {
        menu[key] = chosen.recipeId
        recentByType.set(type, [...recent, chosen.recipeId])
      }
    })
    result.push(menu)
  })

  return result
}
