# DigiAduana

Plataforma web base para automatizar procesos aduaneros de freight forwarders en El Salvador. Incluye backend Node.js/Express, MySQL 8, JWT, bcrypt, carga de PDFs, mocks de Ministerio de Hacienda y Navieras, y frontend Vue 3 con Vite.

## Actores cubiertos

- Administrador: gestiona usuarios, roles y auditoria.
- Supervisor: revisa expedientes, valida documentos y aprueba operaciones.
- Freight Forwarder: crea expedientes, registra carga, sube documentos y emite DTE.
- Cliente: consulta seguimiento publico por codigo de expediente.
- Soporte Tecnico: rol de consulta para bitacora, reportes y trazabilidad.

## Instalacion

```bash
npm install
copy .env.example .env
mysql -u root -p < database/schema.sql
npm run dev
```

En desarrollo se levantan dos servicios:

```text
Backend API: http://localhost:3000
Frontend Vue: http://localhost:5173
```

`npm run dev` ejecuta ambos procesos con `concurrently`. Si solo quieres el backend usa `npm run api:dev`.

Credenciales iniciales:

```text
Correo: admin@digiaduana.local
Password: password
```

Cambia esa clave en cuanto ingreses o crea otro administrador desde `POST /api/usuarios`.

## Variables de entorno

Configura `.env` con:

- `PORT`: puerto HTTP.
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: conexion MySQL.
- `JWT_SECRET`, `JWT_EXPIRES_IN`: firma y duracion de tokens.
- `MAX_PDF_MB`: limite de carga de PDF.
- `HACIENDA_API_URL`, `NAVIERAS_API_URL`: endpoints reales o mocks locales.

## Estructura principal

```text
config/          Conexion MySQL y JWT
middlewares/     Autenticacion, autorizacion y Multer
controllers/     Casos de uso REST
routes/          Endpoints API
services/        Integraciones Hacienda/Navieras
utils/           Helpers compartidos
database/        Script SQL MySQL
mocks/           Simuladores de Hacienda y Navieras
frontend-vue/    Aplicacion Vue 3 con Composition API
uploads/         PDFs cargados
```

## Endpoints base

- `POST /api/auth/login`
- `POST /api/auth/registro`
- `GET /api/expedientes`
- `POST /api/expedientes`
- `PATCH /api/expedientes/:id/estado`
- `POST /api/documentos` con campo multipart `pdf`
- `PATCH /api/documentos/:id/validar`
- `GET /api/seguimiento/publico/:codigo`
- `POST /api/dte`
- `POST /api/dte/:id/validar-hacienda`
- `GET /api/reportes/dashboard`
- `GET /api/usuarios`

## Reglas de negocio implementadas

- Los clientes solo consultan sus expedientes.
- Solo administrador, supervisor y freight forwarder pueden crear/editar tramites.
- Solo administrador y supervisor validan documentos y aprueban expedientes.
- Un expediente no puede pasar a `APROBADO` si tiene documentos pendientes o rechazados.
- Los PDFs se validan por MIME type y tamano maximo.
- Toda accion critica se registra en `bitacora_sistema`.
- DTE se emite localmente y luego puede validarse contra el mock de Hacienda.

## Frontend

Vistas Vue incluidas:

- `LoginView.vue`
- `DashboardView.vue`
- `ExpedientesListView.vue`
- `ExpedienteFormView.vue`
- `ProfileView.vue`
- `SeguimientoClienteView.vue`

Para compilar la app Vue y servirla desde Express:

```bash
npm run frontend:build
npm start
```

La version compilada queda en `frontend-vue-dist/`, carpeta generada e ignorada por Git.

## Datos de prueba

Despues de crear la base puedes insertar datos realistas adicionales con:

```bash
mysql -u root -p < database/seed_test_data.sql
```

## Mocks

Los mocks existentes viven en:

- `GET/POST /api/mock-hacienda/*`
- `GET/POST /api/mock-navieras/*`

Puedes reemplazar `HACIENDA_API_URL` y `NAVIERAS_API_URL` por servicios reales cuando esten disponibles.
