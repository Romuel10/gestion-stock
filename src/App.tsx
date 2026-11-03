import { useEffect, useMemo, useState } from 'react'
import { demoAgeGroups, demoFoods, demoMovements, demoRecipes, demoSuppliers, demoWeek } from './data'
import { basePortions, daysUntil, generateSmartWeek, recipeCost, suggestRecipes, totalChildren } from './engine'
import type { AgeGroup, DayMenu, Food, MealType, ShoppingNeed, StockMovement, Supplier } from './types'

type Section = 'dashboard' | 'enfants' | 'menus' | 'stock' | 'mouvements' | 'fournisseurs' | 'rapports' | 'parametres'

type NewFood = {
  name: string
  category: string
  unit: Food['unit']
  stock: number
  minimumStock: number
  price: number
}

type MovementDraft = {
  foodId: string
  type: StockMovement['type']
  quantity: number
  reason: string
}

const STORAGE = {
  foods: 'orphenutri.foods.v2',
  groups: 'orphenutri.groups.v2',
  week: 'orphenutri.week.v2',
  budget: 'orphenutri.budget.v2',
  movements: 'orphenutri.movements.v2'
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

function todayName() {
  const names = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  return names[new Date().getDay()]
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const content = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';'))
    .join('\n')
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function App() {
  const [section, setSection] = useState<Section>('dashboard')
  const [foods, setFoods] = useState<Food[]>(() => readStorage(STORAGE.foods, demoFoods))
  const [groups, setGroups] = useState<AgeGroup[]>(() => readStorage(STORAGE.groups, demoAgeGroups))
  const [week, setWeek] = useState<DayMenu[]>(() => readStorage(STORAGE.week, demoWeek))
  const [weeklyBudget, setWeeklyBudget] = useState<number>(() => readStorage(STORAGE.budget, 1_800_000))
  const [movements, setMovements] = useState<StockMovement[]>(() => readStorage(STORAGE.movements, demoMovements))
  const [newFood, setNewFood] = useState<NewFood>({ name: '', category: 'Autre', unit: 'kg', stock: 0, minimumStock: 0, price: 0 })
  const [movementDraft, setMovementDraft] = useState<MovementDraft>({ foodId: 'riz', type: 'entrée', quantity: 0, reason: '' })
  const [smartMealType, setSmartMealType] = useState<MealType>('Déjeuner')
  const suppliers: Supplier[] = demoSuppliers

  useEffect(() => localStorage.setItem(STORAGE.foods, JSON.stringify(foods)), [foods])
  useEffect(() => localStorage.setItem(STORAGE.groups, JSON.stringify(groups)), [groups])
  useEffect(() => localStorage.setItem(STORAGE.week, JSON.stringify(week)), [week])
  useEffect(() => localStorage.setItem(STORAGE.budget, JSON.stringify(weeklyBudget)), [weeklyBudget])
  useEffect(() => localStorage.setItem(STORAGE.movements, JSON.stringify(movements)), [movements])

  const foodMap = useMemo(() => new Map(foods.map((food) => [food.id, food])), [foods])
  const recipeMap = useMemo(() => new Map(demoRecipes.map((recipe) => [recipe.id, recipe])), [])
  const supplierMap = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier])), [suppliers])
  const childrenCount = useMemo(() => totalChildren(groups), [groups])
  const weightedPortions = useMemo(() => basePortions(groups), [groups])

  const weeklyRequirements = useMemo(() => {
    const needs = new Map<string, number>()
    week.forEach((day) => {
      mealFields.forEach(({ key }) => {
        const recipe = recipeMap.get(day[key])
        recipe?.ingredients.forEach((ingredient) => {
          needs.set(ingredient.foodId, (needs.get(ingredient.foodId) ?? 0) + ingredient.quantityPerBasePortion * weightedPortions)
        })
      })
    })
    return needs
  }, [week, recipeMap, weightedPortions])

  const shoppingNeeds = useMemo<ShoppingNeed[]>(() => {
    return foods
      .map((food) => {
        const required = weeklyRequirements.get(food.id) ?? 0
        const reserved = food.reserved ?? 0
        const available = Math.max(0, food.stock - reserved)
        const toBuy = Math.max(0, required - available)
        return { food, required, available, reserved, toBuy, estimatedCost: toBuy * food.price }
      })
      .filter((item) => item.required > 0)
      .sort((a, b) => b.estimatedCost - a.estimatedCost)
  }, [foods, weeklyRequirements])

  const shoppingCost = useMemo(() => shoppingNeeds.reduce((sum, item) => sum + item.estimatedCost, 0), [shoppingNeeds])
  const plannedFoodValue = useMemo(() => shoppingNeeds.reduce((sum, item) => sum + item.required * item.food.price, 0), [shoppingNeeds])
  const budgetBalance = weeklyBudget - plannedFoodValue
  const lowStock = useMemo(() => foods.filter((food) => food.stock <= food.minimumStock), [foods])
  const expiringSoon = useMemo(() => foods.map((food) => ({ food, days: daysUntil(food.expiryDate) })).filter((item) => item.days !== null && item.days >= 0 && item.days <= 7).sort((a, b) => (a.days ?? 99) - (b.days ?? 99)), [foods])
  const stockValue = useMemo(() => foods.reduce((sum, food) => sum + food.stock * food.price, 0), [foods])
  const today = week.find((day) => day.day === todayName()) ?? week[0]
  const todayCost = mealFields.reduce((sum, { key }) => {
    const recipe = recipeMap.get(today[key])
    return sum + (recipe ? recipeCost(recipe, groups, foods) : 0)
  }, 0)

  const smartSuggestions = useMemo(
    () => suggestRecipes(smartMealType, groups, foods, demoRecipes, weeklyBudget, week.flatMap((day) => [day.breakfast, day.lunch, day.snack, day.dinner]).slice(-4)),
    [smartMealType, groups, foods, weeklyBudget, week]
  )

  function updateGroup(id: string, patch: Partial<AgeGroup>) {
    setGroups((current) => current.map((group) => (group.id === id ? { ...group, ...patch } : group)))
  }

  function updateStock(id: string, stock: number) {
    setFoods((current) => current.map((food) => (food.id === id ? { ...food, stock: Math.max(0, stock) } : food)))
  }

  function updatePrice(id: string, price: number) {
    setFoods((current) => current.map((food) => food.id === id ? { ...food, price: Math.max(0, price), priceHistory: [...(food.priceHistory ?? []), { date: new Date().toISOString().slice(0, 10), price: Math.max(0, price) }] } : food))
  }

  function updateMenu(dayIndex: number, key: keyof Omit<DayMenu, 'day'>, recipeId: string) {
    setWeek((current) => current.map((day, index) => index === dayIndex ? { ...day, [key]: recipeId } : day))
  }

  function addFood() {
    if (!newFood.name.trim()) return
    const id = `${newFood.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'aliment'}-${Date.now()}`
    setFoods((current) => [...current, { id, ...newFood, name: newFood.name.trim(), reserved: 0, priceHistory: [{ date: new Date().toISOString().slice(0, 10), price: newFood.price }] }])
    setNewFood({ name: '', category: 'Autre', unit: 'kg', stock: 0, minimumStock: 0, price: 0 })
  }

  function applyMovement() {
    if (!movementDraft.foodId || movementDraft.quantity <= 0) return
    const movement: StockMovement = {
      id: `m-${Date.now()}`,
      foodId: movementDraft.foodId,
      type: movementDraft.type,
      quantity: movementDraft.quantity,
      date: new Date().toISOString().slice(0, 10),
      reason: movementDraft.reason || 'Mouvement manuel',
      user: 'Utilisateur local'
    }
    setMovements((current) => [movement, ...current])
    setFoods((current) => current.map((food) => {
      if (food.id !== movement.foodId) return food
      const direction = movement.type === 'sortie' ? -1 : 1
      return { ...food, stock: Math.max(0, food.stock + direction * movement.quantity) }
    }))
    setMovementDraft((current) => ({ ...current, quantity: 0, reason: '' }))
  }

  function generateWeek() {
    setWeek(generateSmartWeek(groups, foods, demoRecipes, weeklyBudget))
  }

  function reserveWeek() {
    setFoods((current) => current.map((food) => ({ ...food, reserved: weeklyRequirements.get(food.id) ?? 0 })))
  }

  function clearReservations() {
    setFoods((current) => current.map((food) => ({ ...food, reserved: 0 })))
  }

  function resetDemo() {
    if (!window.confirm('Réinitialiser toutes les données de démonstration OrphéNutri ?')) return
    setFoods(demoFoods)
    setGroups(demoAgeGroups)
    setWeek(demoWeek)
    setMovements(demoMovements)
    setWeeklyBudget(1_800_000)
  }

  const navItems: Array<{ key: Section; label: string; icon: string }> = [
    { key: 'dashboard', label: 'Tableau de bord', icon: '⌂' },
    { key: 'enfants', label: 'Enfants & besoins', icon: '◉' },
    { key: 'menus', label: 'Menus intelligents', icon: '✦' },
    { key: 'stock', label: 'Stock & prix', icon: '▤' },
    { key: 'mouvements', label: 'Achats & mouvements', icon: '⇄' },
    { key: 'fournisseurs', label: 'Fournisseurs', icon: '▣' },
    { key: 'rapports', label: 'Rapports', icon: '▧' },
    { key: 'parametres', label: 'Paramètres', icon: '⚙' }
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">O</div>
          <div><strong>OrphéNutri</strong><span>Restauration collective</span></div>
        </div>
        <nav>
          {navItems.map((item) => (
            <button key={item.key} className={section === item.key ? 'nav-item active' : 'nav-item'} onClick={() => setSection(item.key)}>
              <span className="nav-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span>Enfants aujourd’hui</span><strong>{childrenCount}</strong>
          <small>{weightedPortions.toFixed(1)} portions de référence calculées</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><p className="eyebrow">CENTRE ORPHELINAT DE LA GENDARMERIE</p><h1>{navItems.find((item) => item.key === section)?.label}</h1></div>
          <div className="topbar-actions"><span className="status-dot" /><span>Site opérationnel · sauvegarde locale</span></div>
        </header>

        {section === 'dashboard' && (
          <section>
            <div className="question-grid">
              <article className="question-card primary"><span>QUE PRÉPARER AUJOURD’HUI ?</span><strong>{recipeMap.get(today.lunch)?.name ?? 'Menu non défini'}</strong><small>Déjeuner · {today.day}</small></article>
              <article className="question-card"><span>POUR COMBIEN ?</span><strong>{childrenCount} enfants</strong><small>{groups.length} tranches d’âge configurées</small></article>
              <article className="question-card"><span>COMBIEN ÇA COÛTE ?</span><strong>{formatMoney(todayCost)}</strong><small>{formatMoney(todayCost / Math.max(childrenCount, 1))} / enfant aujourd’hui</small></article>
              <article className={shoppingCost > 0 ? 'question-card warning' : 'question-card good'}><span>AVONS-NOUS ASSEZ ?</span><strong>{shoppingCost > 0 ? `${shoppingNeeds.filter((item) => item.toBuy > 0).length} manque(s)` : 'Stock suffisant'}</strong><small>{shoppingCost > 0 ? `${formatMoney(shoppingCost)} à acheter` : 'Aucun achat urgent pour le menu'}</small></article>
            </div>

            <div className="hero-card">
              <div><span className="pill">Moteur OrphéNutri</span><h2>Planifier les repas avec le stock, le budget et les produits à utiliser en priorité.</h2><p>Le moteur classe les plats selon la couverture du stock, le coût, la variété, les produits proches de la péremption et la place des aliments locaux. Les portions restent configurables et doivent être validées par le professionnel compétent du centre.</p></div>
              <button className="primary-btn" onClick={() => { generateWeek(); setSection('menus') }}>Générer la semaine</button>
            </div>

            <div className="stats-grid">
              <article className="stat-card"><span>Budget semaine</span><strong>{formatMoney(weeklyBudget)}</strong><small>{budgetBalance >= 0 ? `${formatMoney(budgetBalance)} de marge estimée` : `${formatMoney(Math.abs(budgetBalance))} de dépassement`}</small></article>
              <article className="stat-card"><span>Valeur du stock</span><strong>{formatMoney(stockValue)}</strong><small>{foods.length} aliments suivis</small></article>
              <article className="stat-card"><span>Coût alimentaire semaine</span><strong>{formatMoney(plannedFoodValue)}</strong><small>{formatMoney(plannedFoodValue / Math.max(childrenCount, 1) / 7)} / enfant / jour</small></article>
              <article className="stat-card"><span>Achats à prévoir</span><strong>{formatMoney(shoppingCost)}</strong><small>{shoppingNeeds.filter((item) => item.toBuy > 0).length} références insuffisantes</small></article>
            </div>

            <div className="two-columns">
              <article className="panel">
                <div className="panel-title"><div><span className="eyebrow">ALERTES OPÉRATIONNELLES</span><h3>À traiter</h3></div><span className="count-badge">{lowStock.length + expiringSoon.length}</span></div>
                <div className="alert-list">
                  {lowStock.slice(0, 5).map((food) => <div className="alert-row warning" key={food.id}><span className="alert-symbol">!</span><div><strong>{food.name} : stock faible</strong><small>{formatQty(food.stock, food.unit)} disponible · seuil {formatQty(food.minimumStock, food.unit)}</small></div></div>)}
                  {expiringSoon.slice(0, 5).map(({ food, days }) => <div className="alert-row" key={`exp-${food.id}`}><span className="alert-symbol">⌛</span><div><strong>{food.name} à utiliser rapidement</strong><small>{days === 0 ? 'Péremption aujourd’hui' : `Péremption dans ${days} jour(s)`}</small></div></div>)}
                </div>
              </article>
              <article className="panel">
                <div className="panel-title"><div><span className="eyebrow">PROCHAINS DÉJEUNERS</span><h3>Semaine planifiée</h3></div><button className="text-btn" onClick={() => setSection('menus')}>Ouvrir</button></div>
                <div className="week-preview">{week.map((day) => <div className="week-row" key={day.day}><strong>{day.day.slice(0, 3)}</strong><span>{recipeMap.get(day.lunch)?.name ?? '—'}</span><b>{formatMoney(recipeMap.get(day.lunch) ? recipeCost(recipeMap.get(day.lunch)!, groups, foods) : 0)}</b></div>)}</div>
              </article>
            </div>
          </section>
        )}

        {section === 'enfants' && (
          <section>
            <div className="section-lead"><div><span className="pill">Base de calcul</span><h2>{childrenCount} enfants répartis par âge</h2><p>Chaque tranche possède un facteur de portion configurable. Ces coefficients sont des paramètres techniques de démonstration, pas des prescriptions nutritionnelles.</p></div><div className="big-metric"><span>Portions de référence</span><strong>{weightedPortions.toFixed(1)}</strong></div></div>
            <div className="age-grid">{groups.map((group) => <article className="panel age-card" key={group.id}><div className="age-title"><div><span className="eyebrow">TRANCHE D’ÂGE</span><h3>{group.label}</h3></div><strong>{group.count}</strong></div><label>Nombre d’enfants<input type="number" min="0" value={group.count} onChange={(e) => updateGroup(group.id, { count: Math.max(0, Number(e.target.value)) })} /></label><label>Facteur de portion<input type="number" min="0.1" step="0.05" value={group.portionFactor} onChange={(e) => updateGroup(group.id, { portionFactor: Math.max(0.1, Number(e.target.value)) })} /></label><label>Allergies / aliments interdits<input value={group.restrictions.join(', ')} placeholder="ex. arachide, lait..." onChange={(e) => updateGroup(group.id, { restrictions: e.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} /></label></article>)}</div>
            <article className="panel notice-card"><strong>Validation professionnelle nécessaire</strong><p>Avant utilisation réelle, les facteurs de portion, restrictions, allergies, règles alimentaires et procédures d’hygiène doivent être validés par les professionnels compétents du centre. OrphéNutri sert ensuite à appliquer ces règles de manière cohérente.</p></article>
          </section>
        )}

        {section === 'menus' && (
          <section>
            <div className="section-toolbar"><div><p>Le moteur peut construire une semaine automatiquement ou laisser le responsable choisir chaque plat. Il privilégie le stock disponible, le budget, la diversité et les produits proches de leur date limite.</p></div><div className="toolbar-actions"><button className="secondary-btn" onClick={generateWeek}>✦ Générer intelligemment</button><button className="primary-btn" onClick={reserveWeek}>Réserver le stock</button><button className="ghost-btn" onClick={clearReservations}>Libérer réservations</button></div></div>

            <article className="panel smart-panel">
              <div className="panel-title"><div><span className="eyebrow">AIDE À LA DÉCISION</span><h3>Meilleurs plats selon la situation actuelle</h3></div><select value={smartMealType} onChange={(e) => setSmartMealType(e.target.value as MealType)}>{mealFields.map((meal) => <option key={meal.label}>{meal.label}</option>)}</select></div>
              <div className="suggestion-grid">{smartSuggestions.slice(0, 4).map((suggestion, index) => { const recipe = recipeMap.get(suggestion.recipeId)!; return <article className={index === 0 ? 'suggestion-card best' : 'suggestion-card'} key={suggestion.recipeId}><div className="suggestion-rank">#{index + 1}</div><h4>{recipe.name}</h4><div className="score-line"><span>Score</span><strong>{Math.round(suggestion.score)}</strong></div><div className="progress"><span style={{ width: `${Math.min(100, suggestion.stockCoverage * 100)}%` }} /></div><small>{Math.round(suggestion.stockCoverage * 100)} % couvert par le stock · {formatMoney(suggestion.estimatedCost)}</small><ul>{suggestion.reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}</ul></article> })}</div>
            </article>

            <div className="menu-grid">{week.map((day, dayIndex) => <article className="day-card" key={day.day}><div className="day-head"><h3>{day.day}</h3><span>{formatMoney(mealFields.reduce((sum, { key }) => { const recipe = recipeMap.get(day[key]); return sum + (recipe ? recipeCost(recipe, groups, foods) : 0) }, 0))}</span></div>{mealFields.map(({ key, label }) => <label className="meal-select" key={key}><span>{label}</span><select value={day[key]} onChange={(e) => updateMenu(dayIndex, key, e.target.value)}>{demoRecipes.filter((recipe) => recipe.mealType === label).map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}</select></label>)}</article>)}</div>
          </section>
        )}

        {section === 'stock' && (
          <section>
            <div className="section-toolbar"><p>Les quantités, prix, réservations et dates de péremption alimentent directement le moteur de menus et la liste de courses.</p><div className="mini-stats"><span>Valeur stock <b>{formatMoney(stockValue)}</b></span><span>Alertes <b>{lowStock.length}</b></span></div></div>
            <article className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Aliment</th><th>Catégorie</th><th>Stock</th><th>Réservé</th><th>Disponible</th><th>Prix</th><th>Fournisseur</th><th>État</th></tr></thead><tbody>{foods.map((food) => <tr key={food.id}><td><strong>{food.name}</strong>{food.local && <small className="local-tag">local</small>}</td><td>{food.category}</td><td><div className="number-with-unit"><input type="number" min="0" step="0.01" value={food.stock} onChange={(e) => updateStock(food.id, Number(e.target.value))} /><span>{food.unit}</span></div></td><td>{formatQty(food.reserved ?? 0, food.unit)}</td><td>{formatQty(Math.max(0, food.stock - (food.reserved ?? 0)), food.unit)}</td><td><div className="number-with-unit money-input"><input type="number" min="0" step="100" value={food.price} onChange={(e) => updatePrice(food.id, Number(e.target.value))} /><span>Ar</span></div></td><td>{supplierMap.get(food.supplierId ?? '')?.name ?? '—'}</td><td><span className={food.stock <= food.minimumStock ? 'state danger' : 'state ok'}>{food.stock <= food.minimumStock ? 'Stock faible' : 'Disponible'}</span></td></tr>)}</tbody></table></div></article>
            <article className="panel add-form"><div><span className="eyebrow">NOUVEL ALIMENT</span><h3>Ajouter au catalogue</h3></div><div className="form-grid"><label>Nom<input value={newFood.name} onChange={(e) => setNewFood({ ...newFood, name: e.target.value })} /></label><label>Catégorie<input value={newFood.category} onChange={(e) => setNewFood({ ...newFood, category: e.target.value })} /></label><label>Unité<select value={newFood.unit} onChange={(e) => setNewFood({ ...newFood, unit: e.target.value as Food['unit'] })}><option>kg</option><option>L</option><option>unité</option></select></label><label>Stock<input type="number" value={newFood.stock} onChange={(e) => setNewFood({ ...newFood, stock: Number(e.target.value) })} /></label><label>Seuil minimum<input type="number" value={newFood.minimumStock} onChange={(e) => setNewFood({ ...newFood, minimumStock: Number(e.target.value) })} /></label><label>Prix unitaire<input type="number" value={newFood.price} onChange={(e) => setNewFood({ ...newFood, price: Number(e.target.value) })} /></label></div><button className="primary-btn" onClick={addFood}>Ajouter l’aliment</button></article>
          </section>
        )}

        {section === 'mouvements' && (
          <section>
            <div className="shopping-summary"><div><span className="eyebrow">LISTE DE COURSES AUTOMATIQUE</span><h2>{formatMoney(shoppingCost)}</h2><p>{shoppingNeeds.filter((item) => item.toBuy > 0).length} produit(s) à acheter pour couvrir la semaine planifiée.</p></div><button className="secondary-btn" onClick={() => window.print()}>Imprimer</button></div>
            <div className="two-columns purchase-layout">
              <article className="panel"><div className="panel-title"><div><span className="eyebrow">BESOINS</span><h3>Courses de la semaine</h3></div></div><div className="compact-list">{shoppingNeeds.filter((item) => item.toBuy > 0).map((item) => <div className="need-row" key={item.food.id}><div><strong>{item.food.name}</strong><small>Besoin {formatQty(item.required, item.food.unit)} · disponible {formatQty(item.available, item.food.unit)}</small></div><div><b>{formatQty(item.toBuy, item.food.unit)}</b><span>{formatMoney(item.estimatedCost)}</span></div></div>)}</div></article>
              <article className="panel"><div className="panel-title"><div><span className="eyebrow">ENTRÉES / SORTIES</span><h3>Enregistrer un mouvement</h3></div></div><div className="movement-form"><label>Aliment<select value={movementDraft.foodId} onChange={(e) => setMovementDraft({ ...movementDraft, foodId: e.target.value })}>{foods.map((food) => <option value={food.id} key={food.id}>{food.name}</option>)}</select></label><label>Type<select value={movementDraft.type} onChange={(e) => setMovementDraft({ ...movementDraft, type: e.target.value as StockMovement['type'] })}><option value="entrée">Entrée achat</option><option value="don">Don</option><option value="sortie">Sortie / consommation</option><option value="ajustement">Ajustement positif</option></select></label><label>Quantité<input type="number" min="0" step="0.01" value={movementDraft.quantity} onChange={(e) => setMovementDraft({ ...movementDraft, quantity: Number(e.target.value) })} /></label><label>Motif<input value={movementDraft.reason} onChange={(e) => setMovementDraft({ ...movementDraft, reason: e.target.value })} /></label><button className="primary-btn" onClick={applyMovement}>Enregistrer le mouvement</button></div></article>
            </div>
            <article className="panel table-panel movement-table"><div className="table-wrap"><table><thead><tr><th>Date</th><th>Aliment</th><th>Type</th><th>Quantité</th><th>Motif</th><th>Utilisateur</th></tr></thead><tbody>{movements.map((movement) => { const food = foodMap.get(movement.foodId); return <tr key={movement.id}><td>{movement.date}</td><td><strong>{food?.name ?? movement.foodId}</strong></td><td><span className={`movement ${movement.type}`}>{movement.type}</span></td><td>{food ? formatQty(movement.quantity, food.unit) : movement.quantity}</td><td>{movement.reason}</td><td>{movement.user}</td></tr> })}</tbody></table></div></article>
          </section>
        )}

        {section === 'fournisseurs' && (
          <section>
            <div className="supplier-grid">{suppliers.map((supplier) => { const suppliedFoods = foods.filter((food) => food.supplierId === supplier.id); return <article className="panel supplier-card" key={supplier.id}><div className="supplier-icon">▣</div><h3>{supplier.name}</h3><p>{supplier.location}</p><small>{supplier.contact}</small><div className="supplier-foods">{suppliedFoods.map((food) => <div key={food.id}><span>{food.name}</span><b>{formatMoney(food.price)} / {food.unit}</b></div>)}</div></article> })}</div>
            <article className="panel"><div className="panel-title"><div><span className="eyebrow">ÉVOLUTION DES PRIX</span><h3>Produits avec historique</h3></div></div><div className="price-history">{foods.filter((food) => (food.priceHistory?.length ?? 0) > 1).map((food) => { const history = food.priceHistory!; const first = history[0].price; const last = history[history.length - 1].price; const change = first ? ((last - first) / first) * 100 : 0; return <div key={food.id}><strong>{food.name}</strong><span>{formatMoney(first)} → {formatMoney(last)}</span><b className={change > 0 ? 'price-up' : 'price-down'}>{change >= 0 ? '+' : ''}{change.toFixed(1)} %</b></div> })}</div></article>
          </section>
        )}

        {section === 'rapports' && (
          <section>
            <div className="report-grid">
              <article className="report-card"><span className="report-icon">▧</span><div><h3>Menu hebdomadaire</h3><p>Planning complet des quatre repas quotidiens.</p></div><button onClick={() => window.print()}>Imprimer</button></article>
              <article className="report-card"><span className="report-icon">▤</span><div><h3>État du stock</h3><p>Quantités, prix, réservations et valeur disponible.</p></div><button onClick={() => downloadCsv('orphe-nutri-stock.csv', [['Aliment','Catégorie','Stock','Unité','Réservé','Prix Ar'], ...foods.map((food) => [food.name, food.category, food.stock, food.unit, food.reserved ?? 0, food.price])])}>Exporter CSV</button></article>
              <article className="report-card"><span className="report-icon">✓</span><div><h3>Liste de courses</h3><p>Besoins manquants et estimation du coût d’achat.</p></div><button onClick={() => downloadCsv('orphe-nutri-courses.csv', [['Aliment','Besoin','Disponible','À acheter','Unité','Coût Ar'], ...shoppingNeeds.map((item) => [item.food.name, item.required.toFixed(2), item.available.toFixed(2), item.toBuy.toFixed(2), item.food.unit, Math.round(item.estimatedCost)])])}>Exporter CSV</button></article>
              <article className="report-card"><span className="report-icon">⇄</span><div><h3>Mouvements de stock</h3><p>Traçabilité des achats, dons et consommations.</p></div><button onClick={() => downloadCsv('orphe-nutri-mouvements.csv', [['Date','Aliment','Type','Quantité','Motif','Utilisateur'], ...movements.map((movement) => [movement.date, foodMap.get(movement.foodId)?.name ?? movement.foodId, movement.type, movement.quantity, movement.reason, movement.user])])}>Exporter CSV</button></article>
            </div>
            <article className="panel report-summary"><div><span>Enfants</span><strong>{childrenCount}</strong></div><div><span>Budget semaine</span><strong>{formatMoney(weeklyBudget)}</strong></div><div><span>Coût prévu</span><strong>{formatMoney(plannedFoodValue)}</strong></div><div><span>Valeur stock</span><strong>{formatMoney(stockValue)}</strong></div><div><span>Achats nécessaires</span><strong>{formatMoney(shoppingCost)}</strong></div></article>
          </section>
        )}

        {section === 'parametres' && (
          <section>
            <div className="settings-grid">
              <article className="panel settings-card"><span className="eyebrow">BUDGET</span><h3>Budget alimentaire hebdomadaire</h3><p>Le moteur utilise cette valeur pour pénaliser les plats trop coûteux.</p><label>Budget en ariary<input type="number" min="0" step="10000" value={weeklyBudget} onChange={(e) => setWeeklyBudget(Math.max(0, Number(e.target.value)))} /></label><div className="budget-box"><span>Coût semaine actuelle</span><strong>{formatMoney(plannedFoodValue)}</strong></div></article>
              <article className="panel settings-card"><span className="eyebrow">DONNÉES</span><h3>Mode actuel</h3><p>Cette version sauvegarde les données dans ce navigateur. La structure Supabase du dépôt est prévue pour passer ensuite au mode multi-utilisateur partagé.</p><button className="danger-btn" onClick={resetDemo}>Réinitialiser la démonstration</button></article>
              <article className="panel settings-card notice-card"><span className="eyebrow">NUTRITION</span><h3>Règles configurables</h3><p>OrphéNutri ne doit pas décider seul des besoins médicaux ou nutritionnels des enfants. Les portions, allergies, interdictions et règles du centre doivent être configurées puis validées par les professionnels compétents.</p></article>
              <article className="panel settings-card"><span className="eyebrow">PROCHAINE ÉTAPE</span><h3>Mode institutionnel</h3><p>Authentification, rôles Direction / Stock / Cuisine / Nutrition, base Supabase, journal d’audit centralisé, bons d’achat et rapports PDF/Excel.</p><span className="state ok">Architecture déjà préparée</span></article>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
