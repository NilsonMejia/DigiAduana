<template>
  <main class="dashboard">
    <header class="dashboard__header">
      <div>
        <p class="dashboard__eyebrow">Panel operativo</p>
        <h1>Bienvenido, {{ userName }}</h1>
        <span>{{ userRole }}</span>
      </div>
      <nav class="dashboard__actions" aria-label="Navegacion principal">
        <button type="button" @click="$emit('navigate', '/expedientes')">Expedientes</button>
        <button type="button" @click="$emit('navigate', '/expedientes/nuevo')">Nuevo</button>
        <button type="button" @click="$emit('navigate', '/perfil')">Perfil</button>
      </nav>
    </header>

    <p v-if="error" class="dashboard__error">{{ error }}</p>

    <section class="dashboard__grid" aria-label="Resumen">
      <article v-for="metric in metrics" :key="metric.label" class="dashboard__metric">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </article>
    </section>

    <section class="dashboard__panel">
      <div class="dashboard__panel-header">
        <h2>Expedientes recientes</h2>
        <button type="button" @click="loadData">Actualizar</button>
      </div>
      <div v-if="loading" class="dashboard__empty">Cargando informacion...</div>
      <div v-else-if="recentExpedientes.length === 0" class="dashboard__empty">No hay expedientes registrados.</div>
      <ul v-else class="dashboard__list">
        <li v-for="item in recentExpedientes" :key="item.id">
          <div>
            <strong>{{ item.codigo }}</strong>
            <span>{{ item.cliente }} · {{ item.tipo_operacion }}</span>
          </div>
          <mark>{{ item.estado }}</mark>
        </li>
      </ul>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { api, getStoredUser } from '../services/api';

defineEmits(['navigate']);

const loading = ref(false);
const error = ref('');
const summary = ref({ expedientes: {}, documentos: {}, dte: {} });
const recentExpedientes = ref([]);
const user = computed(() => getStoredUser() || {});
const userName = computed(() => user.value.nombre || 'Usuario');
const userRole = computed(() => user.value.rol || 'Sin rol');

const metrics = computed(() => [
  { label: 'Expedientes', value: summary.value.expedientes?.total || 0 },
  { label: 'En revision', value: summary.value.expedientes?.en_revision || 0 },
  { label: 'Docs pendientes', value: summary.value.documentos?.pendientes || 0 },
  { label: 'DTE validados', value: summary.value.dte?.validados || 0 }
]);

async function loadData() {
  loading.value = true;
  error.value = '';
  try {
    const [dashboard, expedientes] = await Promise.all([
      api('/reportes/dashboard'),
      api('/expedientes')
    ]);
    summary.value = dashboard;
    recentExpedientes.value = expedientes.slice(0, 6);
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<style scoped>
.dashboard {
  width: min(100%, 72rem);
  margin: 0 auto;
  padding: 1rem;
}

.dashboard__header,
.dashboard__panel {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--line);
  border-radius: 1.25rem;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

.dashboard__header {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
}

.dashboard__eyebrow,
.dashboard__header h1 {
  margin: 0;
}

.dashboard__eyebrow,
.dashboard__header span {
  color: var(--muted);
}

.dashboard__header h1 {
  font-size: clamp(1.7rem, 5vw, 3rem);
}

.dashboard__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.dashboard__actions button,
.dashboard__panel-header button {
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: 0.8rem;
  color: var(--ink);
  background: #fff;
  transition: transform 180ms ease, border-color 180ms ease;
}

.dashboard__actions button:hover,
.dashboard__panel-header button:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
}

.dashboard__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.9rem;
  margin: 1rem 0;
}

.dashboard__metric {
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 1rem;
}

.dashboard__metric span {
  color: var(--muted);
}

.dashboard__metric strong {
  display: block;
  margin-top: 0.35rem;
  font-size: 2rem;
}

.dashboard__panel {
  padding: 1rem;
}

.dashboard__panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.dashboard__panel-header h2 {
  margin: 0;
}

.dashboard__list {
  display: grid;
  gap: 0.75rem;
  padding: 0;
  margin: 1rem 0 0;
  list-style: none;
}

.dashboard__list li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem;
  border: 1px solid var(--line);
  border-radius: 0.9rem;
  background: #f8fafc;
}

.dashboard__list span {
  display: block;
  color: var(--muted);
}

.dashboard__list mark {
  align-self: start;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  color: var(--primary-dark);
  background: rgba(59, 130, 246, 0.12);
}

.dashboard__empty,
.dashboard__error {
  padding: 1rem;
  border-radius: 0.9rem;
}

.dashboard__empty {
  color: var(--muted);
}

.dashboard__error {
  color: var(--danger);
  background: rgba(220, 38, 38, 0.08);
}

@media (min-width: 640px) {
  .dashboard__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .dashboard {
    padding: 1.5rem;
  }

  .dashboard__header {
    grid-template-columns: 1fr auto;
    align-items: center;
  }
}

@media (min-width: 1024px) {
  .dashboard__grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
