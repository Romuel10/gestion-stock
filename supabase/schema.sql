-- NutriStock - schéma Supabase préparatoire
-- À exécuter dans un projet Supabase dédié après validation des besoins réels.

create extension if not exists pgcrypto;

create table if not exists public.centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.center_members (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'direction', 'gestionnaire', 'cuisine')),
  created_at timestamptz not null default now(),
  unique (center_id, user_id)
);

create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers(id) on delete cascade,
  name text not null,
  category text not null,
  unit text not null check (unit in ('kg', 'L', 'unité')),
  current_stock numeric(12,3) not null default 0 check (current_stock >= 0),
  minimum_stock numeric(12,3) not null default 0 check (minimum_stock >= 0),
  current_price numeric(14,2) not null default 0 check (current_price >= 0),
  expiry_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers(id) on delete cascade,
  name text not null,
  meal_type text not null check (meal_type in ('Petit-déjeuner', 'Déjeuner', 'Goûter', 'Dîner')),
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  food_id uuid not null references public.foods(id) on delete restrict,
  quantity_per_child numeric(12,4) not null check (quantity_per_child > 0),
  unique (recipe_id, food_id)
);

create table if not exists public.weekly_menus (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers(id) on delete cascade,
  week_start date not null,
  children_count integer not null check (children_count > 0),
  status text not null default 'brouillon' check (status in ('brouillon', 'validé', 'terminé')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (center_id, week_start)
);

create table if not exists public.menu_entries (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers(id) on delete cascade,
  weekly_menu_id uuid not null references public.weekly_menus(id) on delete cascade,
  menu_date date not null,
  meal_type text not null check (meal_type in ('Petit-déjeuner', 'Déjeuner', 'Goûter', 'Dîner')),
  recipe_id uuid not null references public.recipes(id) on delete restrict,
  unique (weekly_menu_id, menu_date, meal_type)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers(id) on delete cascade,
  food_id uuid not null references public.foods(id) on delete restrict,
  movement_type text not null check (movement_type in ('entrée', 'sortie', 'ajustement', 'perte')),
  quantity numeric(12,3) not null check (quantity > 0),
  unit_price numeric(14,2) check (unit_price >= 0),
  reason text,
  movement_date timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers(id) on delete cascade,
  name text not null,
  phone text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  purchase_date date not null default current_date,
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  reference text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  food_id uuid not null references public.foods(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  expiry_date date
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers(id) on delete cascade,
  month_start date not null,
  amount numeric(14,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (center_id, month_start)
);

create index if not exists center_members_user_id_idx on public.center_members(user_id);
create index if not exists foods_center_id_idx on public.foods(center_id);
create index if not exists recipes_center_id_idx on public.recipes(center_id);
create index if not exists recipe_ingredients_center_id_idx on public.recipe_ingredients(center_id);
create index if not exists weekly_menus_center_id_idx on public.weekly_menus(center_id);
create index if not exists menu_entries_center_id_idx on public.menu_entries(center_id);
create index if not exists stock_movements_center_id_idx on public.stock_movements(center_id);
create index if not exists suppliers_center_id_idx on public.suppliers(center_id);
create index if not exists purchases_center_id_idx on public.purchases(center_id);
create index if not exists purchase_items_center_id_idx on public.purchase_items(center_id);
create index if not exists budgets_center_id_idx on public.budgets(center_id);

alter table public.centers enable row level security;
alter table public.center_members enable row level security;
alter table public.foods enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.weekly_menus enable row level security;
alter table public.menu_entries enable row level security;
alter table public.stock_movements enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.budgets enable row level security;

revoke all on table public.centers, public.center_members, public.foods, public.recipes,
  public.recipe_ingredients, public.weekly_menus, public.menu_entries, public.stock_movements,
  public.suppliers, public.purchases, public.purchase_items, public.budgets from anon, authenticated;

grant select, insert, update, delete on table public.centers, public.center_members, public.foods,
  public.recipes, public.recipe_ingredients, public.weekly_menus, public.menu_entries,
  public.stock_movements, public.suppliers, public.purchases, public.purchase_items,
  public.budgets to authenticated;

-- Centres : le créateur peut créer son centre, puis les membres peuvent le consulter.
create policy "centers_select" on public.centers for select to authenticated
using (
  created_by = (select auth.uid())
  or id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid()))
);

create policy "centers_insert" on public.centers for insert to authenticated
with check (created_by = (select auth.uid()));

create policy "centers_update" on public.centers for update to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "centers_delete" on public.centers for delete to authenticated
using (created_by = (select auth.uid()));

-- Un utilisateur peut voir sa propre appartenance. Le créateur du centre peut ajouter les membres.
create policy "center_members_select" on public.center_members for select to authenticated
using (user_id = (select auth.uid()));

create policy "center_members_insert" on public.center_members for insert to authenticated
with check (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.centers c
    where c.id = center_id and c.created_by = (select auth.uid())
  )
);

create policy "center_members_update" on public.center_members for update to authenticated
using (
  exists (select 1 from public.centers c where c.id = center_id and c.created_by = (select auth.uid()))
)
with check (
  exists (select 1 from public.centers c where c.id = center_id and c.created_by = (select auth.uid()))
);

create policy "center_members_delete" on public.center_members for delete to authenticated
using (
  user_id = (select auth.uid())
  or exists (select 1 from public.centers c where c.id = center_id and c.created_by = (select auth.uid()))
);

-- Politiques standard : accès uniquement aux données des centres dont l'utilisateur est membre.
-- foods
create policy "foods_select" on public.foods for select to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "foods_insert" on public.foods for insert to authenticated
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "foods_update" on public.foods for update to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())))
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "foods_delete" on public.foods for delete to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));

-- recipes
create policy "recipes_select" on public.recipes for select to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "recipes_insert" on public.recipes for insert to authenticated
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "recipes_update" on public.recipes for update to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())))
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "recipes_delete" on public.recipes for delete to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));

-- recipe_ingredients
create policy "recipe_ingredients_select" on public.recipe_ingredients for select to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "recipe_ingredients_insert" on public.recipe_ingredients for insert to authenticated
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "recipe_ingredients_update" on public.recipe_ingredients for update to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())))
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "recipe_ingredients_delete" on public.recipe_ingredients for delete to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));

-- weekly_menus
create policy "weekly_menus_select" on public.weekly_menus for select to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "weekly_menus_insert" on public.weekly_menus for insert to authenticated
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "weekly_menus_update" on public.weekly_menus for update to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())))
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "weekly_menus_delete" on public.weekly_menus for delete to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));

-- menu_entries
create policy "menu_entries_select" on public.menu_entries for select to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "menu_entries_insert" on public.menu_entries for insert to authenticated
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "menu_entries_update" on public.menu_entries for update to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())))
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "menu_entries_delete" on public.menu_entries for delete to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));

-- stock_movements
create policy "stock_movements_select" on public.stock_movements for select to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "stock_movements_insert" on public.stock_movements for insert to authenticated
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "stock_movements_update" on public.stock_movements for update to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())))
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "stock_movements_delete" on public.stock_movements for delete to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));

-- suppliers
create policy "suppliers_select" on public.suppliers for select to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "suppliers_insert" on public.suppliers for insert to authenticated
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "suppliers_update" on public.suppliers for update to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())))
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "suppliers_delete" on public.suppliers for delete to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));

-- purchases
create policy "purchases_select" on public.purchases for select to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "purchases_insert" on public.purchases for insert to authenticated
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "purchases_update" on public.purchases for update to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())))
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "purchases_delete" on public.purchases for delete to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));

-- purchase_items
create policy "purchase_items_select" on public.purchase_items for select to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "purchase_items_insert" on public.purchase_items for insert to authenticated
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "purchase_items_update" on public.purchase_items for update to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())))
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "purchase_items_delete" on public.purchase_items for delete to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));

-- budgets
create policy "budgets_select" on public.budgets for select to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "budgets_insert" on public.budgets for insert to authenticated
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "budgets_update" on public.budgets for update to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())))
with check (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
create policy "budgets_delete" on public.budgets for delete to authenticated
using (center_id in (select cm.center_id from public.center_members cm where cm.user_id = (select auth.uid())));
