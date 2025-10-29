# Sistema de Registro de Víctimas CDMX

Aplicación frontend desarrollada en React + Vite para la gestión del Registro de Víctimas de la Ciudad de México.

## 🚀 Aplicación Desplegada

**Frontend:** https://registro-victimas.web.app  
**Backend Django (transición a Supabase):** https://backend-registro-sa7u.onrender.com

## 📋 Funcionalidades

- **Búsqueda de Víctimas** con filtros avanzados
- **Control de Gestión** (expedientes, oficios, solicitudes)
- **Nuevo Oficio** con editor enriquecido TipTap
- **Autenticación** (Django JWT legado → migración parcial a Supabase tabla `users`)

## 🛠️ Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env y colocar valores reales de Supabase
VITE_SUPABASE_URL=... 
VITE_SUPABASE_ANON_KEY=...

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Desplegar a Firebase Hosting
npx firebase-tools deploy --only hosting --project registro
```

## � Configuración Supabase

Variables requeridas en `.env` (no versionado):
```
VITE_SUPABASE_URL=https://TU_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```
El cliente ahora lanza error si faltan estas variables (ver `src/services/supabaseClient.js`).

Autenticación actual: lookup manual en tabla `users` (transitorio). Próximo paso recomendado: habilitar Auth nativa y políticas RLS seguras.

## 🔧 Tecnologías

- React 19 + Vite
- Tailwind / CSS personalizado
- TipTap (editor)
- Firebase Hosting
- Supabase (migración en progreso)

## 📊 Estado del Proyecto

| Área | Estado |
|------|--------|
| Frontend base | ✅ |
| Editor Oficios | ✅ |
| Búsqueda Víctimas | ✅ (migración parcial a Supabase) |
| Auth Django | Legacy / en retiro |
| Auth Supabase | Parcial (tabla users) |
| RLS Supabase | Pendiente |

## ▶️ Scripts Clave
```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run preview  # Previsualizar build
```

## 🗺️ Próximos Pasos (sugeridos)
1. Sustituir pseudo-auth por `supabase.auth.signInWithPassword`
2. Implementar RLS y políticas por rol
3. Migrar endpoints restantes a vistas/funciones Supabase
4. Code-splitting para reducir bundle >1MB

## 📞 Contacto
Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.
