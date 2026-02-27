# TimeClock Enterprise v2.0
### Sistema de Control de Asistencia · 4 Jurisdicciones Fiscales

![Version](https://img.shields.io/badge/versión-2.0.0-00d4ff)
![Stack](https://img.shields.io/badge/stack-React%2018%20%2B%20Vanilla%20JS-00ff88)
![Países](https://img.shields.io/badge/países-MX%20·%20US%20·%20RD%20·%20SV-ffaa00)

---

## 🚀 Despliegue Rápido

### Opción A — Vercel (recomendado, gratis)

```bash
# 1. Instala Vercel CLI
npm i -g vercel

# 2. Desde la carpeta del proyecto
vercel login
vercel --prod
```

> Vercel detecta automáticamente `vercel.json` y sirve `public/index.html`.

### Opción B — Netlify (arrastrar y soltar)

1. Ve a **https://app.netlify.com/drop**
2. Arrastra la carpeta **`public/`** al navegador
3. ¡Listo! Netlify te da una URL pública al instante

O por CLI:
```bash
npm i -g netlify-cli
netlify deploy --prod --dir public
```

### Opción C — GitHub Pages

```bash
# 1. Crea un repositorio en GitHub
git init
git add .
git commit -m "TimeClock Enterprise v2.0"
git remote add origin https://github.com/TU_USUARIO/timeclock.git
git push -u origin main

# 2. En GitHub → Settings → Pages → Source: main / public
```

### Opción D — Servidor propio / VPS

```bash
# Con Nginx — copia el contenido de public/ a tu webroot
sudo cp public/index.html /var/www/html/

# O con Node serve (testing local)
npx serve public -p 3000
# → http://localhost:3000
```

---

## 🏗 Estructura del Proyecto

```
timeclock-enterprise/
├── public/
│   └── index.html          ← App completa (autocontenida, ~290KB)
├── .github/
│   └── workflows/
│       └── deploy.yml      ← CI/CD automático con GitHub Actions
├── vercel.json             ← Config Vercel (headers de seguridad, rutas)
├── netlify.toml            ← Config Netlify
├── package.json            ← Scripts de despliegue
├── .gitignore
└── README.md
```

> **El archivo `public/index.html` es completamente autocontenido.**
> No requiere build, bundler, npm install ni servidor especial.
> Funciona abriéndolo directamente en cualquier navegador moderno.

---

## 🔑 Credenciales por Defecto

> **⚠️ Cambia estas credenciales antes de ir a producción**

### Administradores

| Usuario | Contraseña  | Rol          |
|---------|-------------|--------------|
| `admin` | `admin123`  | Superadmin   |
| `rrhh`  | `rrhh2025`  | RRHH Manager |

### Empleados

Todos los empleados demo tienen PIN `1234`.

Para cambiar el PIN de un empleado: **Admin → Empleados → Editar → campo PIN**.

---

## ⚙️ Personalización Pre-Despliegue

Abre `public/index.html` en un editor de texto y busca la sección `ADMIN_USERS` (cerca de la línea 200):

```javascript
const ADMIN_USERS = [
  { id:"admin", username:"admin", password:"TU_NUEVA_CONTRASEÑA", name:"Administrador", role:"superadmin" },
  { id:"rrhh",  username:"rrhh",  password:"OTRA_CONTRASEÑA",     name:"RRHH Manager",  role:"admin" },
];
```

Para cambiar el nombre de la empresa, busca `TIMECLOCK` y `ENTERPRISE v2.0`.

---

## 🌎 Módulos y Funcionalidades

| Módulo             | Descripción                                               |
|--------------------|-----------------------------------------------------------|
| **Login**          | Pantalla dual: empleados con PIN / admin con usuario+pass |
| **Portal Empleado**| Checador personal, historial, resumen de nómina           |
| **Dashboard**      | KPIs en tiempo real, mapa de actividad, alertas           |
| **Empleados**      | CRUD completo, regímenes MX/US/RD/SV                      |
| **Reloj Checador** | Entrada/salida manual y por geocerca GPS                  |
| **Ubicaciones**    | Gestión de sedes con geocercas configurables              |
| **Departamentos**  | Organigrama, presupuesto vs costo real                    |
| **Nómina**         | Cálculo automático 4 jurisdicciones fiscales              |
| **Reportes BI**    | Gráficas, tendencias, análisis por país                   |

### Motores Fiscales Incluidos

| País            | Régimen         | Impuestos calculados                          |
|-----------------|-----------------|-----------------------------------------------|
| 🇲🇽 México       | SAT · LISR      | ISR (tabla 2024), IMSS, Subsidio al empleo    |
| 🇺🇸 Estados Unidos | IRS · FICA   | Federal income tax, Social Security, Medicare, CA FTB, SDI |
| 🇩🇴 Rep. Dominicana | DGII · TSS  | ISR (Ley 11-92 · Res. 2025), SFS 3.04%, AFP 2.87% |
| 🇸🇻 El Salvador  | MH · Decreto 10 | ISR (Decreto mayo 2025), ISSS 3%, AFP 7.25%   |

---

## 💾 Almacenamiento de Datos

La app usa **`localStorage`** del navegador — los datos persisten entre sesiones en el mismo dispositivo/navegador.

**Para producción multi-dispositivo**, los datos necesitan sincronizarse con un backend. Opciones recomendadas:

- **Supabase** (PostgreSQL gratuito) — reemplaza las 2 funciones `persist()` e `init()` en el HTML
- **Firebase Firestore** — misma estrategia
- **API REST propia** — las funciones de storage están aisladas y son fáciles de reemplazar

El schema de la base de datos está documentado en `docs/schema.sql`.

---

## 🔒 Seguridad

Los headers de seguridad están configurados en `vercel.json` y `netlify.toml`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(self)` — solo el propio dominio puede usar GPS

**Importante:** Las contraseñas en la versión actual se almacenan en texto plano en el HTML. Para producción real, implementar autenticación backend con hashing (bcrypt) y JWT.

---

## 🛠 Requisitos Técnicos

| Recurso       | Requerimiento                    |
|---------------|----------------------------------|
| Navegador     | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| Conexión      | Solo para fuentes Google (opcional, funciona offline sin ellas) |
| Servidor      | Cualquier servidor de archivos estáticos |
| Build         | **No requerido** — JS pre-compilado |

---

## 📋 Checklist Pre-Producción

- [ ] Cambiar contraseñas de administradores en `ADMIN_USERS`
- [ ] Cambiar PINs de empleados demo
- [ ] Reemplazar datos de empleados/sedes de ejemplo con datos reales
- [ ] Configurar dominio personalizado en Vercel/Netlify
- [ ] Activar HTTPS (automático en Vercel/Netlify)
- [ ] Evaluar migración a backend para datos multi-dispositivo
- [ ] Revisar radios de geocercas según ubicaciones reales

---

## 📞 Soporte

Sistema generado con **TimeClock Enterprise Generator**.
Para modificaciones o nuevas funcionalidades, el código fuente está en `time-control-system.jsx`.

---

*TimeClock Enterprise v2.0 · Build: Pre-compiled React 18 · Sin dependencias de build*
