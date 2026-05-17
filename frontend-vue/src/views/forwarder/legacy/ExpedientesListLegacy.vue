<template>
  <div class="expedientes-container">
    <div class="animated-bg"></div>

    <main class="list">
      <!-- Cabecera premium -->
      <header class="list__header">
        <div class="header-info">
          <div class="badge">Gestión de trámites</div>
          <h1>Expedientes aduanales</h1>
          <p>Administre y monitoree todos los expedientes aduaneros</p>
        </div>
        <div class="list__actions">
          <button class="btn-secondary" type="button" @click="$emit('navigate', '/dashboard')">
            <i class="fas fa-chart-line"></i> Dashboard
          </button>
          <button class="btn-primary" type="button" @click="$emit('navigate', '/expedientes/nuevo')">
            <i class="fas fa-plus-circle"></i> Nuevo expediente
          </button>
        </div>
      </header>

      <!-- Filtros mejorados -->
      <section class="list__filters" aria-label="Filtros">
        <div class="search-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input 
            v-model.trim="filters.search" 
            type="search" 
            placeholder="Buscar por código, cliente o régimen..."
            class="search-input"
          />
          <button v-if="filters.search" class="clear-search" @click="filters.search = ''">
            <i class="fas fa-times-circle"></i>
          </button>
        </div>
        <div class="status-filter">
          <i class="fas fa-filter"></i>
          <select v-model="filters.estado">
            <option value="">Todos los estados</option>
            <option v-for="estado in estados" :key="estado" :value="estado">{{ estado }}</option>
          </select>
        </div>
        <button class="refresh-btn" @click="loadExpedientes" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          <span>Actualizar</span>
        </button>
      </section>

      <!-- Mensaje de error -->
      <p v-if="error" class="error-banner">
        <i class="fas fa-exclamation-triangle"></i> {{ error }}
      </p>

      <!-- Lista de expedientes -->
      <section class="list__table" aria-live="polite">
        <!-- Skeleton loader -->
        <div v-if="loading" class="skeleton-list">
          <div v-for="i in 5" :key="i" class="skeleton-card">
            <div class="skeleton-header"></div>
            <div class="skeleton-body"></div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-else-if="filteredExpedientes.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-folder-open"></i>
          </div>
          <h4>No se encontraron expedientes</h4>
          <p>Intenta con otros filtros o crea un nuevo expediente</p>
          <button class="btn-primary small" @click="$emit('navigate', '/expedientes/nuevo')">
            <i class="fas fa-plus"></i> Crear expediente
          </button>
        </div>

        <!-- Tarjetas de expedientes -->
        <div v-else class="expedientes-grid">
          <article v-for="item in filteredExpedientes" :key="item.id" class="expediente-card" @click="$emit('navigate', `/expedientes/${item.id}`)">
            <div class="card-header">
              <div class="card-code">
                <i class="fas fa-hashtag"></i>
                <span>{{ item.codigo }}</span>
              </div>
              <span class="status-pill" :class="statusClass(item.estado)">
                <i :class="statusIcon(item.estado)"></i> {{ formatEstado(item.estado) }}
              </span>
            </div>
            <div class="card-body">
              <div class="info-row">
                <i class="fas fa-building"></i>
                <span class="label">Cliente:</span>
                <span class="value">{{ item.cliente }}</span>
              </div>
              <div class="info-row">
                <i class="fas fa-exchange-alt"></i>
                <span class="label">Operación:</span>
                <span class="value">{{ item.tipo_operacion }}</span>
              </div>
              <div class="info-row">
                <i class="fas fa-flag-checkered"></i>
                <span class="label">Régimen:</span>
                <span class="value">{{ item.regimen }}</span>
              </div>
              <div class="info-row" v-if="item.fecha_creacion">
                <i class="fas fa-calendar-alt"></i>
                <span class="label">Fecha:</span>
                <span class="value">{{ formatDate(item.fecha_creacion) }}</span>
              </div>
            </div>
            <div class="card-footer">
              <span class="action-link">Ver detalles <i class="fas fa-chevron-right"></i></span>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { api } from '../../../services/api';

defineEmits(['navigate']);

const loading = ref(false);
const error = ref('');
const expedientes = ref([]);
const estados = ['BORRADOR', 'EN_REVISION', 'OBSERVADO', 'APROBADO', 'RECHAZADO', 'FINALIZADO'];
const filters = reactive({
  search: '',
  estado: ''
});

const filteredExpedientes = computed(() => {
  const term = filters.search.toLowerCase();
  return expedientes.value.filter((item) => {
    const matchesText = [item.codigo, item.cliente, item.regimen].some((value) =>
      String(value || '').toLowerCase().includes(term)
    );
    const matchesStatus = !filters.estado || item.estado === filters.estado;
    return matchesText && matchesStatus;
  });
});

function statusClass(estado) {
  const map = {
    'BORRADOR': 'status-draft',
    'EN_REVISION': 'status-review',
    'OBSERVADO': 'status-observed',
    'APROBADO': 'status-approved',
    'RECHAZADO': 'status-rejected',
    'FINALIZADO': 'status-finalized'
  };
  return map[estado] || 'status-default';
}

function statusIcon(estado) {
  const map = {
    'BORRADOR': 'fas fa-pen',
    'EN_REVISION': 'fas fa-clock',
    'OBSERVADO': 'fas fa-eye-slash',
    'APROBADO': 'fas fa-check-circle',
    'RECHAZADO': 'fas fa-times-circle',
    'FINALIZADO': 'fas fa-flag-checkered'
  };
  return map[estado] || 'fas fa-info-circle';
}

function formatEstado(estado) {
  const map = {
    'BORRADOR': 'Borrador',
    'EN_REVISION': 'En revisión',
    'OBSERVADO': 'Observado',
    'APROBADO': 'Aprobado',
    'RECHAZADO': 'Rechazado',
    'FINALIZADO': 'Finalizado'
  };
  return map[estado] || estado;
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function loadExpedientes() {
  loading.value = true;
  error.value = '';
  try {
    expedientes.value = await api('/expedientes');
  } catch (requestError) {
    error.value = requestError.message || 'Error al cargar los expedientes.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadExpedientes);
</script>

<style scoped>
/* ----- FONDO Y CONTENEDOR ----- */
.expedientes-container {
  min-height: 100vh;
  background: radial-gradient(circle at 10% 20%, #0B1120, #030712);
  position: relative;
  padding: 2rem;
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

.list {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* ----- CABECERA PREMIUM ----- */
.list__header {
  background: rgba(15, 25, 45, 0.6);
  backdrop-filter: blur(16px);
  border-radius: 2rem;
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.header-info .badge {
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

.header-info h1 {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem 0;
}

.header-info p {
  color: #94A3B8;
  margin: 0;
}

.list__actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-secondary, .btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1.5rem;
  border-radius: 2rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #CBD5E1;
}

.btn-secondary:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3B82F6;
  transform: translateY(-2px);
}

.btn-primary {
  background: linear-gradient(135deg, #1E3A8A, #3B82F6);
  color: white;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.btn-primary.small {
  padding: 0.5rem 1.2rem;
  font-size: 0.8rem;
}

/* ----- FILTROS MEJORADOS ----- */
.list__filters {
  background: rgba(15, 25, 45, 0.5);
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.2rem 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.search-wrapper {
  position: relative;
  flex: 2;
  min-width: 250px;
}

.search-icon {
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
  padding: 0.8rem 1rem 0.8rem 2.8rem;
  color: white;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  background: rgba(0, 0, 0, 0.7);
}

.clear-search {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
}

.clear-search:hover { color: #EF4444; }

.status-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 2rem;
  padding: 0.2rem 0.5rem 0.2rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-filter i {
  color: #5A6E7A;
}

.status-filter select {
  background: transparent;
  border: none;
  padding: 0.6rem 1rem 0.6rem 0.5rem;
  color: white;
  font-size: 0.85rem;
  cursor: pointer;
}

.status-filter select:focus {
  outline: none;
}

.refresh-btn {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 2rem;
  padding: 0.7rem 1.5rem;
  color: #3B82F6;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3B82F6;
  transform: scale(1.02);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mensaje de error */
.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border-left: 3px solid #EF4444;
  border-radius: 1rem;
  padding: 1rem;
  margin-bottom: 2rem;
  color: #FCA5A5;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

/* ----- TABLA DE EXPEDIENTES (TARJETAS PREMIUM) ----- */
.expedientes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;
}

.expediente-card {
  background: rgba(15, 25, 45, 0.5);
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.expediente-card:hover {
  transform: translateY(-5px);
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 20px 30px -12px rgba(0, 0, 0, 0.5);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.2rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.card-code {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
  color: #60A5FA;
}

.card-code i {
  font-size: 1rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.8rem;
  border-radius: 2rem;
  font-size: 0.7rem;
  font-weight: 600;
}

.status-draft { background: rgba(100, 116, 139, 0.2); color: #CBD5E1; border: 1px solid rgba(100,116,139,0.3); }
.status-review { background: rgba(245, 158, 11, 0.15); color: #FCD34D; border: 1px solid rgba(245,158,11,0.3); }
.status-observed { background: rgba(239, 68, 68, 0.15); color: #FCA5A5; border: 1px solid rgba(239,68,68,0.3); }
.status-approved { background: rgba(16, 185, 129, 0.15); color: #6EE7B7; border: 1px solid rgba(16,185,129,0.3); }
.status-rejected { background: rgba(239, 68, 68, 0.2); color: #FCA5A5; border: 1px solid rgba(239,68,68,0.4); }
.status-finalized { background: rgba(59, 130, 246, 0.15); color: #93C5FD; border: 1px solid rgba(59,130,246,0.3); }

.card-body {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
}

.info-row i {
  width: 1.2rem;
  color: #3B82F6;
}

.info-row .label {
  color: #94A3B8;
  min-width: 70px;
}

.info-row .value {
  color: white;
  font-weight: 500;
}

.card-footer {
  padding: 0.8rem 1.2rem 1.2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  text-align: right;
}

.action-link {
  color: #3B82F6;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: gap 0.2s;
}

.expediente-card:hover .action-link {
  gap: 0.7rem;
}

/* Skeleton loader */
.skeleton-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;
}

.skeleton-card {
  background: rgba(15, 25, 45, 0.5);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.skeleton-header {
  height: 60px;
  background: linear-gradient(90deg, #1e293b, #334155, #1e293b);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-body {
  height: 120px;
  margin: 1rem;
  background: linear-gradient(90deg, #1e293b, #334155, #1e293b);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.8rem;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Estado vacío */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(15, 25, 45, 0.5);
  border-radius: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.empty-icon {
  font-size: 4rem;
  color: #3B82F6;
  opacity: 0.4;
  margin-bottom: 1rem;
}

.empty-state h4 {
  color: white;
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #94A3B8;
  margin-bottom: 1.5rem;
}

/* Responsive */
@media (max-width: 900px) {
  .expedientes-container {
    padding: 1rem;
  }
  
  .list__header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .expedientes-grid,
  .skeleton-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .list__filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-wrapper {
    width: 100%;
  }
  
  .status-filter {
    justify-content: space-between;
  }
  
  .info-row {
    flex-wrap: wrap;
  }
  
  .info-row .label {
    min-width: auto;
  }
}
</style>