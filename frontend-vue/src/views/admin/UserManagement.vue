<template>
  <div class="user-management">
    <div class="animated-bg"></div>

    <div class="page-header">
      <div>
        <div class="badge">Administración del Sistema</div>
        <h1>Usuarios y roles</h1>
        <p>Gestiona los perfiles de acceso al sistema DigiAduana</p>
      </div>
      <button class="btn-primary" @click="openAddUserModal">
        <i class="fas fa-user-plus"></i> Nuevo usuario
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-users"></i></div>
        <div class="stat-info">
          <span class="stat-label">Usuarios internos</span>
          <strong class="stat-value">{{ internalUsersCount }}</strong>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-user-friends"></i></div>
        <div class="stat-info">
          <span class="stat-label">Clientes</span>
          <strong class="stat-value">{{ clientsCount }}</strong>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-tag"></i></div>
        <div class="stat-info">
          <span class="stat-label">Roles activos</span>
          <strong class="stat-value">{{ activeRolesCount }}</strong>
        </div>
      </div>
    </div>

    <div class="filters-bar">
      <div class="search-wrapper">
        <i class="fas fa-search"></i>
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar por nombre, email o rol..."
          class="search-input"
        />
      </div>
      <div class="role-filter">
        <i class="fas fa-filter"></i>
        <select v-model="roleFilter">
          <option value="">Todos los roles</option>
          <option value="admin">Administrador</option>
          <option value="forwarder">Freight Forwarder</option>
          <option value="supervisor">Supervisor</option>
          <option value="cliente">Cliente</option>
          <option value="soporte">Soporte técnico</option>
        </select>
      </div>
      <div class="status-filter">
        <i class="fas fa-circle"></i>
        <select v-model="statusFilter">
          <option value="">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>
    </div>

    <div class="users-table-container">
      <div v-if="loading" class="skeleton-list">
        <div v-for="i in 5" :key="i" class="skeleton-row"></div>
      </div>
      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        <i class="fas fa-user-slash"></i>
        <h4>No hay usuarios</h4>
        <p>No se encontraron usuarios con los filtros actuales.</p>
      </div>
      <div v-else class="users-table">
        <div class="table-header">
          <div>Usuario</div>
          <div>Email</div>
          <div>Rol</div>
          <div>Estado</div>
          <div>Acciones</div>
        </div>
        <div v-for="user in filteredUsers" :key="user.id" class="table-row">
          <div class="user-cell">
            <div class="user-avatar">{{ user.nombre.charAt(0) }}</div>
            <span>{{ user.nombre }}</span>
          </div>
          <div class="email-cell">{{ user.correo }}</div>
          <div class="role-cell">
            <span class="role-badge" :class="getRoleClass(user.rol)">
              <i :class="getRoleIcon(user.rol)"></i> {{ formatRol(user.rol) }}
            </span>
          </div>
          <div class="status-cell">
            <span class="status-badge" :class="isActive(user) ? 'status-active' : 'status-inactive'">
              <i :class="isActive(user) ? 'fas fa-check-circle' : 'fas fa-ban'"></i>
              {{ isActive(user) ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
          <div class="actions-cell">
            <button class="action-icon" @click="openEditRoleModal(user)" title="Cambiar rol">
              <i class="fas fa-user-tag"></i>
            </button>
            <button class="action-icon" @click="toggleUserStatus(user)" :title="isActive(user) ? 'Desactivar' : 'Activar'">
              <i :class="isActive(user) ? 'fas fa-ban' : 'fas fa-check-circle'"></i>
            </button>
            <button class="action-icon danger" @click="confirmDelete(user)" title="Eliminar">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal">
        <div class="modal-header">
          <h3><i class="fas fa-user-plus"></i> Nuevo usuario</h3>
          <button class="close-btn" @click="closeModals"><i class="fas fa-times"></i></button>
        </div>
        <form @submit.prevent="addUser">
          <div class="form-group">
            <label><i class="fas fa-user"></i> Nombre completo</label>
            <input v-model="newUser.nombre" type="text" required placeholder="Ej: Juan Pérez" />
          </div>
          <div class="form-group">
            <label><i class="fas fa-envelope"></i> Correo electrónico</label>
            <input v-model="newUser.correo" type="email" required placeholder="usuario@digiaduana.com" />
          </div>
          <div class="form-group">
            <label><i class="fas fa-lock"></i> Contraseña</label>
            <input v-model="newUser.password" type="password" required placeholder="Mínimo 6 caracteres" />
          </div>
          <div class="form-group">
            <label><i class="fas fa-tag"></i> Rol</label>
            <select v-model="newUser.rol" required>
              <option value="">Seleccionar rol</option>
              <option v-for="role in roles" :key="role.id" :value="role.actor">{{ roleLabel(role) }}</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeModals">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="addingUser">
              {{ addingUser ? 'Creando...' : 'Crear usuario' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showRoleModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal small">
        <div class="modal-header">
          <h3><i class="fas fa-exchange-alt"></i> Cambiar rol</h3>
          <button class="close-btn" @click="closeModals"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p>Usuario: <strong>{{ selectedUser?.nombre }}</strong></p>
          <div class="form-group">
            <label>Nuevo rol</label>
            <select v-model="newRole">
              <option v-for="role in roles" :key="role.id" :value="role.actor">{{ roleLabel(role) }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModals">Cancelar</button>
          <button class="btn-primary" @click="updateRole" :disabled="updatingRole">
            {{ updatingRole ? 'Guardando...' : 'Guardar cambio' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="closeModals">
      <div class="modal small">
        <div class="modal-header warning">
          <h3><i class="fas fa-exclamation-triangle"></i> Confirmar eliminación</h3>
        </div>
        <div class="modal-body">
          <p>¿Estás seguro de eliminar al usuario <strong>{{ selectedUser?.nombre }}</strong>?</p>
          <p class="warning-text">Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModals">Cancelar</button>
          <button class="btn-danger" @click="deleteUser" :disabled="deletingUser">
            {{ deletingUser ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../../services/api';

// Estado
const loading = ref(false);
const users = ref([]);
const roles = ref([
  { id: 1, actor: 'admin', nombre: 'ADMINISTRADOR' },
  { id: 2, actor: 'supervisor', nombre: 'SUPERVISOR' },
  { id: 3, actor: 'forwarder', nombre: 'FREIGHT_FORWARDER' },
  { id: 4, actor: 'cliente', nombre: 'CLIENTE' },
  { id: 5, actor: 'soporte', nombre: 'SOPORTE_TECNICO' }
]);
const searchTerm = ref('');
const roleFilter = ref('');
const statusFilter = ref('');

// Modales
const showAddModal = ref(false);
const showRoleModal = ref(false);
const showDeleteConfirm = ref(false);
const selectedUser = ref(null);
const newRole = ref('');
const addingUser = ref(false);
const updatingRole = ref(false);
const deletingUser = ref(false);

// Formulario nuevo usuario
const newUser = ref({
  nombre: '',
  correo: '',
  password: '',
  rol: ''
});

// Computed para conteos
const internalUsersCount = computed(() => {
  return users.value.filter(u => u.rol !== 'cliente' && isActive(u)).length;
});
const clientsCount = computed(() => {
  return users.value.filter(u => u.rol === 'cliente' && isActive(u)).length;
});
const activeRolesCount = computed(() => {
  const activeRoleNames = new Set(users.value.filter(isActive).map(u => u.rol));
  return activeRoleNames.size;
});

// Filtrado de usuarios
const filteredUsers = computed(() => {
  let result = users.value;
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    result = result.filter(u =>
      u.nombre.toLowerCase().includes(term) ||
      u.correo.toLowerCase().includes(term) ||
      u.rol.toLowerCase().includes(term)
    );
  }
  if (roleFilter.value) {
    result = result.filter(u => u.rol === roleFilter.value);
  }
  if (statusFilter.value) {
    result = result.filter(u => normalizeStatus(u.estado) === statusFilter.value);
  }
  return result;
});

// Funciones auxiliares
function normalizeRole(rol) {
  const key = String(rol || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const map = {
    administrador: 'admin',
    freight_forwarder: 'forwarder',
    soporte_tecnico: 'soporte'
  };
  return map[key] || key;
}

function normalizeStatus(estado) {
  return String(estado || '').toLowerCase() === 'activo' ? 'activo' : 'inactivo';
}

function isActive(user) {
  return normalizeStatus(user.estado) === 'activo';
}

function normalizeUser(user) {
  return {
    ...user,
    rol: user.actor || normalizeRole(user.rol),
    estado: normalizeStatus(user.estado)
  };
}

function roleLabel(role) {
  return formatRol(role.actor || normalizeRole(role.nombre));
}

function formatRol(rol) {
  const normalized = normalizeRole(rol);
  const map = {
    admin: 'Administrador',
    forwarder: 'Freight Forwarder',
    supervisor: 'Supervisor',
    cliente: 'Cliente',
    soporte: 'Soporte técnico'
  };
  return map[normalized] || rol;
}

function getRoleClass(rol) {
  const normalized = normalizeRole(rol);
  const map = {
    admin: 'role-admin',
    forwarder: 'role-forwarder',
    supervisor: 'role-supervisor',
    cliente: 'role-cliente',
    soporte: 'role-soporte'
  };
  return map[normalized] || 'role-default';
}

function getRoleIcon(rol) {
  const normalized = normalizeRole(rol);
  const map = {
    admin: 'fas fa-crown',
    forwarder: 'fas fa-ship',
    supervisor: 'fas fa-chart-line',
    cliente: 'fas fa-user',
    soporte: 'fas fa-headset'
  };
  return map[normalized] || 'fas fa-user';
}

async function loadRoles() {
  try {
    roles.value = await api('/usuarios/roles');
  } catch (error) {
    console.error('Error al cargar roles:', error);
  }
}

// Cargar usuarios desde API
async function loadUsers() {
  loading.value = true;
  try {
    const response = await api('/usuarios');
    users.value = response.map(normalizeUser);
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    // Datos mock en caso de error
    users.value = [
      { id: 1, nombre: 'Admin Principal', correo: 'admin@digiaduana.com', rol: 'admin', estado: 'activo' },
      { id: 2, nombre: 'Carlos López', correo: 'carlos@forwarder.com', rol: 'forwarder', estado: 'activo' },
      { id: 3, nombre: 'María García', correo: 'maria@supervisor.com', rol: 'supervisor', estado: 'activo' },
      { id: 4, nombre: 'Ana Martínez', correo: 'ana@cliente.com', rol: 'cliente', estado: 'inactivo' },
      { id: 5, nombre: 'Soporte Tec', correo: 'soporte@digiaduana.com', rol: 'soporte', estado: 'activo' }
    ];
  } finally {
    loading.value = false;
  }
}

// Agregar usuario
async function addUser() {
  if (!newUser.value.nombre || !newUser.value.correo || !newUser.value.password || !newUser.value.rol) {
    alert('Por favor completa todos los campos');
    return;
  }
  addingUser.value = true;
  try {
    const created = await api('/usuarios', {
      method: 'POST',
      body: JSON.stringify(newUser.value)
    });
    users.value.unshift(normalizeUser({ ...created, rol: newUser.value.rol }));
    closeModals();
    newUser.value = { nombre: '', correo: '', password: '', rol: '' };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    alert('No se pudo crear el usuario');
  } finally {
    addingUser.value = false;
  }
}

// Abrir modal para cambiar rol
function openEditRoleModal(user) {
  selectedUser.value = user;
  newRole.value = user.rol;
  showRoleModal.value = true;
}

// Actualizar rol
async function updateRole() {
  if (!selectedUser.value) return;
  updatingRole.value = true;
  try {
    await api(`/usuarios/${selectedUser.value.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ rol: newRole.value })
    });
    selectedUser.value.rol = newRole.value;
    closeModals();
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    alert('No se pudo cambiar el rol');
  } finally {
    updatingRole.value = false;
  }
}

// Activar/Desactivar usuario
async function toggleUserStatus(user) {
  const newStatus = isActive(user) ? 'INACTIVO' : 'ACTIVO';
  try {
    await api(`/usuarios/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: newStatus })
    });
    user.estado = normalizeStatus(newStatus);
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    alert('No se pudo cambiar el estado del usuario');
  }
}

// Confirmar eliminación
function confirmDelete(user) {
  selectedUser.value = user;
  showDeleteConfirm.value = true;
}

// Eliminar usuario
async function deleteUser() {
  if (!selectedUser.value) return;
  deletingUser.value = true;
  try {
    await api(`/usuarios/${selectedUser.value.id}`, { method: 'DELETE' });
    const index = users.value.findIndex(u => u.id === selectedUser.value.id);
    if (index !== -1) users.value.splice(index, 1);
    closeModals();
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    alert('No se pudo eliminar el usuario');
  } finally {
    deletingUser.value = false;
  }
}

// Abrir modal de agregar
function openAddUserModal() {
  showAddModal.value = true;
}

// Cerrar todos los modales
function closeModals() {
  showAddModal.value = false;
  showRoleModal.value = false;
  showDeleteConfirm.value = false;
  selectedUser.value = null;
  newRole.value = '';
}

onMounted(() => {
  loadRoles();
  loadUsers();
});
</script>

<style scoped>
/* ----- FONDO Y CONTENEDOR ----- */
.user-management {
  width: 100%; /* GARANTIZADO 100% de ancho */
  min-height: 100vh;
  background: radial-gradient(circle at 10% 20%, #0B1120, #030712);
  position: relative;
  padding: 2rem;
  font-family: 'Inter', sans-serif;
  color: #E2E8F0;
  box-sizing: border-box;
}

.animated-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: radial-gradient(circle at 70% 30%, rgba(59, 130, 246, 0.08), transparent 70%);
  animation: pulseBg 8s infinite alternate;
}

@keyframes pulseBg {
  0% { opacity: 0.3; transform: scale(1); }
  100% { opacity: 0.7; transform: scale(1.05); }
}

/* ----- HEADER ----- */
.page-header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.badge {
  display: inline-block;
  background: rgba(59, 130, 246, 0.2);
  padding: 0.25rem 1rem;
  border-radius: 2rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #3B82F6;
  margin-bottom: 0.75rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem 0;
}

.page-header p {
  color: #94A3B8;
  margin: 0;
}

.btn-primary {
  background: linear-gradient(135deg, #1E3A8A, #3B82F6);
  border: none;
  border-radius: 2rem;
  padding: 0.7rem 1.5rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  transition: all 0.2s;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 2rem;
  padding: 0.6rem 1.2rem;
  color: #CBD5E1;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3B82F6;
}

.btn-danger {
  background: rgba(239, 68, 68, 0.8);
  border: none;
  border-radius: 2rem;
  padding: 0.6rem 1.2rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #EF4444;
  transform: translateY(-2px);
}

/* ----- TARJETAS DE ESTADÍSTICAS ----- */
.stats-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.2rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(15, 25, 45, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #3B82F6;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: white;
  line-height: 1;
}

/* ----- FILTROS ----- */
.filters-bar {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  background: rgba(15, 25, 45, 0.4);
  backdrop-filter: blur(8px);
  border-radius: 1.5rem;
  padding: 1rem;
}

.search-wrapper {
  flex: 2;
  min-width: 200px;
  position: relative;
}

.search-wrapper i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #5A6E7A;
}

.search-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2rem;
  padding: 0.7rem 1rem 0.7rem 2.5rem;
  color: white;
  font-size: 0.9rem;
}

.search-input:focus {
  outline: none;
  border-color: #3B82F6;
}

.role-filter, .status-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 2rem;
  padding: 0.2rem 0.5rem 0.2rem 1rem;
}

.role-filter i, .status-filter i {
  color: #5A6E7A;
}

select {
  background: transparent;
  border: none;
  padding: 0.5rem;
  color: white;
  cursor: pointer;
}

select:focus {
  outline: none;
}

/* ----- TABLA DE USUARIOS ----- */
.users-table-container {
  position: relative;
  z-index: 1;
  background: rgba(15, 25, 45, 0.4);
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
}

.users-table {
  min-width: 700px;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 2fr 1.2fr 1fr 1.5fr;
  gap: 1rem;
  padding: 1rem 1.2rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94A3B8;
  font-weight: 600;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 2fr 1.2fr 1fr 1.5fr;
  gap: 1rem;
  padding: 0.8rem 1.2rem;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.2s;
}

.table-row:hover {
  background: rgba(59, 130, 246, 0.1);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #1E3A8A, #3B82F6);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
  color: white;
}

.email-cell {
  color: #CBD5E1;
  word-break: break-all;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.8rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.role-admin { background: rgba(59, 130, 246, 0.2); color: #93C5FD; }
.role-forwarder { background: rgba(16, 185, 129, 0.2); color: #6EE7B7; }
.role-supervisor { background: rgba(245, 158, 11, 0.2); color: #FCD34D; }
.role-cliente { background: rgba(139, 92, 246, 0.2); color: #C4B5FD; }
.role-soporte { background: rgba(236, 72, 153, 0.2); color: #F9A8D4; }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.7rem;
  border-radius: 2rem;
  font-size: 0.7rem;
  font-weight: 600;
}

.status-active {
  background: rgba(16, 185, 129, 0.15);
  color: #6EE7B7;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-inactive {
  background: rgba(239, 68, 68, 0.15);
  color: #FCA5A5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.action-icon {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 0.7rem;
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.2s;
}

.action-icon:hover {
  background: #3B82F6;
  color: white;
  transform: translateY(-2px);
}

.action-icon.danger:hover {
  background: #EF4444;
}

/* ----- MODALES ----- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: rgba(15, 25, 45, 0.95);
  backdrop-filter: blur(16px);
  border-radius: 1.5rem;
  border: 1px solid rgba(59, 130, 246, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal.small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.close-btn {
  background: none;
  border: none;
  color: #94A3B8;
  font-size: 1.2rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #CBD5E1;
  margin-bottom: 0.3rem;
}

.form-group input, .form-group select {
  width: 100%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 0.7rem 1rem;
  color: white;
  font-size: 0.9rem;
}

.form-group input:focus, .form-group select:focus {
  outline: none;
  border-color: #3B82F6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.warning-text {
  color: #FCA5A5;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

/* Skeleton y estados vacíos */
.skeleton-list {
  padding: 1rem;
}
.skeleton-row {
  height: 60px;
  background: linear-gradient(90deg, #1e293b, #334155, #1e293b);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 1rem;
  margin-bottom: 0.5rem;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #94A3B8;
}
.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}
.empty-state h4 {
  color: white;
  margin-bottom: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .user-management {
    padding: 1rem;
  }
  .table-header {
    display: none;
  }
  .table-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    margin-bottom: 0.5rem;
  }
  .table-row > div {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  .table-row > div::before {
    content: attr(data-label);
    font-weight: 600;
    color: #94A3B8;
  }
  .user-cell::before { content: "Usuario"; }
  .email-cell::before { content: "Email"; }
  .role-cell::before { content: "Rol"; }
  .status-cell::before { content: "Estado"; }
  .actions-cell::before { content: "Acciones"; }
  .actions-cell {
    justify-content: flex-end;
  }
  .filters-bar {
    flex-direction: column;
  }
}
</style>
