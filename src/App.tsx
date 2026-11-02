import { useEffect, useMemo, useState } from 'react'
import { demoFoods, demoRecipes, demoWeek } from './data'
import type { DayMenu, Food, MealType, ShoppingNeed } from './types'

type Section = 'dashboard' | 'stock' | 'menus' | 'courses' | 'recettes' | 'parametres'

type NewFood = {
  name: string
  category: string
  unit: Food['unit']
  stock: number
  minimumStock: number
  price: number
}

const STORAGE = {
  foods: 'nutristock.foods.v1',
  week: 'nutristock.week.v1',
  children: 'nutristock.children.v1',
  budget: 'nutristock.budget.v1'
}

const mealFields: Array<{ key: keyof Omit<DayMenu, 'day'>; label: MealType }> = [
  { key: 'breakfast', label: 'Petit-déjeuner' },
  { key: 'lunch', label: 'Déjeuner' },
  { key: 'snack', label: 'Goûter' },
  { key: 'dinner', label: 'Dîner' }
]

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} Ar`
}

function formatQty(value: number, unit: string) {
  const digits = unit === 'unité' ? 0 : 2
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: digits })} ${unit}`
}

function daysUntil(date?: string) {
  if (!date) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(`${date}T00:00:00`)
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
}

function App() {
  const [section, setSection] = useState<Section>('dashboard')
  const [foods, setFoods] = useState<Food[]>(() => readStorage(STORAGE.foods, demoFoods))
  const [week, setWeek] = useState<DayMenu[]>(() => readStorage(STORAGE.week, demoWeek))
  const [childrenCount, setChildrenCount] = useState<number>(() => readStorage(STORAGE.children, 80))
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => readStorage(STORAGE.budget, 8_000_000))
  const [newFood, setNewFood] = useState<NewFood>({
    name: '',
    category: 'Autre',
    unit: 'kg',
    stock: 0,
    minimumStock: 0,
    price: 0
  })

  useEffect(() => localStorage.setItem(STORAGE.foods, JSON.stringify(foods)), [foods])
  useEffect(() => localStorage.setItem(STORAGE.week, JSON.stringify(week)), [week])
  useEffect(() => localStorage.setItem(STORAGE.children, JSON.stringify(childrenCount)), [childrenCount])
  useEffect(() => localStorage.setItem(STORAGE.budget, JSON.stringify(monthlyBudget)), [monthlyBudget])

  const foodMap = useMemo(() => new Map(foods.map((food) => [food.id, food])), [foods])
  const recipeMap = useMemo(() => new Map(demoRecipes.map((recipe) => [recipe.id, recipe])), [])

  const weeklyRequirements = useMemo(() => {
    const needs = new Map<string, number>()
    week.forEach((day) => {
      mealFields.forEach(({ key }) => {
        const recipe = recipeMap.get(day[key])
        recipe?.ingredients.forEach((ingredient) => {
          const current = needs.get(ingredient.foodId) ?? 0
          needs.set(ingredient.foodId, current + ingredient.quantityPerChild * childrenCount)
        })
      })
    })
    return needs
  }, [week, recipeMap, childrenCount])

  const shoppingNeeds = useMemo<ShoppingNeed[]>(() => {
    return foods
      .map((food) => {
        const required = weeklyRequirements.get(food.id) ?? 0
        const toBuy = Math.max(0, required - food.stock)
        return {
          food,
          required,
          available: food.stock,
          toBuy,
          estimatedCost: toBuy * food.price
        }
      })
      .filter((item) => item.required > 0)
      .sort((a, b) => b.estimatedCost - a.estimatedCost)
  }, [foods, weeklyRequirements])

  const shoppingCost = useMemo(
    () => shoppingNeeds.reduce((sum, item) => sum + item.estimatedCost, 0),
    [shoppingNeeds]
  )

  const plannedFoodValue = useMemo(
    () =>
      shoppingNeeds.reduce(
        (sum, item) => sum + item.required * item.food.price,
        0
      ),
    [shoppingNeeds]
  )

  const lowStock = useMemo(
    () => foods.filter((food) => food.stock <= food.minimumStock),
    [foods]
  )

  const expiringSoon = useMemo(
    () =>
      foods
        .map((food) => ({ food, days: daysUntil(food.expiryDate) }))
        .filter((item) => item.days !== null && item.days >= 0 && item.days <= 7)
        .sort((a, b) => (a.days ?? 99) - (b.days ?? 99)),
    [foods]
  )

  const shortageCount = shoppingNeeds.filter((item) => item.toBuy > 0).length
  const weeklyBudgetTarget = monthlyBudget / 4.33
  const budgetBalance = weeklyBudgetTarget - plannedFoodValue

  function recipeCost(recipeId: string) {
    const recipe = recipeMap.get(recipeId)
    if (!recipe) return 0
    return recipe.ingredients.reduce((sum, ingredient) => {
      const food = foodMap.get(ingredient.foodId)
      return sum + (food?.price ?? 0) * ingredient.quantityPerChild * childrenCount
    }, 0)
  }

  function updateStock(id: string, stock: number) {
    setFoods((current) => current.map((food) => (food.id === id ? { ...food, stock: Math.max(0, stock) } : food)))
  }

  function updatePrice(id: string, price: number) {
    setFoods((current) => current.map((food) => (food.id === id ? { ...food, price: Math.max(0, price) } : food)))
  }

  function updateMenu(dayIndex: number, key: keyof Omit<DayMenu, 'day'>, recipeId: string) {
    setWeek((current) => current.map((day, index) => (index === dayIndex ? { ...day, [key]: recipeId } : day)))
  }

  function addFood() {
    if (!newFood.name.trim()) return
    const idBase = newFood.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const id = `${idBase || 'aliment'}-${Date.now()}`
    setFoods((current) => [...current, { id, ...newFood, name: newFood.name.trim() }])
    setNewFood({ name: '', category: 'Autre', unit: 'kg', stock: 0, minimumStock: 0, price: 0 })
  }

  function resetDemo() {
    if (!window.confirm('Réinitialiser les données de démonstration ?')) return
    setFoods(demoFoods)
    setWeek(demoWeek)
    setChildrenCount(80)
    setMonthlyBudget(8_000_000)
  }

  const navItems: Array<{ key: Section; label: string; icon: string }> = [
    { key: 'dashboard', label: 'Tableau de bord', icon: '▦' },
    { key: 'stock', label: 'Stock & prix', icon: '▤' },
    { key: 'menus', label: 'Menus semaine', icon: '☷' },
    { key: 'courses', label: 'Liste de courses', icon: '✓' },
    { key: 'recettes', label: 'Recettes', icon: '◫' },
    { key: 'parametres', label: 'Paramètres', icon: '⚙' }
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">N</div>
          <div>
            <strong>NutriStock</strong>
            <span>Orphelinat</span>
          </div>
        </div>

        <nav>
          {navItems.map((item) => (
            <button
              key={item.key}
              className={section === item.key ? 'nav-item active' : 'nav-item'}
              onClick={() => setSection(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span>Enfants planifiés</span>
          <strong>{childrenCount}</strong>
          <small>Données sauvegardées sur cet appareil</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">CENTRE ORPHELINAT DE LA GENDARMERIE</p>
            <h1>{navItems.find((item) => item.key === section)?.label}</h1>
          </div>
          <div className="topbar-actions">
            <span className="status-dot" />
            <span>Mode local actif</span>
          </div>
        </header>

        {section === 'dashboard' && (
          <section>
            <div className="hero-card">
              <div>
                <span className="pill">Planification nutritionnelle</span>
                <h2>Une semaine de repas maîtrisée, du menu jusqu’au stock.</h2>
                <p>
                  Les quantités et coûts sont recalculés automatiquement pour {childrenCount} enfants à partir des menus sélectionnés.
                </p>
              </div>
              <button className="primary-btn" onClick={() => setSection('menus')}>Planifier la semaine</button>
            </div>

            <div className="stats-grid">
              <article className="stat-card">
                <span>Enfants</span>
                <strong>{childrenCount}</strong>
                <small>pris en compte dans les portions</small>
              </article>
              <article className="stat-card">
                <span>Valeur des repas / semaine</span>
                <strong>{formatMoney(plannedFoodValue)}</strong>
                <small>{formatMoney(plannedFoodValue / Math.max(childrenCount, 1) / 7)} / enfant / jour</small>
              </article>
              <article className="stat-card">
                <span>Achats à prévoir</span>
                <strong>{formatMoney(shoppingCost)}</strong>
                <small>{shortageCount} aliment(s) insuffisant(s)</small>
              </article>
              <article className={budgetBalance >= 0 ? 'stat-card good' : 'stat-card danger'}>
                <span>Budget semaine</span>
                <strong>{formatMoney(weeklyBudgetTarget)}</strong>
                <small>{budgetBalance >= 0 ? `${formatMoney(budgetBalance)} de marge` : `${formatMoney(Math.abs(budgetBalance))} de dépassement`}</small>
              </article>
            </div>

            <div className="two-columns">
              <article className="panel">
                <div className="panel-title">
                  <div>
                    <span className="eyebrow">ALERTES</span>
                    <h3>À surveiller</h3>
                  </div>
                  <span className="count-badge">{lowStock.length + expiringSoon.length}</span>
                </div>
                <div className="alert-list">
                  {lowStock.map((food) => (
                    <div className="alert-row warning" key={`low-${food.id}`}>
                      <span className="alert-symbol">!</span>
                      <div>
                        <strong>Stock faible : {food.name}</strong>
                        <small>{formatQty(food.stock, food.unit)} restant(s), seuil {formatQty(food.minimumStock, food.unit)}</small>
                      </div>
                    </div>
                  ))}
                  {expiringSoon.map(({ food, days }) => (
                    <div className="alert-row" key={`expiry-${food.id}`}>
                      <span className="alert-symbol">⌛</span>
                      <div>
                        <strong>{food.name} à utiliser rapidement</strong>
                        <small>{days === 0 ? "Péremption aujourd’hui" : `Péremption dans ${days} jour(s)`}</small>
                      </div>
                    </div>
                  ))}
                  {lowStock.length === 0 && expiringSoon.length === 0 && <p className="empty">Aucune alerte importante.</p>}
                </div>
              </article>

              <article className="panel">
                <div className="panel-title">
                  <div>
                    <span className="eyebrow">SEMAINE</span>
                    <h3>Aperçu des menus</h3>
                  </div>
                  <button className="text-btn" onClick={() => setSection('menus')}>Modifier</button>
                </div>
                <div className="week-preview">
                  {week.map((day) => (
                    <div className="week-row" key={day.day}>
                      <strong>{day.day.slice(0, 3)}</strong>
                      <span>{recipeMap.get(day.lunch)?.name ?? '—'}</span>
                      <b>{formatMoney(recipeCost(day.lunch))}</b>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        )}

        {section === 'stock' && (
          <section>
            <div className="section-intro">
              <div>
                <p>Modifie directement les quantités et les prix. Les menus et la liste de courses se recalculent automatiquement.</p>
              </div>
            </div>

            <article className="panel table-panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Aliment</th>
                      <th>Catégorie</th>
                      <th>Stock</th>
                      <th>Seuil mini.</th>
                      <th>Prix unitaire</th>
                      <th>État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foods.map((food) => (
                      <tr key={food.id}>
                        <td><strong>{food.name}</strong></td>
                        <td>{food.category}</td>
                        <td>
                          <div className="number-with-unit">
                            <input type="number" min="0" step="0.01" value={food.stock} onChange={(e) => updateStock(food.id, Number(e.target.value))} />
                            <span>{food.unit}</span>
                          </div>
                        </td>
                        <td>{formatQty(food.minimumStock, food.unit)}</td>
                        <td>
                          <div className="number-with-unit money-input">
                            <input type="number" min="0" step="100" value={food.price} onChange={(e) => updatePrice(food.id, Number(e.target.value))} />
                            <span>Ar</span>
                          </div>
                        </td>
                        <td>
                          <span className={food.stock <= food.minimumStock ? 'state danger' : 'state ok'}>
                            {food.stock <= food.minimumStock ? 'À réapprovisionner' : 'Disponible'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel add-form">
              <div>
                <span className="eyebrow">NOUVEL ALIMENT</span>
                <h3>Ajouter au catalogue</h3>
              </div>
              <div className="form-grid">
                <label>Nom<input value={newFood.name} onChange={(e) => setNewFood({ ...newFood, name: e.target.value })} placeholder="Ex. Patate douce" /></label>
                <label>Catégorie<input value={newFood.category} onChange={(e) => setNewFood({ ...newFood, category: e.target.value })} /></label>
                <label>Unité<select value={newFood.unit} onChange={(e) => setNewFood({ ...newFood, unit: e.target.value as Food['unit'] })}><option>kg</option><option>L</option><option>unité</option></select></label>
                <label>Stock<input type="number" min="0" value={newFood.stock} onChange={(e) => setNewFood({ ...newFood, stock: Number(e.target.value) })} /></label>
                <label>Seuil minimum<input type="number" min="0" value={newFood.minimumStock} onChange={(e) => setNewFood({ ...newFood, minimumStock: Number(e.target.value) })} /></label>
                <label>Prix / unité<input type="number" min="0" value={newFood.price} onChange={(e) => setNewFood({ ...newFood, price: Number(e.target.value) })} /></label>
              </div>
              <button className="primary-btn" onClick={addFood}>Ajouter l’aliment</button>
            </article>
          </section>
        )}

        {section === 'menus' && (
          <section>
            <div className="section-toolbar">
              <p>Choisis les repas pour chaque jour. Les besoins de stock et le coût s’actualisent instantanément.</p>
              <label className="inline-field">Nombre d’enfants<input type="number" min="1" value={childrenCount} onChange={(e) => setChildrenCount(Math.max(1, Number(e.target.value)))} /></label>
            </div>

            <div className="menu-grid">
              {week.map((day, dayIndex) => {
                const dayTotal = mealFields.reduce((sum, { key }) => sum + recipeCost(day[key]), 0)
                return (
                  <article className="day-card" key={day.day}>
                    <div className="day-head">
                      <h3>{day.day}</h3>
                      <span>{formatMoney(dayTotal)}</span>
                    </div>
                    {mealFields.map(({ key, label }) => (
                      <label className="meal-select" key={key}>
                        <span>{label}</span>
                        <select value={day[key]} onChange={(e) => updateMenu(dayIndex, key, e.target.value)}>
                          {demoRecipes.filter((recipe) => recipe.mealType === label).map((recipe) => (
                            <option value={recipe.id} key={recipe.id}>{recipe.name}</option>
                          ))}
                        </select>
                        <small>{formatMoney(recipeCost(day[key]))}</small>
                      </label>
                    ))}
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {section === 'courses' && (
          <section>
            <div className="shopping-summary">
              <div>
                <span className="eyebrow">ACHATS POUR 7 JOURS</span>
                <h2>{formatMoney(shoppingCost)}</h2>
                <p>Montant estimé uniquement pour les quantités manquantes selon le stock actuel.</p>
              </div>
              <button className="secondary-btn" onClick={() => window.print()}>Imprimer la liste</button>
            </div>

            <article className="panel table-panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Aliment</th>
                      <th>Besoin semaine</th>
                      <th>En stock</th>
                      <th>À acheter</th>
                      <th>Prix</th>
                      <th>Coût estimé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shoppingNeeds.map((item) => (
                      <tr key={item.food.id} className={item.toBuy > 0 ? 'needs-buy' : ''}>
                        <td><strong>{item.food.name}</strong></td>
                        <td>{formatQty(item.required, item.food.unit)}</td>
                        <td>{formatQty(item.available, item.food.unit)}</td>
                        <td><strong>{item.toBuy > 0 ? formatQty(item.toBuy, item.food.unit) : '—'}</strong></td>
                        <td>{formatMoney(item.food.price)} / {item.food.unit}</td>
                        <td><strong>{item.estimatedCost > 0 ? formatMoney(item.estimatedCost) : 'Stock suffisant'}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr><td colSpan={5}>TOTAL À ACHETER</td><td>{formatMoney(shoppingCost)}</td></tr>
                  </tfoot>
                </table>
              </div>
            </article>
          </section>
        )}

        {section === 'recettes' && (
          <section>
            <div className="section-intro"><p>Les portions ci-dessous servent de base au calcul automatique. Elles devront être validées par le professionnel nutrition/santé du centre avant utilisation définitive.</p></div>
            <div className="recipe-grid">
              {demoRecipes.map((recipe) => (
                <article className="recipe-card" key={recipe.id}>
                  <div className="recipe-head">
                    <span className="pill">{recipe.mealType}</span>
                    <strong>{formatMoney(recipeCost(recipe.id))}</strong>
                  </div>
                  <h3>{recipe.name}</h3>
                  <p>{recipe.note ?? 'Recette intégrée à la planification hebdomadaire.'}</p>
                  <div className="ingredient-list">
                    {recipe.ingredients.map((ingredient) => {
                      const food = foodMap.get(ingredient.foodId)
                      if (!food) return null
                      return <div key={ingredient.foodId}><span>{food.name}</span><b>{formatQty(ingredient.quantityPerChild * childrenCount, food.unit)}</b></div>
                    })}
                  </div>
                  <small>Quantités affichées pour {childrenCount} enfants.</small>
                </article>
              ))}
            </div>
          </section>
        )}

        {section === 'parametres' && (
          <section className="settings-grid">
            <article className="panel settings-card">
              <span className="eyebrow">PLANIFICATION</span>
              <h3>Paramètres du centre</h3>
              <label>Nombre d’enfants<input type="number" min="1" value={childrenCount} onChange={(e) => setChildrenCount(Math.max(1, Number(e.target.value)))} /></label>
              <label>Budget alimentaire mensuel (Ar)<input type="number" min="0" step="10000" value={monthlyBudget} onChange={(e) => setMonthlyBudget(Math.max(0, Number(e.target.value)))} /></label>
              <div className="budget-box">
                <span>Budget hebdomadaire indicatif</span>
                <strong>{formatMoney(weeklyBudgetTarget)}</strong>
              </div>
            </article>

            <article className="panel settings-card">
              <span className="eyebrow">DONNÉES</span>
              <h3>Mode actuel</h3>
              <p>Cette première version fonctionne en mode local : les modifications sont sauvegardées dans le navigateur. Le schéma Supabase inclus dans le dépôt permet le passage à une base multi-utilisateur.</p>
              <button className="danger-btn" onClick={resetDemo}>Réinitialiser les données de démonstration</button>
            </article>

            <article className="panel settings-card notice-card">
              <span className="eyebrow">IMPORTANT</span>
              <h3>Validation nutritionnelle</h3>
              <p>Le logiciel automatise les calculs de quantités, prix et stock. Les portions, règles nutritionnelles, allergies et restrictions doivent être validées par un professionnel compétent avant déploiement réel auprès des enfants.</p>
            </article>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
