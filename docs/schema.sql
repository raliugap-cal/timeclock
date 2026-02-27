-- TimeClock Enterprise v2.0 — Schema SQL
-- Compatible con PostgreSQL (Supabase) y MySQL 8+
-- =====================================================

-- EMPRESAS (multi-tenant, opcional)
CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(200) NOT NULL,
  country     CHAR(2),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- DEPARTAMENTOS
CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  color       VARCHAR(10) DEFAULT '#00d4ff',
  head_emp_id UUID,
  budget      NUMERIC(14,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- UBICACIONES / SEDES
CREATE TABLE locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  name        VARCHAR(150) NOT NULL,
  address     TEXT,
  lat         NUMERIC(10,6),
  lng         NUMERIC(10,6),
  radius      INTEGER DEFAULT 150,       -- metros
  country     CHAR(2),
  timezone    VARCHAR(50),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- EMPLEADOS
CREATE TABLE employees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  dept_id     UUID REFERENCES departments(id),
  location_id UUID REFERENCES locations(id),
  name        VARCHAR(200) NOT NULL,
  role        VARCHAR(150),
  avatar      VARCHAR(4),
  status      VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  payroll     VARCHAR(30),               -- mensual|quincenal|semanal|biweekly
  salary      NUMERIC(14,2),
  country     CHAR(2),
  currency    VARCHAR(5),
  hire_date   DATE,
  pin_hash    VARCHAR(256),              -- bcrypt hash del PIN
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- USUARIOS ADMINISTRATIVOS
CREATE TABLE admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  username    VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(256) NOT NULL,   -- bcrypt
  name        VARCHAR(200),
  role        VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('superadmin','admin','rrhh','viewer')),
  active      BOOLEAN DEFAULT TRUE,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- REGISTROS DE TIEMPO
CREATE TABLE time_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_id        UUID REFERENCES employees(id) ON DELETE CASCADE,
  location_id   UUID REFERENCES locations(id),
  date          DATE NOT NULL,
  entry_time    TIME,
  exit_time     TIME,
  hours         NUMERIC(5,2),
  type          VARCHAR(20) DEFAULT 'manual' CHECK (type IN ('manual','geocerca','portal','biometric')),
  status        VARCHAR(20) DEFAULT 'normal' CHECK (status IN ('normal','tardanza','activo','ausente')),
  approved      BOOLEAN DEFAULT FALSE,
  approved_by   UUID REFERENCES admin_users(id),
  notes         TEXT,
  geo_lat_entry NUMERIC(10,6),
  geo_lng_entry NUMERIC(10,6),
  geo_lat_exit  NUMERIC(10,6),
  geo_lng_exit  NUMERIC(10,6),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- CORTES DE NÓMINA
CREATE TABLE payroll_cuts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  period      VARCHAR(100) NOT NULL,
  type        VARCHAR(30),               -- mensual|quincenal|semanal|biweekly
  country     CHAR(2),
  emp_count   INTEGER,
  gross_total NUMERIC(16,2),
  total_ded   NUMERIC(16,2),
  net_total   NUMERIC(16,2),
  status      VARCHAR(20) DEFAULT 'pendiente' CHECK (status IN ('pendiente','aprobado','pagado','cancelado')),
  cut_date    DATE,
  created_by  UUID REFERENCES admin_users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES DE RENDIMIENTO
CREATE INDEX idx_time_records_emp_date   ON time_records(emp_id, date);
CREATE INDEX idx_time_records_date       ON time_records(date);
CREATE INDEX idx_employees_company       ON employees(company_id);
CREATE INDEX idx_employees_dept          ON employees(dept_id);
CREATE INDEX idx_payroll_cuts_company    ON payroll_cuts(company_id, cut_date);

-- ROW LEVEL SECURITY (Supabase)
ALTER TABLE employees    ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_cuts ENABLE ROW LEVEL SECURITY;

-- Política: los usuarios solo ven registros de su empresa
-- (Requiere pasar company_id como claim en el JWT de Supabase)
CREATE POLICY "company_isolation" ON employees
  USING (company_id = (current_setting('app.company_id')::UUID));

CREATE POLICY "company_isolation" ON time_records
  USING (emp_id IN (
    SELECT id FROM employees
    WHERE company_id = (current_setting('app.company_id')::UUID)
  ));

-- =====================================================
-- GUÍA DE MIGRACIÓN DESDE localStorage
-- =====================================================
-- 1. Instalar Supabase: https://supabase.com (plan gratuito)
-- 2. Ejecutar este schema en el SQL Editor de Supabase
-- 3. En index.html, reemplazar la función persist():
--
--    const SUPABASE_URL = 'https://xxx.supabase.co';
--    const SUPABASE_KEY = 'tu_anon_key';
--
--    const persist = async (data) => {
--      await fetch(`${SUPABASE_URL}/rest/v1/...`, {
--        method: 'POST',
--        headers: { 'apikey': SUPABASE_KEY, ... },
--        body: JSON.stringify(data)
--      });
--    };
-- =====================================================
