<template>
  <div class="app-dashboard">
    <!-- Sidebar mejorada con más espacio -->
    <aside class="sidebar">
      <div class="logo-area">
        <div class="logo-icon">DA</div>
        <span class="logo-text">DigiAduana</span>
      </div>
      <nav class="sidebar-nav">
        <a href="#" class="nav-item active" @click.prevent>
          <i class="fas fa-tachometer-alt"></i> Dashboard
        </a>
        <a href="#" class="nav-item" @click.prevent="$emit('navigate', '/expedientes')">
          <i class="fas fa-folder-tree"></i> Expedientes
        </a>
        <a href="#" class="nav-item" @click.prevent="$emit('navigate', '/expedientes/nuevo')">
          <i class="fas fa-plus-circle"></i> Nuevo trámite
        </a>
        <a href="#" class="nav-item" @click.prevent>
          <i class="fas fa-chart-line"></i> Reportes
        </a>
        <a href="#" class="nav-item" @click.prevent>
          <i class="fas fa-cog"></i> Configuración
        </a>
      </nav>
      <div class="user-info">
        <div class="avatar">{{ userInitials }}</div>
        <div>
          <p class="user-name">{{ userName }}</p>
          <p class="user-role">{{ userRole }}</p>
        </div>
      </div>
    </aside>

    <!-- Main content con más padding -->
    <main class="main-content">
      <div class="top-bar">
        <div class="welcome">
          <h1>Panel de control</h1>
          <p>Bienvenido de vuelta, {{ userName }} · {{ currentDate }}</p>
        </div>
        <div class="actions">
          <button class="icon-btn"><i class="fas fa-bell"></i><span class="badge">3</span></button>
          <button class="icon-btn"><i class="fas fa-envelope"></i></button>
          <button class="icon-btn"><i class="fas fa-moon"></i></button>
        </div>
      </div>

      <p v-if="error" class="error-banner"><i class="fas fa-exclamation-triangle"></i> {{ error }}</p>

      <!-- Métricas con más espacio y animaciones -->
      <div class="metrics-grid">
        <div v-for="metric in metrics" :key="metric.label" class="metric-card" :style="{ '--accent': metric.accent }">
          <div class="metric-icon">
            <i :class="metric.icon"></i>
          </div>
          <div class="metric-details">
            <span class="metric-label">{{ metric.label }}</span>
            <span class="metric-value">{{ metric.value }}</span>
            <span class="metric-trend" v-if="metric.trend">
              <i :class="metric.trendIcon"></i> {{ metric.trend }}
            </span>
          </div>
          <svg class="metric-bg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="6"/>
            <circle cx="50" cy="50" r="45" fill="none" :stroke="metric.accent" stroke-width="6"
                    stroke-dasharray="283" :stroke-dashoffset="283 * (1 - metric.progress)"
                    transform="rotate(-90 50 50)"/>
          </svg>
        </div>
      </div>

      <!-- Fila de mapas y gráfico con mejor espaciado -->
      <div class="row-split">
        <div class="card map-card">
          <div class="card-header">
            <h3><i class="fas fa-map-marked-alt"></i> Rastreo de contenedores activos</h3>
            <span class="badge live">LIVE</span>
          </div>
          <div id="trackingMap" class="map-container"></div>
          <div class="map-footer">
            <i class="fas fa-ship"></i> MSC TARANTO · ETA: 24/05/2026
            <i class="fas fa-truck"></i> CMA CGM · En tránsito
          </div>
        </div>

        <div class="card activity-card">
          <div class="card-header">
            <h3><i class="fas fa-chart-line"></i> Flujo de operaciones</h3>
            <div class="chart-controls">
              <select v-model="chartRange" class="chart-range">
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
              </select>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="flowChart" width="500" height="250"></canvas>
          </div>
          <div class="chart-legend">
            <span><i class="fas fa-chart-line"></i> Expedientes creados</span>
          </div>
        </div>
      </div>

      <!-- ========== SECCIÓN EXPEDIENTES RECIENTES (totalmente mejorada) ========== -->
      <div class="card full-width">
        <div class="card-header">
          <h3><i class="fas fa-file-signature"></i> Expedientes recientes</h3>
          <div class="filters-container">
            <!-- Búsqueda mejorada -->
            <div class="search-wrapper">
              <i class="fas fa-search search-icon"></i>
              <input 
                type="text" 
                v-model="searchTerm" 
                placeholder="Buscar por código o cliente..." 
                class="search-input-premium"
              />
              <button v-if="searchTerm" class="clear-search" @click="searchTerm = ''">
                <i class="fas fa-times-circle"></i>
              </button>
            </div>
            
            <!-- Filtros tipo chips con más espacio -->
            <div class="status-chips">
              <button 
                v-for="state in statusOptions" 
                :key="state.value"
                class="chip premium"
                :class="{ active: statusFilter === state.value, [state.color]: statusFilter === state.value }"
                @click="statusFilter = state.value"
              >
                <i :class="state.icon"></i> {{ state.label }}
              </button>
            </div>
            
            <!-- Botón refrescar mejorado -->
            <button class="refresh-premium" @click="loadData" :disabled="loading">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
              <span>{{ loading ? 'Cargando...' : 'Actualizar' }}</span>
            </button>
          </div>
        </div>

        <!-- Skeleton loaders mejorados -->
        <div v-if="loading" class="skeleton-premium">
          <div v-for="i in 5" :key="i" class="skeleton-row">
            <div class="skeleton-cell"></div>
            <div class="skeleton-cell"></div>
            <div class="skeleton-cell"></div>
            <div class="skeleton-cell"></div>
            <div class="skeleton-cell"></div>
            <div class="skeleton-cell"></div>
          </div>
        </div>

        <!-- Estado vacío atractivo -->
        <div v-else-if="filteredExpedientes.length === 0" class="empty-state-premium">
          <div class="empty-icon">
            <i class="fas fa-search"></i>
          </div>
          <h4>No se encontraron expedientes</h4>
          <p>Intenta con otros filtros o palabras clave</p>
          <button class="clear-filters-btn" @click="searchTerm = ''; statusFilter = ''">
            <i class="fas fa-eraser"></i> Limpiar filtros
          </button>
        </div>

        <!-- Tabla premium con más altura y mejor legibilidad -->
        <div v-else class="expedientes-table-premium">
          <div class="table-header">
            <div><i class="fas fa-hashtag"></i> Código</div>
            <div><i class="fas fa-building"></i> Cliente</div>
            <div><i class="fas fa-truck"></i> Tipo</div>
            <div><i class="fas fa-flag-checkered"></i> Estado</div>
            <div><i class="fas fa-calendar"></i> Fecha</div>
            <div><i class="fas fa-cog"></i> Acciones</div>
          </div>
          
          <div 
            v-for="item in filteredExpedientes" 
            :key="item.id" 
            class="table-row-premium"
          >
            <div class="cell-code" data-label="Código">
              <span class="code-badge">{{ item.codigo }}</span>
            </div>
            <div class="cell-client" data-label="Cliente">
              <div class="client-avatar">{{ item.cliente.charAt(0) }}</div>
              <span>{{ item.cliente }}</span>
            </div>
            <div class="cell-type" data-label="Tipo">
              <span class="type-badge" :class="item.tipo_operacion === 'Importación' ? 'import' : 'export'">
                <i :class="item.tipo_icon"></i> {{ item.tipo_operacion }}
              </span>
            </div>
            <div class="cell-status" data-label="Estado">
              <span class="status-pill premium" :class="statusClass(item.estado)">
                <i :class="statusIcon(item.estado)"></i> {{ item.estado }}
              </span>
            </div>
            <div class="cell-date" data-label="Fecha">
              <i class="fas fa-calendar-alt"></i> {{ formatDate(item.fecha_creacion) }}
            </div>
            <div class="cell-actions" data-label="Acciones">
              <button class="action-icon" @click="$emit('navigate', `/expedientes/${item.id}`)" title="Ver detalle">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-icon" @click="$emit('navigate', `/expedientes/${item.id}/seguimiento`)" title="Seguimiento">
                <i class="fas fa-chart-line"></i>
              </button>
              <button class="action-icon" title="Descargar PDF">
                <i class="fas fa-download"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="card-footer" v-if="recentExpedientes.length > 6">
          <button class="link-btn" @click="$emit('navigate', '/expedientes')">
            Ver todos los expedientes <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- Integraciones externas mejoradas: más espacio y diseño de tarjetas -->
      <div class="integrations-row">
        <div class="integration-card" v-for="int in integrationsList" :key="int.name">
          <div class="integration-icon" :class="{ active: int.status }">
            <i :class="int.icon"></i>
          </div>
          <div class="integration-info">
            <h4>{{ int.name }}</h4>
            <span class="status-badge" :class="int.status ? 'online' : 'offline'">
              {{ int.status ? 'Conectado' : 'Desconectado' }}
            </span>
          </div>
          <div class="ping" :class="{ active: int.status }"></div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { api, getStoredUser } from '../services/api';
import Chart from 'chart.js/auto';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

defineEmits(['navigate']);

const loading = ref(false);
const error = ref('');
const summary = ref({ expedientes: {}, documentos: {}, dte: {} });
const recentExpedientes = ref([]);
const searchTerm = ref('');
const statusFilter = ref('');
const chartRange = ref('7');
let chartInstance = null;
let mapInstance = null;

const user = computed(() => getStoredUser() || {});
const userName = computed(() => user.value.nombre || 'Usuario');
const userRole = computed(() => user.value.rol || 'Sin rol');
const userInitials = computed(() => userName.value.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2));
const currentDate = computed(() => new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

const metrics = computed(() => [
  { label: 'Expedientes', value: summary.value.expedientes?.total || 0, icon: 'fas fa-folder-open', accent: '#3b82f6', progress: 0.7, trend: '+12%', trendIcon: 'fas fa-arrow-up' },
  { label: 'En revisión', value: summary.value.expedientes?.en_revision || 0, icon: 'fas fa-clock', accent: '#f59e0b', progress: 0.4, trend: '-3%', trendIcon: 'fas fa-arrow-down' },
  { label: 'Docs pendientes', value: summary.value.documentos?.pendientes || 0, icon: 'fas fa-file-pdf', accent: '#ef4444', progress: 0.2 },
  { label: 'DTE validados', value: summary.value.dte?.validados || 0, icon: 'fas fa-check-circle', accent: '#10b981', progress: 0.85, trend: '+8%', trendIcon: 'fas fa-arrow-up' }
]);

const integrationsList = ref([
  { name: 'Ministerio de Hacienda', icon: 'fas fa-building', status: true },
  { name: 'Sistema Navieras API', icon: 'fas fa-ship', status: true },
  { name: 'Aerolíneas Tracking', icon: 'fas fa-plane', status: false },
  { name: 'Banco Central', icon: 'fas fa-university', status: true }
]);

const statusOptions = [
  { value: '', label: 'Todos', icon: 'fas fa-list', color: '' },
  { value: 'Registrado', label: 'Registrado', icon: 'fas fa-edit', color: 'chip-info' },
  { value: 'En Auditoría', label: 'Auditoría', icon: 'fas fa-search', color: 'chip-warning' },
  { value: 'Observado', label: 'Observado', icon: 'fas fa-exclamation-triangle', color: 'chip-danger' },
  { value: 'Documentación Aprobada', label: 'Aprobado', icon: 'fas fa-check', color: 'chip-success' },
  { value: 'Liberado', label: 'Liberado', icon: 'fas fa-unlock-alt', color: 'chip-success' },
  { value: 'Entregado', label: 'Entregado', icon: 'fas fa-truck', color: 'chip-secondary' }
];

function statusIcon(estado) {
  const map = {
    'Registrado': 'fas fa-pen',
    'En Auditoría': 'fas fa-clipboard-list',
    'Observado': 'fas fa-eye-slash',
    'Documentación Aprobada': 'fas fa-check-circle',
    'Liberado': 'fas fa-check-double',
    'Entregado': 'fas fa-box-open'
  };
  return map[estado] || 'fas fa-info-circle';
}

const filteredExpedientes = computed(() => {
  let list = recentExpedientes.value;
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    list = list.filter(item => item.codigo.toLowerCase().includes(term) || item.cliente.toLowerCase().includes(term));
  }
  if (statusFilter.value) list = list.filter(item => item.estado === statusFilter.value);
  return list;
});

function statusClass(estado) {
  const map = {
    'Registrado': 'status-info',
    'En Auditoría': 'status-warning',
    'Observado': 'status-danger',
    'Documentación Aprobada': 'status-success',
    'Liberado': 'status-success',
    'Entregado': 'status-secondary'
  };
  return map[estado] || 'status-secondary';
}

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

async function loadData() {
  loading.value = true;
  error.value = '';
  try {
    const [dashboard, expedientes] = await Promise.all([
      api('/reportes/dashboard'),
      api('/expedientes')
    ]);
    summary.value = dashboard;
    recentExpedientes.value = expedientes.slice(0, 8);
    nextTick(() => {
      renderChart();
      initMap();
    });
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function renderChart() {
  const ctx = document.getElementById('flowChart')?.getContext('2d');
  if (!ctx) return;
  if (chartInstance) chartInstance.destroy();
  const labels = chartRange.value === '7' 
    ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] 
    : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
  const data = chartRange.value === '7' ? [4,7,5,9,12,6,3] : [18,22,27,24];
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: { 
      labels, 
      datasets: [{ 
        label: 'Expedientes', 
        data, 
        borderColor: '#3b82f6', 
        backgroundColor: 'rgba(59,130,246,0.1)', 
        tension: 0.4, 
        fill: true,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6
      }] 
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: true,
      plugins: { 
        legend: { display: false },
        tooltip: { backgroundColor: '#0F192F', titleColor: '#fff', bodyColor: '#94A3B8' }
      },
      scales: {
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#CBD5E1' } },
        x: { ticks: { color: '#CBD5E1' } }
      }
    }
  });
}

function initMap() {
  if (mapInstance) mapInstance.remove();
  const container = document.getElementById('trackingMap');
  if (!container) return;
  mapInstance = L.map('trackingMap').setView([13.7, -89.2], 7);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { 
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' 
  }).addTo(mapInstance);
  const markers = [
    { lat: 13.5, lng: -89.0, name: 'Contenedor MAEU1234567' },
    { lat: 13.8, lng: -88.9, name: 'Contenedor SUDU7890123' },
    { lat: 13.3, lng: -89.5, name: 'Contenedor CMAU4567890' }
  ];
  markers.forEach(m => L.marker([m.lat, m.lng]).addTo(mapInstance).bindPopup(m.name));
}

watch(chartRange, () => renderChart());

onMounted(() => {
  loadData();
  if (!window.L) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap();
    document.head.appendChild(script);
  } else {
    initMap();
  }
});
</script>

<style scoped>
/* ----- GLOBAL ----- */
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }

.app-dashboard {
  display: flex;
  min-height: 100vh;
  background: radial-gradient(circle at 10% 20%, #0B1120, #030712);
  font-family: 'Inter', 'Space Grotesk', sans-serif;
  color: #E2E8F0;
}

/* SIDEBAR MEJORADA */
.sidebar {
  width: 280px;
  background: rgba(15, 25, 45, 0.7);
  backdrop-filter: blur(16px);
  border-right: 1px solid rgba(59, 130, 246, 0.3);
  padding: 1.8rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-left: 0.5rem;
}
.logo-icon {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #3B82F6, #00D4FF);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.4rem;
  color: white;
  box-shadow: 0 8px 20px rgba(59,130,246,0.4);
}
.logo-text {
  font-size: 1.4rem;
  font-weight: 800;
  background: linear-gradient(135deg, #fff, #A0C4FF);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border-radius: 1rem;
  color: #CBD5E1;
  transition: all 0.2s;
  text-decoration: none;
}
.nav-item i { width: 24px; }
.nav-item:hover, .nav-item.active { background: rgba(59, 130, 246, 0.2); color: white; }
.user-info {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem;
  background: rgba(255,255,255,0.05);
  border-radius: 1.2rem;
}
.avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(145deg, #1E3A8A, #3B82F6);
  border-radius: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
}
.user-name { font-weight: 700; }
.user-role { font-size: 0.7rem; color: #94A3B8; }

/* MAIN CONTENT - MÁS ESPACIO */
.main-content {
  flex: 1;
  padding: 2rem 2.5rem;
  overflow-y: auto;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}
.welcome h1 { font-size: 2rem; font-weight: 700; color: white; margin-bottom: 0.25rem; }
.welcome p { color: #94A3B8; }
.actions { display: flex; gap: 1rem; }
.icon-btn { background: rgba(255,255,255,0.05); border: none; width: 44px; height: 44px; border-radius: 1rem; color: white; position: relative; cursor: pointer; transition: 0.2s; }
.icon-btn:hover { background: rgba(59,130,246,0.3); }
.badge { position: absolute; top: -5px; right: -5px; background: #EF4444; border-radius: 20px; padding: 2px 6px; font-size: 10px; }

/* MÉTRICAS */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.metric-card {
  background: rgba(15, 25, 45, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 1.8rem;
  padding: 1.4rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}
.metric-card:hover { transform: translateY(-4px); box-shadow: 0 20px 30px -12px rgba(0,0,0,0.5); }
.metric-icon { font-size: 2rem; background: rgba(255,255,255,0.05); width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 1.2rem; }
.metric-details { flex: 1; }
.metric-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: #94A3B8; }
.metric-value { font-size: 2rem; font-weight: 800; display: block; line-height: 1; color: white; }
.metric-trend { font-size: 0.7rem; display: inline-flex; align-items: center; gap: 0.2rem; }
.metric-bg { position: absolute; right: 10px; bottom: 10px; width: 70px; opacity: 0.3; }

/* MAPA Y GRÁFICO */
.row-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.8rem;
  margin-bottom: 2rem;
}
.card {
  background: rgba(15, 25, 45, 0.5);
  backdrop-filter: blur(12px);
  border-radius: 1.8rem;
  border: 1px solid rgba(255,255,255,0.1);
  padding: 1.4rem;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.card-header h3 { font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem; }
.map-container { height: 240px; border-radius: 1rem; overflow: hidden; margin-top: 0.5rem; }
.map-footer { margin-top: 0.8rem; font-size: 0.75rem; display: flex; gap: 1rem; color: #CBD5E1; }
.live { background: #EF4444; color: white; font-size: 0.6rem; padding: 2px 8px; border-radius: 20px; }
.chart-controls { display: flex; gap: 0.5rem; align-items: center; }
.chart-range {
  background: rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 1rem;
  padding: 0.3rem 0.8rem;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
}
.chart-container { margin-top: 0.5rem; width: 100%; height: auto; min-height: 200px; }
.chart-legend { margin-top: 1rem; text-align: center; font-size: 0.7rem; color: #94A3B8; }

/* ========== FILTROS MEJORADOS ========== */
.filters-container {
  display: flex;
  gap: 1.2rem;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 0.8rem;
}
.search-wrapper {
  position: relative;
  flex: 2;
  min-width: 260px;
}
.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #5A6E7A;
  font-size: 0.9rem;
}
.search-input-premium {
  width: 100%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 2rem;
  padding: 0.85rem 1rem 0.85rem 2.8rem;
  color: white;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}
.search-input-premium:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 0 15px rgba(59, 130, 246, 0.3);
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
.status-chips {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  flex: 3;
}
.chip.premium {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 2rem;
  padding: 0.6rem 1.4rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: #CBD5E1;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  backdrop-filter: blur(4px);
}
.chip.premium:hover {
  transform: translateY(-2px);
  background: rgba(59, 130, 246, 0.2);
  border-color: #3B82F6;
}
.chip.premium.active {
  background: linear-gradient(135deg, #1E3A8A, #3B82F6);
  border-color: #3B82F6;
  color: white;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
}
.refresh-premium {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 2rem;
  padding: 0.7rem 1.5rem;
  color: #3B82F6;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  transition: all 0.2s;
}
.refresh-premium:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3B82F6;
  transform: scale(1.02);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

/* TABLA PREMIUM MÁS ESPACIADA */
.expedientes-table-premium {
  margin-top: 1.8rem;
  overflow-x: auto;
  border-radius: 1.2rem;
}
.table-header {
  display: grid;
  grid-template-columns: 0.8fr 2fr 1fr 1.2fr 1fr 1.2fr;
  gap: 1rem;
  padding: 1rem 1.2rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 1rem;
  margin-bottom: 0.8rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94A3B8;
  font-weight: 600;
}
.table-row-premium {
  display: grid;
  grid-template-columns: 0.8fr 2fr 1fr 1.2fr 1fr 1.2fr;
  gap: 1rem;
  align-items: center;
  padding: 1rem 1.2rem;
  margin-bottom: 0.6rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 1rem;
  border: 1px solid transparent;
  transition: all 0.25s ease;
}
.table-row-premium:hover {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(0, 0, 0, 0.2));
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateX(4px);
}
.code-badge {
  background: rgba(59, 130, 246, 0.15);
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-family: monospace;
  font-weight: 600;
  font-size: 0.85rem;
  color: #60A5FA;
  display: inline-block;
}
.cell-client {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.client-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #3B82F6, #00D4FF);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
  color: white;
}
.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}
.type-badge.import { background: rgba(59, 130, 246, 0.2); color: #60A5FA; }
.type-badge.export { background: rgba(16, 185, 129, 0.2); color: #34D399; }
.status-pill.premium {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.9rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 600;
}
.status-pill.premium.status-info { background: rgba(59, 130, 246, 0.15); color: #93C5FD; border: 1px solid rgba(59,130,246,0.3); }
.status-pill.premium.status-warning { background: rgba(245, 158, 11, 0.15); color: #FCD34D; border: 1px solid rgba(245,158,11,0.3); }
.status-pill.premium.status-danger { background: rgba(239, 68, 68, 0.15); color: #FCA5A5; border: 1px solid rgba(239,68,68,0.3); }
.status-pill.premium.status-success { background: rgba(16, 185, 129, 0.15); color: #6EE7B7; border: 1px solid rgba(16,185,129,0.3); }
.status-pill.premium.status-secondary { background: rgba(100, 116, 139, 0.2); color: #CBD5E1; border: 1px solid rgba(100,116,139,0.3); }
.cell-date i, .cell-actions i { margin-right: 0.3rem; color: #5A6E7A; }
.action-icon {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 0.9rem;
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 0.3rem;
}
.action-icon:hover {
  background: #3B82F6;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

/* SKELETON LOADER */
.skeleton-premium { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.8rem; }
.skeleton-row {
  display: grid;
  grid-template-columns: 0.8fr 2fr 1fr 1.2fr 1fr 1.2fr;
  gap: 1rem;
  padding: 1rem;
}
.skeleton-cell {
  height: 45px;
  background: linear-gradient(90deg, #1e293b, #334155, #1e293b);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 1rem;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ESTADO VACÍO */
.empty-state-premium {
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 1.8rem;
  margin-top: 1.5rem;
}
.empty-icon { font-size: 3.5rem; color: #3B82F6; margin-bottom: 1rem; opacity: 0.5; }
.empty-state-premium h4 { color: #CBD5E1; margin-bottom: 0.5rem; }
.empty-state-premium p { color: #5A6E7A; font-size: 0.9rem; }
.clear-filters-btn {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid #3B82F6;
  color: #3B82F6;
  padding: 0.6rem 1.5rem;
  border-radius: 2rem;
  margin-top: 1.2rem;
  cursor: pointer;
  transition: 0.2s;
}
.clear-filters-btn:hover { background: #3B82F6; color: white; }

.card-footer { margin-top: 1.8rem; text-align: right; }
.link-btn {
  background: none;
  border: none;
  color: #3B82F6;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  transition: gap 0.2s;
}
.link-btn:hover { gap: 0.9rem; color: #60A5FA; }

/* INTEGRACIONES MEJORADAS */
.integrations-row {
  display: flex;
  gap: 1.2rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}
.integration-card {
  background: rgba(0,0,0,0.4);
  border-radius: 1.5rem;
  padding: 0.8rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.05);
  transition: transform 0.2s;
}
.integration-card:hover { transform: translateY(-2px); background: rgba(0,0,0,0.5); }
.integration-icon {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.05);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: #94A3B8;
}
.integration-icon.active { background: rgba(16, 185, 129, 0.15); color: #10B981; }
.integration-info h4 { font-size: 0.9rem; margin-bottom: 0.2rem; }
.status-badge { font-size: 0.65rem; padding: 0.2rem 0.6rem; border-radius: 1rem; }
.status-badge.online { background: #10B98120; color: #6EE7B7; }
.status-badge.offline { background: #EF444420; color: #FCA5A5; }
.ping { width: 10px; height: 10px; border-radius: 50%; background: gray; margin-left: auto; }
.ping.active { background: #10B981; box-shadow: 0 0 8px #10B981; animation: pulse 1.5s infinite; }

/* RESPONSIVE */
@media (max-width: 1000px) {
  .sidebar { width: 80px; padding: 1rem; }
  .logo-text, .nav-item span, .user-info div { display: none; }
  .avatar { width: 40px; height: 40px; }
  .row-split { grid-template-columns: 1fr; }
  .main-content { padding: 1.5rem; }
}
@media (max-width: 768px) {
  .table-header { display: none; }
  .table-row-premium {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
    padding: 1rem;
  }
  .table-row-premium > div {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .table-row-premium > div::before {
    content: attr(data-label);
    font-weight: 600;
    color: #94A3B8;
    font-size: 0.7rem;
  }
  .cell-actions { justify-content: flex-end; }
  .status-chips { overflow-x: auto; padding-bottom: 0.5rem; }
}
</style>