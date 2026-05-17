<template>
  <section class="admin-page">
    <div class="admin-bg"></div>
    <div class="admin-shell">
      <header class="hero">
        <div>
          <p class="eyebrow"><i class="fas fa-users-gear"></i> CU-ADM-01</p>
          <h1>Gestión de Usuarios y Roles</h1>
          <span>Control de identidades, sesiones JWT y niveles de acceso operativos.</span>
        </div>
        <button class="primary-btn" type="button" @click="openCreateModal">
          <i class="fas fa-user-plus"></i>
          Crear usuario
        </button>
      </header>

      <section class="kpi-grid">
        <article v-for="item in kpis" :key="item.label" class="glass-card">
          <i :class="item.icon"></i>
          <strong>{{ item.value }}</strong>
          <span>{{ item.label }}</span>
        </article>
      </section>

      <section class="toolbar">
        <label class="search-box">
          <i class="fas fa-search"></i>
          <input v-model.trim="filters.search" type="search" placeholder="Buscar por nombre, correo, empresa o rol" />
        </label>

        <label>
          Rol
          <select v-model="filters.role">
            <option value="">Todos</option>
            <option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option>
          </select>
        </label>

        <label>
          Estado
          <select v-model="filters.status">
            <option value="">Todos</option>
            <option value="Activo">Activo</option>
            <option value="Bloqueado">Bloqueado</option>
            <option value="Suspendido">Suspendido</option>
          </select>
        </label>

        <label>
          Filas
          <select v-model.number="pageSize">
            <option :value="8">8</option>
            <option :value="12">12</option>
            <option :value="16">16</option>
          </select>
        </label>
      </section>

      <section class="data-panel">
        <div class="data-panel__head">
          <div>
            <strong>Directorio corporativo</strong>
            <span>{{ filteredUsers.length }} usuarios encontrados</span>
          </div>
          <span class="hash-pill"><i class="fas fa-shield-halved"></i> Bcrypt + JWT RBAC</span>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Empresa / Área</th>
                <th>Nivel</th>
                <th>Creado</th>
                <th>Estado</th>
                <th>Sesión</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in paginatedUsers" :key="user.id">
                <td>
                  <div class="identity">
                    <span>{{ initials(user.name) }}</span>
                    <div>
                      <strong>{{ user.name }}</strong>
                      <small>{{ user.email }}</small>
                    </div>
                  </div>
                </td>
                <td><span class="role-badge" :class="roleClass(user.role)">{{ roleLabel(user.role) }}</span></td>
                <td>{{ user.company }}</td>
                <td>{{ user.accessLevel }}</td>
                <td>{{ user.createdAt }}</td>
                <td><span class="status-badge" :class="statusClass(user.status)">{{ user.status }}</span></td>
                <td>{{ user.jwtSession }}</td>
                <td>
                  <div class="row-actions">
                    <button title="Desbloquear sesión JWT" @click="unlockSession(user)">
                      <i class="fas fa-key"></i>
                    </button>
                    <button title="Desactivar cuenta" @click="deactivateUser(user)">
                      <i class="fas fa-user-slash"></i>
                    </button>
                    <button title="Auditar usuario" @click="selectedAudit = user">
                      <i class="fas fa-clipboard-check"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="pagination">
          <button :disabled="page === 1" @click="page--"><i class="fas fa-chevron-left"></i></button>
          <span>Página {{ page }} de {{ totalPages }}</span>
          <button :disabled="page === totalPages" @click="page++"><i class="fas fa-chevron-right"></i></button>
        </footer>
      </section>

      <section class="audit-strip">
        <article v-for="event in recentEvents" :key="event.id">
          <i :class="event.icon"></i>
          <div>
            <strong>{{ event.title }}</strong>
            <span>{{ event.detail }}</span>
          </div>
        </article>
      </section>
    </div>

    <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false">
      <form class="modal-card" @submit.prevent="createUser">
        <header>
          <h2><i class="fas fa-user-lock"></i> Alta segura de usuario</h2>
          <button type="button" @click="showCreate = false"><i class="fas fa-xmark"></i></button>
        </header>
        <label>Nombre completo<input v-model="newUser.name" required placeholder="Ej. Andrea Pineda" /></label>
        <label>Correo corporativo<input v-model="newUser.email" required type="email" placeholder="usuario@empresa.com" /></label>
        <label>Rol
          <select v-model="newUser.role" required>
            <option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option>
          </select>
        </label>
        <label>Empresa / Área<input v-model="newUser.company" required placeholder="Operaciones San Salvador" /></label>
        <div class="bcrypt-preview">
          <i class="fas fa-fingerprint"></i>
          <span>Se generará hash Bcrypt simulado y política JWT de {{ accessForRole(newUser.role) }}.</span>
        </div>
        <button class="primary-btn" type="submit"><i class="fas fa-lock"></i> Crear con acceso seguro</button>
      </form>
    </div>

    <aside v-if="selectedAudit" class="audit-drawer">
      <button class="drawer-close" @click="selectedAudit = null"><i class="fas fa-xmark"></i></button>
      <h3>{{ selectedAudit.name }}</h3>
      <p>{{ selectedAudit.email }}</p>
      <div>
        <span>Última IP</span>
        <strong>{{ selectedAudit.lastIp }}</strong>
      </div>
      <div>
        <span>Último acceso</span>
        <strong>{{ selectedAudit.lastLogin }}</strong>
      </div>
      <div>
        <span>Hash Bcrypt</span>
        <code>{{ selectedAudit.hashPreview }}</code>
      </div>
    </aside>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';

const roles = [
  { value: 'admin', label: 'Administrador' },
  { value: 'forwarder', label: 'Freight Forwarder' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'soporte', label: 'Soporte Técnico' }
];

const users = ref([
  { id: 1, name: 'Jonathan Herrera', email: 'admin@digiaduana.local', role: 'admin', company: 'DigiAduana Central', accessLevel: 'Nivel 5 - Root', createdAt: '2026-01-12', status: 'Activo', jwtSession: 'Validada', lastIp: '190.57.88.21', lastLogin: '2026-05-17 10:42', hashPreview: '$2b$10$A9p...root' },
  { id: 2, name: 'Valeria Menéndez', email: 'forwarder@digiaduana.local', role: 'forwarder', company: 'Acajutla Freight Hub', accessLevel: 'Nivel 3 - Operativo', createdAt: '2026-01-18', status: 'Activo', jwtSession: 'Validada', lastIp: '181.189.144.10', lastLogin: '2026-05-17 09:31', hashPreview: '$2b$10$Q8f...frw' },
  { id: 3, name: 'Mario Escobar', email: 'supervisor@digiaduana.local', role: 'supervisor', company: 'Supervisión Aduanera', accessLevel: 'Nivel 4 - Aprobador', createdAt: '2026-01-20', status: 'Activo', jwtSession: 'Validada', lastIp: '190.120.77.83', lastLogin: '2026-05-17 08:55', hashPreview: '$2b$10$C4t...sup' },
  { id: 4, name: 'Ana Morales', email: 'cliente@digiaduana.local', role: 'cliente', company: 'Importadora Cuscatlán', accessLevel: 'Nivel 1 - Consulta', createdAt: '2026-02-02', status: 'Activo', jwtSession: 'Validada', lastIp: '186.32.91.17', lastLogin: '2026-05-16 16:44', hashPreview: '$2b$10$K1p...cli' },
  { id: 5, name: 'Diego Guardado', email: 'soporte@digiaduana.local', role: 'soporte', company: 'Mesa de Ayuda TI', accessLevel: 'Nivel 2 - Soporte', createdAt: '2026-02-05', status: 'Activo', jwtSession: 'Validada', lastIp: '10.10.2.31', lastLogin: '2026-05-17 07:48', hashPreview: '$2b$10$Z2n...sop' },
  { id: 6, name: 'Sofía Alvarado', email: 'sofia.alvarado@digiaduana.local', role: 'supervisor', company: 'Operaciones Marítimas', accessLevel: 'Nivel 4 - Aprobador', createdAt: '2026-02-09', status: 'Bloqueado', jwtSession: 'Expirada', lastIp: '201.247.122.40', lastLogin: '2026-05-15 14:20', hashPreview: '$2b$10$N8m...sup' },
  { id: 7, name: 'Carlos Rivas', email: 'carlos.rivas@forwarder.local', role: 'forwarder', company: 'Pacífico Cargo', accessLevel: 'Nivel 3 - Operativo', createdAt: '2026-02-14', status: 'Activo', jwtSession: 'Validada', lastIp: '190.86.33.18', lastLogin: '2026-05-17 06:11', hashPreview: '$2b$10$L9s...frw' },
  { id: 8, name: 'Marcela Pineda', email: 'marcela.pineda@textiles.local', role: 'cliente', company: 'Textiles Santa Ana', accessLevel: 'Nivel 1 - Consulta', createdAt: '2026-02-21', status: 'Activo', jwtSession: 'Validada', lastIp: '181.225.42.91', lastLogin: '2026-05-16 11:18', hashPreview: '$2b$10$P7c...cli' },
  { id: 9, name: 'Roberto Aguilar', email: 'roberto.aguilar@naviera.local', role: 'forwarder', company: 'Naviera del Pacífico', accessLevel: 'Nivel 3 - Operativo', createdAt: '2026-02-25', status: 'Suspendido', jwtSession: 'Revocada', lastIp: '172.16.4.19', lastLogin: '2026-05-10 13:02', hashPreview: '$2b$10$R2v...frw' },
  { id: 10, name: 'Lucía Campos', email: 'lucia.campos@soporte.local', role: 'soporte', company: 'NOC DigiAduana', accessLevel: 'Nivel 2 - Soporte', createdAt: '2026-03-01', status: 'Activo', jwtSession: 'Validada', lastIp: '10.10.2.45', lastLogin: '2026-05-17 10:10', hashPreview: '$2b$10$S4k...sop' },
  { id: 11, name: 'Mauricio Arias', email: 'mauricio.arias@agrolempa.local', role: 'cliente', company: 'Agroexportadora Lempa', accessLevel: 'Nivel 1 - Consulta', createdAt: '2026-03-04', status: 'Activo', jwtSession: 'Validada', lastIp: '190.53.61.29', lastLogin: '2026-05-13 08:40', hashPreview: '$2b$10$J7q...cli' },
  { id: 12, name: 'Karla Mejía', email: 'karla.mejia@digiaduana.local', role: 'admin', company: 'Seguridad Aplicativa', accessLevel: 'Nivel 5 - Root', createdAt: '2026-03-07', status: 'Activo', jwtSession: 'Validada', lastIp: '10.0.0.12', lastLogin: '2026-05-17 09:02', hashPreview: '$2b$10$V5r...adm' },
  { id: 13, name: 'Elena Portillo', email: 'elena.portillo@farmaceutica.local', role: 'cliente', company: 'Farmacéutica El Salvador', accessLevel: 'Nivel 1 - Consulta', createdAt: '2026-03-10', status: 'Bloqueado', jwtSession: 'Bloqueada', lastIp: '186.149.20.88', lastLogin: '2026-05-08 15:30', hashPreview: '$2b$10$T6y...cli' },
  { id: 14, name: 'Daniel Herrera', email: 'daniel.herrera@cargo.local', role: 'forwarder', company: 'Aéreo Express SV', accessLevel: 'Nivel 3 - Operativo', createdAt: '2026-03-11', status: 'Activo', jwtSession: 'Validada', lastIp: '200.31.171.3', lastLogin: '2026-05-17 05:55', hashPreview: '$2b$10$B2h...frw' },
  { id: 15, name: 'Paola Calderón', email: 'paola.calderon@digiaduana.local', role: 'supervisor', company: 'Auditoría Documental', accessLevel: 'Nivel 4 - Aprobador', createdAt: '2026-03-16', status: 'Activo', jwtSession: 'Validada', lastIp: '10.1.2.76', lastLogin: '2026-05-16 17:19', hashPreview: '$2b$10$U7b...sup' },
  { id: 16, name: 'Óscar Lemus', email: 'oscar.lemus@soporte.local', role: 'soporte', company: 'Infraestructura Cloud', accessLevel: 'Nivel 2 - Soporte', createdAt: '2026-03-18', status: 'Activo', jwtSession: 'Validada', lastIp: '10.10.2.57', lastLogin: '2026-05-17 04:39', hashPreview: '$2b$10$M3c...sop' },
  { id: 17, name: 'Gabriela Solís', email: 'gabriela.solis@plasticos.local', role: 'cliente', company: 'Plásticos Mesoamérica', accessLevel: 'Nivel 1 - Consulta', createdAt: '2026-03-22', status: 'Activo', jwtSession: 'Validada', lastIp: '190.151.41.203', lastLogin: '2026-05-15 18:22', hashPreview: '$2b$10$A1x...cli' },
  { id: 18, name: 'Héctor Núñez', email: 'hector.nunez@forwarder.local', role: 'forwarder', company: 'TransLogística CA', accessLevel: 'Nivel 3 - Operativo', createdAt: '2026-03-25', status: 'Bloqueado', jwtSession: 'Bloqueada', lastIp: '201.191.7.44', lastLogin: '2026-05-11 07:34', hashPreview: '$2b$10$E9d...frw' },
  { id: 19, name: 'Renata Figueroa', email: 'renata.figueroa@digiaduana.local', role: 'supervisor', company: 'Control de Riesgo', accessLevel: 'Nivel 4 - Aprobador', createdAt: '2026-03-28', status: 'Activo', jwtSession: 'Validada', lastIp: '10.1.1.84', lastLogin: '2026-05-16 12:01', hashPreview: '$2b$10$G6m...sup' },
  { id: 20, name: 'Luis Barrera', email: 'luis.barrera@coffee.local', role: 'cliente', company: 'Café Volcán de Izalco', accessLevel: 'Nivel 1 - Consulta', createdAt: '2026-04-01', status: 'Activo', jwtSession: 'Validada', lastIp: '181.115.18.62', lastLogin: '2026-05-14 09:16', hashPreview: '$2b$10$H4w...cli' },
  { id: 21, name: 'María José Quintanilla', email: 'maria.quintanilla@digiaduana.local', role: 'admin', company: 'Gobierno TI', accessLevel: 'Nivel 5 - Root', createdAt: '2026-04-04', status: 'Activo', jwtSession: 'Validada', lastIp: '10.0.0.18', lastLogin: '2026-05-17 10:05', hashPreview: '$2b$10$F2z...adm' },
  { id: 22, name: 'Andrés Molina', email: 'andres.molina@repuestos.local', role: 'cliente', company: 'Repuestos La Unión', accessLevel: 'Nivel 1 - Consulta', createdAt: '2026-04-07', status: 'Suspendido', jwtSession: 'Revocada', lastIp: '186.32.88.91', lastLogin: '2026-05-04 10:00', hashPreview: '$2b$10$W3e...cli' },
  { id: 23, name: 'Patricia Sandoval', email: 'patricia.sandoval@cargo.local', role: 'forwarder', company: 'Bodega Fiscal Nejapa', accessLevel: 'Nivel 3 - Operativo', createdAt: '2026-04-12', status: 'Activo', jwtSession: 'Validada', lastIp: '190.86.16.91', lastLogin: '2026-05-16 21:14', hashPreview: '$2b$10$D5n...frw' },
  { id: 24, name: 'Kevin Alfaro', email: 'kevin.alfaro@soporte.local', role: 'soporte', company: 'Mesa de Ayuda TI', accessLevel: 'Nivel 2 - Soporte', createdAt: '2026-04-15', status: 'Activo', jwtSession: 'Validada', lastIp: '10.10.2.66', lastLogin: '2026-05-17 01:28', hashPreview: '$2b$10$Y8r...sop' },
  { id: 25, name: 'Verónica Chacón', email: 'veronica.chacon@digiaduana.local', role: 'supervisor', company: 'Cumplimiento Aduanero', accessLevel: 'Nivel 4 - Aprobador', createdAt: '2026-04-18', status: 'Activo', jwtSession: 'Validada', lastIp: '10.1.1.102', lastLogin: '2026-05-17 07:07', hashPreview: '$2b$10$I9k...sup' },
  { id: 26, name: 'Ricardo Benítez', email: 'ricardo.benitez@techca.local', role: 'cliente', company: 'Tecnología Centroamericana', accessLevel: 'Nivel 1 - Consulta', createdAt: '2026-04-20', status: 'Activo', jwtSession: 'Validada', lastIp: '190.57.12.44', lastLogin: '2026-05-16 13:53', hashPreview: '$2b$10$X1l...cli' },
  { id: 27, name: 'Natalia Córdova', email: 'natalia.cordova@forwarder.local', role: 'forwarder', company: 'Global Freight SV', accessLevel: 'Nivel 3 - Operativo', createdAt: '2026-04-23', status: 'Activo', jwtSession: 'Validada', lastIp: '201.247.53.74', lastLogin: '2026-05-17 08:16', hashPreview: '$2b$10$O6a...frw' },
  { id: 28, name: 'Ernesto Salazar', email: 'ernesto.salazar@soporte.local', role: 'soporte', company: 'Seguridad Perimetral', accessLevel: 'Nivel 2 - Soporte', createdAt: '2026-04-26', status: 'Bloqueado', jwtSession: 'Bloqueada', lastIp: '10.10.2.81', lastLogin: '2026-05-12 19:02', hashPreview: '$2b$10$P3u...sop' }
]);

const filters = reactive({ search: '', role: '', status: '' });
const page = ref(1);
const pageSize = ref(8);
const showCreate = ref(false);
const selectedAudit = ref(null);
const newUser = reactive({ name: '', email: '', role: 'forwarder', company: '' });

const filteredUsers = computed(() => {
  const term = filters.search.toLowerCase();
  return users.value.filter((user) => {
    const matchesTerm = [user.name, user.email, user.company, roleLabel(user.role)].some((value) =>
      value.toLowerCase().includes(term)
    );
    return matchesTerm && (!filters.role || user.role === filters.role) && (!filters.status || user.status === filters.status);
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize.value)));
const paginatedUsers = computed(() => filteredUsers.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));

const kpis = computed(() => [
  { label: 'Usuarios totales', value: users.value.length, icon: 'fas fa-users' },
  { label: 'Sesiones JWT válidas', value: users.value.filter((u) => u.jwtSession === 'Validada').length, icon: 'fas fa-key' },
  { label: 'Cuentas bloqueadas', value: users.value.filter((u) => u.status === 'Bloqueado').length, icon: 'fas fa-lock' },
  { label: 'Roles operativos', value: new Set(users.value.map((u) => u.role)).size, icon: 'fas fa-user-shield' }
]);

const recentEvents = ref([
  { id: 1, icon: 'fas fa-unlock-keyhole', title: 'JWT desbloqueado', detail: 'Sesión de Sofía Alvarado liberada por política MFA.' },
  { id: 2, icon: 'fas fa-shield-virus', title: 'Bcrypt policy', detail: 'Rotación de hashes aplicada a usuarios críticos.' },
  { id: 3, icon: 'fas fa-user-slash', title: 'Cuenta suspendida', detail: 'Usuario externo con 5 intentos fallidos consecutivos.' }
]);

watch([() => filters.search, () => filters.role, () => filters.status, pageSize], () => {
  page.value = 1;
});

function initials(name) {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function roleLabel(role) {
  return roles.find((item) => item.value === role)?.label || role;
}

function roleClass(role) {
  return `role-${role}`;
}

function statusClass(status) {
  return status.toLowerCase();
}

function accessForRole(role) {
  return {
    admin: 'Nivel 5 - Root',
    supervisor: 'Nivel 4 - Aprobador',
    forwarder: 'Nivel 3 - Operativo',
    soporte: 'Nivel 2 - Soporte',
    cliente: 'Nivel 1 - Consulta'
  }[role] || 'Nivel 1 - Consulta';
}

function openCreateModal() {
  Object.assign(newUser, { name: '', email: '', role: 'forwarder', company: '' });
  showCreate.value = true;
}

function createUser() {
  const id = Math.max(...users.value.map((user) => user.id)) + 1;
  users.value.unshift({
    id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    company: newUser.company,
    accessLevel: accessForRole(newUser.role),
    createdAt: new Date().toISOString().slice(0, 10),
    status: 'Activo',
    jwtSession: 'Pendiente MFA',
    lastIp: 'Pendiente',
    lastLogin: 'Sin acceso',
    hashPreview: `$2b$10$${Math.random().toString(36).slice(2, 12)}...new`
  });
  recentEvents.value.unshift({
    id: Date.now(),
    icon: 'fas fa-user-plus',
    title: 'Usuario creado',
    detail: `${newUser.email} creado con ${accessForRole(newUser.role)}.`
  });
  showCreate.value = false;
}

function deactivateUser(user) {
  user.status = 'Suspendido';
  user.jwtSession = 'Revocada';
  recentEvents.value.unshift({
    id: Date.now(),
    icon: 'fas fa-user-slash',
    title: 'Cuenta desactivada',
    detail: `${user.email} fue desactivado y sus tokens fueron revocados.`
  });
}

function unlockSession(user) {
  user.status = 'Activo';
  user.jwtSession = 'Validada';
  recentEvents.value.unshift({
    id: Date.now(),
    icon: 'fas fa-key',
    title: 'Sesión JWT desbloqueada',
    detail: `${user.email} recuperó acceso con token renovado.`
  });
}
</script>

<style scoped>
.admin-page {
  min-height: calc(100vh - 5rem);
  position: relative;
  overflow: hidden;
  padding: clamp(1rem, 2vw, 2rem);
  color: #e2e8f0;
  background: radial-gradient(circle at 10% 20%, #0b1120, #030712);
  font-family: Inter, system-ui, sans-serif;
}

.admin-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 75% 20%, rgba(59, 130, 246, 0.18), transparent 34rem),
    radial-gradient(circle at 15% 85%, rgba(14, 165, 233, 0.12), transparent 28rem);
  animation: pulse 8s ease-in-out infinite alternate;
}

@keyframes pulse {
  from { opacity: 0.65; transform: scale(1); }
  to { opacity: 1; transform: scale(1.04); }
}

.admin-shell {
  position: relative;
  z-index: 1;
  max-width: 1280px;
  margin: 0 auto;
}

.hero,
.toolbar,
.data-panel,
.glass-card,
.modal-card,
.audit-drawer,
.audit-strip article {
  border: 1px solid rgba(255, 255, 255, 0.11);
  background: rgba(15, 25, 45, 0.58);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(18px);
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
  padding: 1.5rem;
  border-radius: 1.5rem;
}

.eyebrow {
  display: inline-flex;
  gap: 0.45rem;
  align-items: center;
  margin: 0 0 0.7rem;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.14);
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(2rem, 4vw, 3.6rem);
  line-height: 1;
}

.hero span,
.data-panel__head span,
small {
  color: #94a3b8;
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  border: 0;
  border-radius: 999px;
  padding: 0.85rem 1.15rem;
  color: #fff;
  font-weight: 900;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  box-shadow: 0 12px 30px rgba(59, 130, 246, 0.28);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.glass-card {
  padding: 1.15rem;
  border-radius: 1.25rem;
}

.glass-card i {
  width: 2.6rem;
  height: 2.6rem;
  display: grid;
  place-items: center;
  margin-bottom: 0.8rem;
  border-radius: 0.9rem;
  color: #bfdbfe;
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.95), rgba(59, 130, 246, 0.85));
}

.glass-card strong {
  display: block;
  color: #fff;
  font-size: 1.8rem;
}

.glass-card span {
  color: #94a3b8;
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) repeat(3, minmax(140px, 180px));
  gap: 0.8rem;
  padding: 1rem;
  border-radius: 1.25rem;
  margin-bottom: 1rem;
}

label {
  display: grid;
  gap: 0.35rem;
  color: #bfdbfe;
  font-size: 0.78rem;
  font-weight: 800;
}

.search-box {
  position: relative;
}

.search-box i {
  position: absolute;
  left: 0.9rem;
  bottom: 0.9rem;
  color: #60a5fa;
}

input,
select {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.85rem;
  padding: 0.82rem 0.9rem;
  color: #fff;
  background: rgba(0, 0, 0, 0.28);
}

.search-box input {
  padding-left: 2.4rem;
}

.data-panel {
  border-radius: 1.25rem;
  overflow: hidden;
}

.data-panel__head,
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
}

.data-panel__head strong {
  display: block;
  color: #fff;
}

.hash-pill,
.status-badge,
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.32rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 900;
}

.hash-pill {
  color: #bfdbfe;
  background: rgba(59, 130, 246, 0.14);
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 1060px;
  border-collapse: collapse;
}

th,
td {
  padding: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
}

th {
  color: #93c5fd;
  font-size: 0.72rem;
  text-transform: uppercase;
}

td {
  color: #dbeafe;
}

.identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.identity > span {
  width: 2.4rem;
  height: 2.4rem;
  display: grid;
  place-items: center;
  border-radius: 0.8rem;
  color: #fff;
  background: linear-gradient(135deg, #0f766e, #2563eb);
  font-weight: 900;
}

.identity strong {
  display: block;
  color: #fff;
}

.role-admin { color: #bfdbfe; background: rgba(59, 130, 246, 0.18); }
.role-forwarder { color: #a7f3d0; background: rgba(16, 185, 129, 0.16); }
.role-supervisor { color: #fde68a; background: rgba(245, 158, 11, 0.16); }
.role-cliente { color: #ddd6fe; background: rgba(139, 92, 246, 0.16); }
.role-soporte { color: #fbcfe8; background: rgba(236, 72, 153, 0.16); }
.activo { color: #a7f3d0; background: rgba(16, 185, 129, 0.14); }
.bloqueado { color: #fecaca; background: rgba(239, 68, 68, 0.14); }
.suspendido { color: #fde68a; background: rgba(245, 158, 11, 0.14); }

.row-actions {
  display: flex;
  gap: 0.4rem;
}

.row-actions button,
.pagination button,
.modal-card header button,
.drawer-close {
  width: 2.2rem;
  height: 2.2rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.7rem;
  color: #bfdbfe;
  background: rgba(255, 255, 255, 0.07);
}

.pagination button:disabled {
  opacity: 0.45;
}

.audit-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.audit-strip article {
  display: flex;
  gap: 0.8rem;
  padding: 1rem;
  border-radius: 1rem;
}

.audit-strip i {
  color: #60a5fa;
}

.audit-strip strong {
  display: block;
  color: #fff;
}

.audit-strip span {
  color: #94a3b8;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.72);
}

.modal-card {
  width: min(100%, 520px);
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1.25rem;
}

.modal-card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-card h2,
.audit-drawer h3 {
  margin: 0;
  color: #fff;
}

.bcrypt-preview {
  display: flex;
  gap: 0.75rem;
  padding: 0.9rem;
  border-radius: 0.9rem;
  color: #bfdbfe;
  background: rgba(59, 130, 246, 0.12);
}

.audit-drawer {
  position: fixed;
  z-index: 21;
  right: 1rem;
  top: 6rem;
  width: min(92vw, 360px);
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1.25rem;
}

.drawer-close {
  margin-left: auto;
}

.audit-drawer p,
.audit-drawer span {
  color: #94a3b8;
}

.audit-drawer div {
  display: grid;
  gap: 0.3rem;
}

.audit-drawer strong,
code {
  color: #e0f2fe;
}

@media (max-width: 860px) {
  .toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
