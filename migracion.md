# Migracion de enrutamiento por roles para DigiAduana

Esta guía describe los pasos para alinear la aplicación Vue 3 con una arquitectura basada en roles y layouts dinámicos.

## 1. Confirma la estructura de carpetas

Asegúrate de tener esta estructura en `frontend-vue/src`:

```text
layouts/
components/common/
router/
stores/
views/public/
views/admin/
views/forwarder/
views/supervisor/
views/cliente/
views/soporte/
```

## 2. Archivos clave entregados

- `frontend-vue/src/router/index.js`
- `frontend-vue/src/stores/authStore.js`
- `frontend-vue/src/layouts/PublicLayout.vue`
- `frontend-vue/src/layouts/AppLayout.vue`
- `frontend-vue/src/layouts/ClienteLayout.vue`
- `frontend-vue/src/components/common/Sidebar.vue`
- `frontend-vue/src/components/common/Header.vue`
- `frontend-vue/src/views/public/HomePage.vue`
- `frontend-vue/src/views/public/PublicTracking.vue`
- `frontend-vue/src/views/forwarder/ExpedienteDetail.vue`

## 3. Instalar dependencias y verificar configuración

Desde `DigiAduana/frontend-vue`:

```bash
npm install
```

Asegúrate de que `main.js` registre Pinia y el router:

```js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/base.css';

createApp(App).use(createPinia()).use(router).mount('#app');
```

## 4. Layout dinámico y rutas

`frontend-vue/src/App.vue` ya debe usar la propiedad `meta.layout`:

```vue
<template>
  <component :is="$route.meta.layout || 'div'">
    <RouterView />
  </component>
</template>
```

Las rutas públicas son:

- `/home`
- `/login`
- `/tracking/:codigo`

Las rutas privadas son accesibles según `meta.requiredRole`.

## 4.1 Validacion de correo en bases existentes

Si ya tenias la base creada antes de esta version, agrega los campos de validacion:

```sql
ALTER TABLE usuarios
  ADD COLUMN email_verificado TINYINT(1) DEFAULT 0 AFTER estado,
  ADD COLUMN verification_token_hash VARCHAR(255) NULL AFTER email_verificado,
  ADD COLUMN verification_expires DATETIME NULL AFTER verification_token_hash;

UPDATE usuarios SET email_verificado = 1 WHERE correo LIKE '%@digiaduana.local' OR id = 1;
```

## 5. Roles y navegación

Los roles utilizados son:

- `admin`
- `forwarder`
- `supervisor`
- `cliente`
- `soporte`

No hay registro público. Solo `admin` puede crear usuarios desde la interfaz interna.

## 6. Autenticación

`stores/authStore.js` guarda en `localStorage`:

- `digiaduana_token`
- `digiaduana_user`

La acción `login` hace `POST /auth/login` y guarda token, usuario y rol.

## 7. Páginas públicas y privadas

- Publica: `HomePage.vue`, `PublicTracking.vue`
- Admin: `UserManagement.vue`, `BackupConfig.vue`, `ServerMonitor.vue`
- Forwarder: `ExpedienteList.vue`, `ExpedienteForm.vue`, `ExpedienteDetail.vue`, `DocumentManagement.vue`, `FacturacionDTE.vue`
- Supervisor: `DashboardGerencial.vue`, `ReportesOperativos.vue`
- Cliente: `ClienteDashboard.vue`, `MisFacturas.vue`
- Soporte: `Incidentes.vue`, `SesionesActivas.vue`, `Infraestructura.vue`

## 8. Seguimiento público

El endpoint público es `/tracking/:codigo`.

La vista `PublicTracking.vue` muestra solo datos básicos:

- código de expediente
- estado actual
- ubicación
- fechas
- eventos públicos

## 9. Validar la migración

Después de aplicar los cambios:

```bash
cd frontend-vue
npm run frontend:build
npm run frontend:dev
```

Luego, abre la app y prueba:

- `/home`
- `/login`
- `/tracking/EXP-2026-0001`
- rutas de usuario autenticado según rol

## 10. Ajustes si el backend usa roles distintos

Si el backend devuelve roles con nombres diferentes, agrega alias en `frontend-vue/src/stores/authStore.js` dentro de `ROLE_ALIASES`.
