import { useEffect, useMemo, useRef, useState } from 'react'
import { demoAgeGroups, demoFoods, demoRecipes, demoSuppliers, demoWeek } from './data'
import { daysUntil, generateSmartWeek, recipeCost, recipeRequirements, totalChildren } from './engine'
import type { AgeGroup, DayMenu, Food, MealType, ShoppingNeed, StockMovement, Supplier } from './types'

type Section = 'dashboard' | 'enfants' | 'menus' | 'stock' | 'mouvements' | 'fournisseurs' | 'rapports' | 'parametres'

type LocalBackup = {
  version: 1
  app: 'OrphéNutri Local'
  exportedAt: string
  ageGroups: AgeGroup[]
  foods: Food[]
  week: DayMenu[]
  movements: StockMovement[]
  suppliers: Supplier[]
  weeklyBudget: number
}

const STORAGE = {
  ageGroups: 'orphenutri.ageGroups.v1',
  foods: 'orphenutri.foods.v1',
  week: 'orphenutri.week.v1',
  movements: 'orphenutri.movements.v1',
  suppliers: 'orphenutri.suppliers.v1',
  budget: 'orphenutri.weeklyBudget.v1'
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

function formatQty(value: number) {
  return value >= 10 ? value.toFixed(1) : value.toFixed(2)
}

function downloadText(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function todayLabel() {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date())
}

export default function App() {
  const [section, setSection] = useState<Section>('dashboard')
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>(() => readStorage(STORAGE.ageGroups, demoAgeGroups))
  const [foods, setFoods] = useState<Food[]>(() => readStorage(STORAGE.foods, demoFoods))
  const [week, setWeek] = useState<DayMenu[]>(() => readStorage(STORAGE.week, demoWeek))
  const [movements, setMovements] = useState<StockMovement[]>(() => readStorage(STORAGE.movements, []))
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => readStorage(STORAGE.suppliers, demoSuppliers))
  const [weeklyBudget, setWeeklyBudget] = useState<number>(() => readStorage(STORAGE.budget, 1_800_000))
  const [notice, setNotice] = useState('Mode local : aucune donnée n’est envoyée sur Internet.')
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => localStorage.setItem(STORAGE.ageGroups, JSON.stringify(ageGroups)), [ageGroups])
  useEffect(() => localStorage.setItem(STORAGE.foods, JSON.stringify(foods)), [foods])
  useEffect(() => localStorage.setItem(STORAGE.week, JSON.stringify(week)), [week])
  useEffect(() => localStorage.setItem(STORAGE.movements, JSON.stringify(movements)), [movements])
  useEffect(() => localStorage.setItem(STORAGE.suppliers, JSON.stringify(suppliers)), [suppliers])
  useEffect(() => localStorage.setItem(STORAGE.budget, JSON.stringify(weeklyBudget)), [weeklyBudget])

  const childrenCount = useMemo(() => totalChildren(ageGroups), [ageGroups])
  const foodMap = useMemo(() => new Map(foods.map((food) => [food.id, food])), [foods])
  const recipeMap = useMemo(() => new Map(demoRecipes.map((recipe) => [recipe.id, recipe])), [])

  const weeklyNeeds = useMemo(() => {
    const totals = new Map<string, number>()
    for (const day of week) {
      for (const { key } of mealFields) {
        const recipe = recipeMap.get(day[key])
        if (!recipe) continue
        for (const need of recipeRequirements(recipe, ageGroups)) {
          totals.set(need.foodId, (totals.get(need.foodId) ?? 0) + need.quantity)
        }
      }
    }
    return totals
  }, [week, ageGroups, recipeMap])

  const shoppingList = useMemo<ShoppingNeed[]>(() => {
    const items: ShoppingNeed[] = []
    for (const [foodId, required] of weeklyNeeds.entries()) {
      const food = foodMap.get(foodId)
      if (!food) continue
      const reserved = food.reserved ?? 0
      const available = Math.max(0, food.stock - reserved)
      const toBuy = Math.max(0, required - available)
      if (toBuy > 0) items.push({ food, required, available, reserved, toBuy, estimatedCost: toBuy * food.price })
    }
    return items.sort((a, b) => b.estimatedCost - a.estimatedCost)
  }, [weeklyNeeds, foodMap])

  const weeklyCost = useMemo(() => week.reduce((total, day) => {
    return total + mealFields.reduce((dayTotal, { key }) => {
      const recipe = recipeMap.get(day[key])
      return dayTotal + (recipe ? recipeCost(recipe, ageGroups, foods) : 0)
    }, 0)
  }, 0), [week, ageGroups, foods, recipeMap])

  const stockValue = useMemo(() => foods.reduce((sum, food) => sum + food.stock * food.price, 0), [foods])
  const lowStock = useMemo(() => foods.filter((food) => food.stock <= food.minimumStock), [foods])
  const expiringSoon = useMemo(() => foods.filter((food) => {
    const days = daysUntil(food.expiryDate)
    return days !== null && days >= 0 && days <= 7
  }), [foods])
  const shoppingCost = useMemo(() => shoppingList.reduce((sum, item) => sum + item.estimatedCost, 0), [shoppingList])

  const nav: Array<{ id: Section; label: string; icon: string }> = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '◫' },
    { id: 'enfants', label: 'Enfants', icon: '👥' },
    { id: 'menus', label: 'Menus intelligents', icon: '🍽️' },
    { id: 'stock', label: 'Stock & prix', icon: '📦' },
    { id: 'mouvements', label: 'Entrées / sorties', icon: '↔' },
    { id: 'fournisseurs', label: 'Fournisseurs', icon: '🏪' },
    { id: 'rapports', label: 'Rapports', icon: '📄' },
    { id: 'parametres', label: 'Paramètres', icon: '⚙' }
  ]

  function generateWeek() {
    setWeek(generateSmartWeek(ageGroups, foods, demoRecipes, weeklyBudget))
    setNotice('Semaine recalculée localement selon le stock, le budget, les péremptions, les interdictions et la variété.')
  }

  function reserveWeek() {
    setFoods((current) => current.map((food) => ({ ...food, reserved: weeklyNeeds.get(food.id) ?? 0 })))
    setNotice('Quantités de la semaine réservées dans le stock local.')
  }

  function addMovement(foodId: string, type: StockMovement['type'], quantity: number, unitPrice?: number, note?: string) {
    if (!foodId || !Number.isFinite(quantity) || quantity <= 0) return
    const movement: StockMovement = {
      id: crypto.randomUUID(), foodId, type, quantity, unitPrice, note, date: new Date().toISOString()
    }
    setMovements((current) => [movement, ...current])
    setFoods((current) => current.map((food) => {
      if (food.id !== foodId) return food
      let delta = 0
      if (type === 'entrée' || type === 'don') delta = quantity
      if (type === 'sortie' || type === 'perte') delta = -quantity
      return {
        ...food,
        stock: Math.max(0, food.stock + delta),
        price: unitPrice && unitPrice > 0 ? unitPrice : food.price
      }
    }))
    setNotice('Mouvement enregistré uniquement sur cet ordinateur.')
  }

  function exportBackup() {
    const backup: LocalBackup = {
      version: 1,
      app: 'OrphéNutri Local',
      exportedAt: new Date().toISOString(),
      ageGroups, foods, week, movements, suppliers, weeklyBudget
    }
    downloadText(`orphe-nutri-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2))
    setNotice('Sauvegarde créée. Garde une copie sur ce PC, un second disque ou une clé USB.')
  }

  function importBackup(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const backup = JSON.parse(String(reader.result)) as Partial<LocalBackup>
        if (backup.app !== 'OrphéNutri Local' || backup.version !== 1) throw new Error('incompatible')
        if (backup.ageGroups) setAgeGroups(backup.ageGroups)
        if (backup.foods) setFoods(backup.foods)
        if (backup.week) setWeek(backup.week)
        if (backup.movements) setMovements(backup.movements)
        if (backup.suppliers) setSuppliers(backup.suppliers)
        if (typeof backup.weeklyBudget === 'number') setWeeklyBudget(backup.weeklyBudget)
        setNotice('Sauvegarde restaurée avec succès.')
      } catch {
        setNotice('Ce fichier de sauvegarde est invalide ou incompatible.')
      }
    }
    reader.readAsText(file)
  }

  function resetData() {
    setAgeGroups(demoAgeGroups)
    setFoods(demoFoods)
    setWeek(demoWeek)
    setMovements([])
    setSuppliers(demoSuppliers)
    setWeeklyBudget(1_800_000)
    setNotice('Données locales réinitialisées.')
  }

  function exportShoppingCsv() {
    const rows = [['Aliment', 'Quantité à acheter', 'Unité', 'Prix unitaire Ar', 'Coût estimé Ar']]
    shoppingList.forEach((item) => rows.push([
      item.food.name, item.toBuy.toFixed(2), item.food.unit, String(item.food.price), String(Math.round(item.estimatedCost))
    ]))
    downloadText('orphe-nutri-liste-courses.csv', rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n'), 'text/csv;charset=utf-8')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">O</div><div><strong>OrphéNutri</strong><span>Édition locale</span></div></div>
        <nav>{nav.map((item) => <button key={item.id} className={`nav-item ${section === item.id ? 'active' : ''}`} onClick={() => setSection(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}</nav>
        <div className="sidebar-foot"><span>Stockage</span><strong>100 % local</strong><small>Aucun compte, aucun cloud. Les données restent sur ce PC.</small></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div><p className="eyebrow">CENTRE ORPHELINAT DE LA GENDARMERIE</p><h1>{nav.find((item) => item.id === section)?.label}</h1></div><div className="topbar-actions"><span className="status-dot" />Local uniquement · {todayLabel()}</div></header>

        <section className="panel" style={{ marginBottom: 16 }}><strong>🔒 Données locales uniquement</strong><p>OrphéNutri n’envoie aucune donnée du centre sur Internet. Une sauvegarde régulière protège contre la suppression des données du navigateur ou une panne du PC.</p><button className="secondary-btn" onClick={exportBackup}>💾 Sauvegarder maintenant</button></section>
        <div className="panel" style={{ marginBottom: 16, padding: 12 }}>{notice}</div>

        {section === 'dashboard' && <Dashboard childrenCount={childrenCount} weeklyCost={weeklyCost} weeklyBudget={weeklyBudget} stockValue={stockValue} shoppingCost={shoppingCost} lowStock={lowStock} expiringSoon={expiringSoon} week={week} recipeMap={recipeMap} onGenerate={() => { generateWeek(); setSection('menus') }} />}
        {section === 'enfants' && <ChildrenPage groups={ageGroups} setGroups={setAgeGroups} />}
        {section === 'menus' && <MenusPage week={week} setWeek={setWeek} foods={foods} groups={ageGroups} weeklyBudget={weeklyBudget} onGenerate={generateWeek} onReserve={reserveWeek} />}
        {section === 'stock' && <StockPage foods={foods} setFoods={setFoods} weeklyNeeds={weeklyNeeds} />}
        {section === 'mouvements' && <MovementsPage foods={foods} movements={movements} onAdd={addMovement} />}
        {section === 'fournisseurs' && <SuppliersPage suppliers={suppliers} setSuppliers={setSuppliers} />}
        {section === 'rapports' && <ReportsPage weeklyCost={weeklyCost} stockValue={stockValue} shoppingList={shoppingList} movements={movements} onCsv={exportShoppingCsv} onBackup={exportBackup} />}
        {section === 'parametres' && <SettingsPage weeklyBudget={weeklyBudget} setWeeklyBudget={setWeeklyBudget} onBackup={exportBackup} onImport={() => importRef.current?.click()} onReset={resetData} />}

        <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) importBackup(file); event.currentTarget.value = '' }} />
      </main>
    </div>
  )
}

function Stat({ label, value, detail, good, danger }: { label: string; value: string | number; detail: string; good?: boolean; danger?: boolean }) {
  return <div className={`stat-card ${good ? 'good' : ''} ${danger ? 'danger' : ''}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
}

function Dashboard({ childrenCount, weeklyCost, weeklyBudget, stockValue, shoppingCost, lowStock, expiringSoon, week, recipeMap, onGenerate }: {
  childrenCount: number; weeklyCost: number; weeklyBudget: number; stockValue: number; shoppingCost: number; lowStock: Food[]; expiringSoon: Food[]; week: DayMenu[]; recipeMap: Map<string, (typeof demoRecipes)[number]>; onGenerate: () => void
}) {
  const today = week[0]
  return <>
    <section className="hero-card"><div><span className="pill">DÉCISION DU JOUR</span><h2>Que préparer, en quelle quantité, à quel coût, et avons-nous le stock ?</h2><p>Les calculs sont effectués directement sur cet ordinateur.</p></div><button className="primary-btn" onClick={onGenerate}>✨ Générer une semaine</button></section>
    <div className="stats-grid"><Stat label="Enfants" value={childrenCount} detail="Toutes tranches d’âge" /><Stat label="Coût prévu semaine" value={formatMoney(weeklyCost)} detail={`Budget : ${formatMoney(weeklyBudget)}`} good={weeklyCost <= weeklyBudget} danger={weeklyCost > weeklyBudget} /><Stat label="Achats à prévoir" value={formatMoney(shoppingCost)} detail="Selon le stock actuel" /><Stat label="Valeur du stock" value={formatMoney(stockValue)} detail={`${lowStock.length} alerte(s) de stock`} /></div>
    <div className="two-columns">
      <section className="panel"><h3>{today?.day ?? 'Menu du jour'}</h3><div className="today-meals">{today && mealFields.map(({ key, label }) => <div key={key}><span>{label}</span><strong>{recipeMap.get(today[key])?.name ?? 'Non défini'}</strong></div>)}</div></section>
      <section className="panel"><h3>Alertes</h3><div className="alert-list">{lowStock.slice(0, 4).map((food) => <div className="alert-row warning" key={`low-${food.id}`}><div><strong>{food.name} : stock faible</strong><small>{food.stock} {food.unit} disponibles</small></div></div>)}{expiringSoon.slice(0, 4).map((food) => <div className="alert-row" key={`exp-${food.id}`}><div><strong>{food.name} : péremption proche</strong><small>{daysUntil(food.expiryDate)} jour(s)</small></div></div>)}</div></section>
    </div>
  </>
}

function ChildrenPage({ groups, setGroups }: { groups: AgeGroup[]; setGroups: React.Dispatch<React.SetStateAction<AgeGroup[]>> }) {
  function patch(id: string, update: Partial<AgeGroup>) { setGroups((current) => current.map((group) => group.id === id ? { ...group, ...update } : group)) }
  return <><div className="section-intro"><div><h2>Effectifs et portions</h2><p>Total : <strong>{totalChildren(groups)} enfants</strong>. Les facteurs de portion doivent être validés avant l’utilisation réelle.</p></div></div><div className="settings-grid">{groups.map((group) => <section className="panel settings-card" key={group.id}><h3>{group.label}</h3><label>Nombre d’enfants<input type="number" min="0" value={group.count} onChange={(e) => patch(group.id, { count: Math.max(0, Number(e.target.value)) })} /></label><label>Facteur de portion<input type="number" min="0.1" step="0.05" value={group.portionFactor} onChange={(e) => patch(group.id, { portionFactor: Math.max(0.1, Number(e.target.value)) })} /></label><label>Allergies / aliments interdits<input value={group.restrictions.join(', ')} onChange={(e) => patch(group.id, { restrictions: e.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} placeholder="ex. lait, arachide" /></label></section>)}</div></>
}

function MenusPage({ week, setWeek, foods, groups, weeklyBudget, onGenerate, onReserve }: { week: DayMenu[]; setWeek: React.Dispatch<React.SetStateAction<DayMenu[]>>; foods: Food[]; groups: AgeGroup[]; weeklyBudget: number; onGenerate: () => void; onReserve: () => void }) {
  return <><div className="section-toolbar"><div><h2>Plan de repas sur 7 jours</h2><p>Le moteur local tient compte du stock, du budget, des péremptions, des restrictions et de la variété.</p></div><div><button className="secondary-btn" onClick={onGenerate}>✨ Régénérer</button> <button className="primary-btn" onClick={onReserve}>Réserver le stock</button></div></div><div className="menu-grid">{week.map((day, index) => <article className="day-card" key={day.day}><div className="day-head"><h3>{day.day}</h3><span>{formatMoney(mealFields.reduce((sum, { key }) => { const recipe = demoRecipes.find((item) => item.id === day[key]); return sum + (recipe ? recipeCost(recipe, groups, foods) : 0) }, 0))}</span></div>{mealFields.map(({ key, label }) => <label className="meal-select" key={key}><span>{label}</span><select value={day[key]} onChange={(e) => setWeek((current) => current.map((item, i) => i === index ? { ...item, [key]: e.target.value } : item))}>{demoRecipes.filter((recipe) => recipe.mealType === label).map((recipe) => <option value={recipe.id} key={recipe.id}>{recipe.name}</option>)}</select></label>)}</article>)}</div><section className="panel notice-card"><strong>Validation requise</strong><p>Le moteur aide à la logistique et au budget. Les portions et règles nutritionnelles restent à valider par les professionnels compétents.</p><small>Budget hebdomadaire : {formatMoney(weeklyBudget)}</small></section></>
}

function StockPage({ foods, setFoods, weeklyNeeds }: { foods: Food[]; setFoods: React.Dispatch<React.SetStateAction<Food[]>>; weeklyNeeds: Map<string, number> }) {
  function patch(id: string, update: Partial<Food>) { setFoods((current) => current.map((food) => food.id === id ? { ...food, ...update } : food)) }
  return <section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Aliment</th><th>Catégorie</th><th>Stock</th><th>Réservé</th><th>Besoin semaine</th><th>Seuil</th><th>Prix</th><th>Péremption</th></tr></thead><tbody>{foods.map((food) => <tr key={food.id}><td><strong>{food.name}</strong></td><td>{food.category}</td><td><input type="number" step="0.1" value={food.stock} onChange={(e) => patch(food.id, { stock: Math.max(0, Number(e.target.value)) })} /> {food.unit}</td><td>{formatQty(food.reserved ?? 0)} {food.unit}</td><td>{formatQty(weeklyNeeds.get(food.id) ?? 0)} {food.unit}</td><td><input type="number" step="0.1" value={food.minimumStock} onChange={(e) => patch(food.id, { minimumStock: Math.max(0, Number(e.target.value)) })} /></td><td><input type="number" value={food.price} onChange={(e) => patch(food.id, { price: Math.max(0, Number(e.target.value)) })} /> Ar/{food.unit}</td><td><input type="date" value={food.expiryDate ?? ''} onChange={(e) => patch(food.id, { expiryDate: e.target.value || undefined })} /></td></tr>)}</tbody></table></div></section>
}

function MovementsPage({ foods, movements, onAdd }: { foods: Food[]; movements: StockMovement[]; onAdd: (foodId: string, type: StockMovement['type'], quantity: number, unitPrice?: number, note?: string) => void }) {
  const [foodId, setFoodId] = useState(foods[0]?.id ?? '')
  const [type, setType] = useState<StockMovement['type']>('entrée')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [note, setNote] = useState('')
  return <><section className="panel"><div className="form-grid"><label>Aliment<select value={foodId} onChange={(e) => setFoodId(e.target.value)}>{foods.map((food) => <option value={food.id} key={food.id}>{food.name}</option>)}</select></label><label>Type<select value={type} onChange={(e) => setType(e.target.value as StockMovement['type'])}><option value="entrée">Entrée achat</option><option value="don">Don</option><option value="sortie">Sortie cuisine</option><option value="perte">Perte</option><option value="ajustement">Ajustement</option></select></label><label>Quantité<input type="number" min="0.01" step="0.1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></label><label>Prix unitaire<input type="number" min="0" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} /></label><label>Note<input value={note} onChange={(e) => setNote(e.target.value)} /></label></div><button className="primary-btn" onClick={() => { onAdd(foodId, type, quantity, unitPrice || undefined, note || undefined); setNote('') }}>Enregistrer</button></section><section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Date</th><th>Aliment</th><th>Type</th><th>Quantité</th><th>Prix</th><th>Note</th></tr></thead><tbody>{movements.map((movement) => { const food = foods.find((item) => item.id === movement.foodId); return <tr key={movement.id}><td>{new Date(movement.date).toLocaleString('fr-FR')}</td><td>{food?.name ?? '—'}</td><td>{movement.type}</td><td>{movement.quantity} {food?.unit ?? ''}</td><td>{movement.unitPrice ? formatMoney(movement.unitPrice) : '—'}</td><td>{movement.note ?? movement.reason ?? '—'}</td></tr> })}</tbody></table></div></section></>
}

function SuppliersPage({ suppliers, setSuppliers }: { suppliers: Supplier[]; setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>> }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  return <><div className="recipe-grid">{suppliers.map((supplier) => <article className="panel" key={supplier.id}><h3>{supplier.name}</h3><p>{supplier.location ?? supplier.type ?? 'Fournisseur local'}</p><strong>{supplier.phone ?? supplier.contact ?? 'Contact non renseigné'}</strong><small>{supplier.notes ?? ''}</small></article>)}</div><section className="panel add-form"><h3>Ajouter un fournisseur</h3><div className="form-grid"><label>Nom<input value={name} onChange={(e) => setName(e.target.value)} /></label><label>Contact<input value={contact} onChange={(e) => setContact(e.target.value)} /></label></div><button className="primary-btn" onClick={() => { if (!name.trim()) return; setSuppliers((current) => [...current, { id: crypto.randomUUID(), name: name.trim(), contact: contact.trim() }]); setName(''); setContact('') }}>Ajouter</button></section></>
}

function ReportsPage({ weeklyCost, stockValue, shoppingList, movements, onCsv, onBackup }: { weeklyCost: number; stockValue: number; shoppingList: ShoppingNeed[]; movements: StockMovement[]; onCsv: () => void; onBackup: () => void }) {
  return <><div className="stats-grid"><Stat label="Coût semaine" value={formatMoney(weeklyCost)} detail="Menu actuel" /><Stat label="Valeur du stock" value={formatMoney(stockValue)} detail="Au prix actuel" /><Stat label="Produits à acheter" value={shoppingList.length} detail="Références manquantes" /><Stat label="Mouvements" value={movements.length} detail="Historique local" /></div><div className="settings-grid"><button className="panel secondary-btn" onClick={() => window.print()}>🖨️ Imprimer le rapport</button><button className="panel secondary-btn" onClick={onCsv}>📊 Exporter les courses CSV</button><button className="panel secondary-btn" onClick={onBackup}>💾 Sauvegarde complète locale</button></div><section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Aliment</th><th>Besoin</th><th>Disponible</th><th>À acheter</th><th>Coût estimé</th></tr></thead><tbody>{shoppingList.map((item) => <tr key={item.food.id}><td>{item.food.name}</td><td>{formatQty(item.required)} {item.food.unit}</td><td>{formatQty(item.available)} {item.food.unit}</td><td><strong>{formatQty(item.toBuy)} {item.food.unit}</strong></td><td>{formatMoney(item.estimatedCost)}</td></tr>)}</tbody></table></div></section></>
}

function SettingsPage({ weeklyBudget, setWeeklyBudget, onBackup, onImport, onReset }: { weeklyBudget: number; setWeeklyBudget: React.Dispatch<React.SetStateAction<number>>; onBackup: () => void; onImport: () => void; onReset: () => void }) {
  return <div className="settings-grid"><section className="panel settings-card"><h3>Budget hebdomadaire</h3><label>Montant en ariary<input type="number" min="0" step="10000" value={weeklyBudget} onChange={(e) => setWeeklyBudget(Math.max(0, Number(e.target.value)))} /></label><div className="budget-box"><span>Budget actuel</span><strong>{formatMoney(weeklyBudget)}</strong></div></section><section className="panel settings-card"><h3>Sauvegarde locale</h3><p>Le stockage du navigateur peut être perdu si Windows ou le profil du navigateur est réinitialisé.</p><button className="primary-btn" onClick={onBackup}>💾 Exporter une sauvegarde</button><button className="secondary-btn" onClick={onImport}>📂 Restaurer une sauvegarde</button></section><section className="panel settings-card notice-card"><h3>Aucun cloud</h3><p>Cette édition n’utilise ni Supabase, ni compte distant, ni synchronisation Internet.</p></section><section className="panel settings-card"><h3>Réinitialisation</h3><button className="danger-btn" onClick={onReset}>Réinitialiser les données locales</button></section></div>
}
