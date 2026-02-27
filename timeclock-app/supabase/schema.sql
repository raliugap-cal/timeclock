-- ═══════════════════════════════════════════════════════════
--  TIMECLOCK ENTERPRISE — SUPABASE SCHEMA
--  Ejecuta este script en: Supabase → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════

-- Habilitar UUID
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────
-- EMPRESAS (multi-tenant)
-- ──────────────────────────────────────
create table if not exists companies (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text unique not null,        -- para URL amigable
  logo_url    text,
  plan        text default 'starter',      -- starter | pro | enterprise
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────
-- DEPARTAMENTOS
-- ──────────────────────────────────────
create table if not exists departments (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid references companies(id) on delete cascade,
  name        text not null,
  color       text default '#00d4ff',
  budget      numeric(12,2) default 0,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────
-- UBICACIONES / GEOCERCAS
-- ──────────────────────────────────────
create table if not exists locations (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid references companies(id) on delete cascade,
  name        text not null,
  address     text,
  lat         numeric(10,6) not null,
  lng         numeric(10,6) not null,
  radius      integer default 150,         -- metros
  country     text default 'MX',           -- MX | US
  timezone    text default 'America/Mexico_City',
  active      boolean default true,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────
-- EMPLEADOS
-- ──────────────────────────────────────
create table if not exists employees (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid references companies(id) on delete cascade,
  dept_id     uuid references departments(id),
  location_id uuid references locations(id),
  name        text not null,
  role        text,
  avatar      text,                        -- 2 iniciales
  salary      numeric(12,2) not null,
  payroll     text default 'quincenal',    -- semanal|quincenal|mensual|biweekly
  country     text default 'MX',
  currency    text default 'MXN',
  status      text default 'active',       -- active | inactive
  hire_date   date,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────
-- REGISTROS DE TIEMPO
-- ──────────────────────────────────────
create table if not exists time_records (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid references companies(id) on delete cascade,
  employee_id uuid references employees(id) on delete cascade,
  date        date not null,
  entry_time  time,
  exit_time   time,
  hours       numeric(5,2),
  type        text default 'manual',       -- manual | geocerca
  status      text default 'normal',       -- normal | tardanza | activo
  approved    boolean default false,
  approved_by uuid references employees(id),
  notes       text,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────
-- CORTES DE NÓMINA
-- ──────────────────────────────────────
create table if not exists payroll_cuts (
  id           uuid primary key default uuid_generate_v4(),
  company_id   uuid references companies(id) on delete cascade,
  period       text not null,
  type         text not null,
  country      text default 'all',
  employees    integer,
  gross_total  numeric(14,2),
  total_ded    numeric(14,2),
  net_total    numeric(14,2),
  status       text default 'pendiente',   -- pendiente | pagado
  cut_date     date,
  created_by   text,
  created_at   timestamptz default now()
);

-- ══════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — Multi-tenant
-- Cada empresa solo ve SUS datos
-- ══════════════════════════════════════

alter table companies    enable row level security;
alter table departments  enable row level security;
alter table locations    enable row level security;
alter table employees    enable row level security;
alter table time_records enable row level security;
alter table payroll_cuts enable row level security;

-- Política: solo el anon key puede leer (ajusta según tu auth)
-- Para producción real, usa Supabase Auth y filtra por auth.uid()
-- Por ahora dejamos acceso abierto para el prototipo (ajustar antes de producción):

create policy "allow_all_companies"    on companies    for all using (true) with check (true);
create policy "allow_all_departments"  on departments  for all using (true) with check (true);
create policy "allow_all_locations"    on locations    for all using (true) with check (true);
create policy "allow_all_employees"    on employees    for all using (true) with check (true);
create policy "allow_all_time_records" on time_records for all using (true) with check (true);
create policy "allow_all_payroll_cuts" on payroll_cuts for all using (true) with check (true);

-- ══════════════════════════════════════
-- DATOS SEMILLA DE EJEMPLO
-- ══════════════════════════════════════

-- Empresa demo
insert into companies (id, name, slug, plan) values
  ('00000000-0000-0000-0000-000000000001', 'Empresa Demo S.A. de C.V.', 'demo', 'pro')
on conflict (slug) do nothing;

-- Departamentos
insert into departments (company_id, name, color) values
  ('00000000-0000-0000-0000-000000000001', 'Tecnología',        '#00d4ff'),
  ('00000000-0000-0000-0000-000000000001', 'Ventas',            '#00ff88'),
  ('00000000-0000-0000-0000-000000000001', 'Recursos Humanos',  '#ffaa00'),
  ('00000000-0000-0000-0000-000000000001', 'Operaciones',       '#a855f7'),
  ('00000000-0000-0000-0000-000000000001', 'Finanzas',          '#ff3366');

-- Ubicaciones
insert into locations (company_id, name, address, lat, lng, radius, country, timezone) values
  ('00000000-0000-0000-0000-000000000001', 'CDMX HQ',       'Av. Reforma 350, Col. Juárez, CDMX',         19.4284, -99.1639, 150, 'MX', 'America/Mexico_City'),
  ('00000000-0000-0000-0000-000000000001', 'Monterrey',     'Av. Revolución 2703, Monterrey, NL',          25.6866,-100.3161, 120, 'MX', 'America/Monterrey'),
  ('00000000-0000-0000-0000-000000000001', 'Los Angeles',   '1100 Wilshire Blvd, Los Angeles, CA',         34.0522,-118.2437, 120, 'US', 'America/Los_Angeles'),
  ('00000000-0000-0000-0000-000000000001', 'San Francisco', '101 California St, San Francisco, CA',        37.7749,-122.4194, 100, 'US', 'America/Los_Angeles');
