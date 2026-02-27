# Guía Rápida — Publicar TimeClock en 5 minutos

## OPCIÓN MÁS FÁCIL: Netlify Drop (sin cuenta, sin comandos)

1. Abre https://app.netlify.com/drop en tu navegador
2. Arrastra la carpeta **`public`** a la página
3. Netlify te da una URL pública en ~30 segundos
4. ¡Listo para compartir!

---

## OPCIÓN RECOMENDADA: Vercel con dominio propio

### Paso 1 — Crear cuenta
Regístrate gratis en https://vercel.com con tu cuenta de GitHub

### Paso 2 — Subir el proyecto
```
a) Sube esta carpeta a un repositorio de GitHub
b) En Vercel → "Add New Project" → selecciona el repositorio
c) Framework Preset: "Other" (static site)
d) Build Command: (dejar vacío)
e) Output Directory: public
f) Clic en Deploy
```

### Paso 3 — Dominio personalizado (opcional)
```
Vercel Dashboard → tu proyecto → Settings → Domains
→ Agrega tu dominio: checador.tuempresa.com
→ Apunta el DNS al servidor que indica Vercel
```

---

## ANTES DE PUBLICAR — Lista de cambios obligatorios

Abre `public/index.html` con un editor de texto (Notepad, VS Code, etc.)

### 1. Cambiar contraseñas de admin
Busca: `ADMIN_USERS`
```javascript
// CAMBIA ESTO:
password:"admin123"
// POR UNA CONTRASEÑA SEGURA:
password:"MiContraseñaSegura2025!"
```

### 2. Cambiar PINs de empleados
Busca: `pin:"1234"`
Reemplaza todos los `1234` por los PINs que asignes a cada empleado.

### 3. Reemplazar datos de prueba
Busca: `const SEED = {`
Reemplaza los empleados, departamentos y ubicaciones de ejemplo con los datos reales de tu empresa.

---

## Acceso a la aplicación publicada

| Tipo de usuario | Cómo accede |
|----------------|-------------|
| **Empleado**   | Abre la URL → clic en "EMPLEADO" → busca su nombre → ingresa PIN |
| **Admin**      | Abre la URL → clic en "ADMINISTRADOR" → usuario + contraseña |

---

## ¿Problemas?

- **Pantalla en blanco**: Abre las DevTools (F12) → pestaña Console → busca errores en rojo
- **Los datos se borran**: Normal en modo prueba. Los datos viven en el localStorage de cada navegador.
- **Geocerca no funciona**: El sitio debe estar en HTTPS para acceder al GPS (Vercel/Netlify lo activan automáticamente)
