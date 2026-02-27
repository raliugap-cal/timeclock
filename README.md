# TimeClock Enterprise — Guía de Publicación

Sistema de control de tiempo empresarial con nómina fiscal (SAT México + IRS California).
Stack: **React + Vite + Supabase + Vercel**

---

## PASO 1 — Crear proyecto en Supabase (5 min)

1. Ve a **https://supabase.com** → "Start your project" → crea cuenta gratis
2. Clic en **"New Project"**
   - Nombre: `timeclock-enterprise`
   - Password: (guárdalo bien)
   - Region: `South America (São Paulo)` para MX, o `West US` para California
3. Espera ~2 minutos a que el proyecto se inicialice

### 1.1 — Crear las tablas

4. En tu proyecto Supabase → menú izquierdo → **SQL Editor**
5. Clic en **"New query"**
6. Copia y pega **todo el contenido** del archivo `supabase/schema.sql`
7. Clic en **"Run"** (▶️) — deberías ver "Success"

### 1.2 — Obtener las credenciales

8. Menú izquierdo → **Project Settings** → **API**
9. Copia estos dos valores:
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **anon public key** → una clave larga que empieza con `eyJ...`

---

## PASO 2 — Configurar el código (2 min)

1. Copia el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```

2. Abre `.env` y reemplaza con tus valores reales:
   ```
   VITE_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...tu_clave_aqui
   ```

---

## PASO 3 — Probar localmente (2 min)

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

Abre **http://localhost:5173** — deberías ver la app conectada a Supabase.

---

## PASO 4 — Publicar en Vercel (3 min)

### Opción A — GitHub + Vercel (recomendado, deploy automático)

1. Sube el código a GitHub:
   ```bash
   git init
   git add .
   git commit -m "TimeClock Enterprise v2.0"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/timeclock.git
   git push -u origin main
   ```

2. Ve a **https://vercel.com** → "Add New Project"
3. Importa tu repositorio de GitHub
4. En **"Environment Variables"** agrega:
   - `VITE_SUPABASE_URL` = tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` = tu anon key
5. Clic **"Deploy"** — en ~90 segundos tendrás tu URL pública

### Opción B — Deploy directo con Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
# Sigue las instrucciones, agrega las env vars cuando te las pida
```

---

## PASO 5 — Multi-empresa (opcional, para producción)

El sistema ya está preparado para múltiples empresas. Para agregar clientes nuevos:

1. En Supabase → SQL Editor:
   ```sql
   insert into companies (name, slug, plan)
   values ('Nombre Empresa', 'slug-empresa', 'pro');
   ```

2. Copia el UUID generado y úsalo como `COMPANY_ID` en una versión del deploy para esa empresa.

Para producción real con login por empresa, implementa **Supabase Auth**:
- Cada usuario se asocia a una empresa via metadata
- Las políticas RLS filtran automáticamente por `auth.uid()`

---

## Estructura del proyecto

```
timeclock-app/
├── index.html              # Entrada HTML
├── vite.config.js          # Config Vite
├── package.json            # Dependencias
├── .env.example            # Template de variables de entorno
├── .gitignore
├── supabase/
│   └── schema.sql          # 🔑 Ejecutar esto en Supabase SQL Editor
└── src/
    ├── main.jsx            # Punto de entrada React
    ├── App.jsx             # UI completa (HUD Aerospace + Tax Engine)
    ├── hooks/
    │   └── useDB.js        # 🔑 Hook Supabase (reemplaza window.storage)
    └── lib/
        └── supabase.js     # Cliente Supabase singleton
```

---

## Módulos incluidos

| Módulo | Descripción |
|--------|-------------|
| 📊 Dashboard | KPIs en tiempo real, registros del día, cobertura global |
| 👥 Empleados | CRUD completo con validación |
| ⏱ Control Tiempo | Registros manuales y geocerca |
| 📍 Geocercas | Gestión de sedes con coordenadas GPS |
| 💰 Nómina | Motor fiscal SAT MX + IRS California |
| 📈 Reportes BI | Análisis por departamento, asistencia, costo nómina |

## Motor Fiscal

**México (SAT 2025):**
- ISR Art. 96 LISR — 11 tramos (1.92% – 35%)
- Subsidio al Empleo Art. 113 LISR
- IMSS Empleado: Enf./Maternidad + Invalidez + Cesantía

**California (IRS + FTB 2025):**
- Federal Income Tax IRS Pub. 15-T — 7 tramos (10% – 37%)
- Social Security 6.2% (wage base $176,100)
- Medicare 1.45% + Additional Medicare 0.9%
- CA State Income Tax FTB — 9 tramos (1% – 12.3%)
- CA SDI 1.1% sin tope

---

## Soporte

¿Dudas? Consulta:
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Vite Docs: https://vitejs.dev
