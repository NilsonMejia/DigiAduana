<template>
  <main class="tracking">
    <section class="tracking__panel">
      <header class="tracking__header">
        <div>
          <p>Seguimiento público</p>
          <h1>{{ resolvedCode || 'Consulta de expediente' }}</h1>
        </div>
        <RouterLink :to="{ name: 'Home' }">Nueva consulta</RouterLink>
      </header>

      <form class="tracking__form" @submit.prevent="executeSearch">
        <label>
          Código de expediente
          <input v-model.trim="searchCode" type="search" placeholder="EXP-2026-0001" />
        </label>
        <button type="submit">Buscar</button>
      </form>

      <p v-if="loading" class="tracking__state">Consultando seguimiento...</p>
      <p v-else-if="error" class="tracking__error">{{ error }}</p>

      <article v-else-if="tracking" class="tracking__card">
        <header class="tracking__summary">
          <div>
            <strong>Expediente</strong>
            <p>{{ tracking.codigo }}</p>
          </div>
          <mark :class="statusClass">{{ tracking.estado }}</mark>
        </header>

        <dl>
          <div>
            <dt>Ubicación actual</dt>
            <dd>{{ tracking.ubicacion || 'No disponible' }}</dd>
          </div>
          <div>
            <dt>Creado</dt>
            <dd>{{ formatDate(tracking.fecha_creacion) }}</dd>
          </div>
          <div>
            <dt>Última actualización</dt>
            <dd>{{ formatDate(tracking.ultima_actualizacion) }}</dd>
          </div>
        </dl>

        <section class="tracking__events">
          <h2>Historial público</h2>
          <ol>
            <li v-for="event in tracking.eventos" :key="event.evento + event.fecha_evento">
              <strong>{{ event.evento }}</strong>
              <span>{{ event.ubicacion }}</span>
              <time>{{ formatDate(event.fecha_evento) }}</time>
            </li>
          </ol>
        </section>
      </article>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  codigo: {
    type: String,
    default: ''
  }
});

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const error = ref('');
const tracking = ref(null);
const searchCode = ref(props.codigo || route.params.codigo || route.query.codigo || '');

const resolvedCode = computed(() => props.codigo || route.params.codigo || route.query.codigo || '');
const statusClass = computed(() => {
  const status = String(tracking.value?.estado || '').toLowerCase();
  if (status.includes('entregado') || status.includes('liberado')) return 'tracking__status--ok';
  if (status.includes('observado') || status.includes('auditoria')) return 'tracking__status--warn';
  return 'tracking__status--neutral';
});

function formatDate(value) {
  if (!value) return 'No disponible';
  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

async function loadTracking(code) {
  const lookup = code || resolvedCode.value;
  if (!lookup) {
    error.value = 'Ingresa un código para consultar.';
    return;
  }

  loading.value = true;
  error.value = '';
  tracking.value = null;

  try {
    const response = await fetch(`/tracking/${encodeURIComponent(lookup)}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.mensaje || `Error ${response.status}`);
    }

    tracking.value = payload;
    searchCode.value = lookup;
  } catch (reason) {
    error.value = reason.message || 'No se pudo obtener el seguimiento.';
  } finally {
    loading.value = false;
  }
}

function executeSearch() {
  if (!searchCode.value) {
    error.value = 'Ingresa un código para buscar.';
    return;
  }
  router.push({ name: 'PublicTracking', params: { codigo: searchCode.value } });
}

onMounted(() => {
  if (resolvedCode.value) {
    loadTracking(resolvedCode.value);
  }
});

watch(resolvedCode, (code) => {
  if (code) {
    loadTracking(code);
  }
});
</script>

<style scoped>
.tracking {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: var(--surface-alt);
}

.tracking__panel {
  width: min(100%, 52rem);
  padding: 1.5rem;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--surface);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
}

.tracking__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.tracking__header p,
.tracking__header h1 {
  margin: 0;
}

.tracking__header p {
  color: var(--muted);
}

.tracking__form {
  display: grid;
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.tracking__form label {
  display: grid;
  gap: 0.45rem;
  font-weight: 700;
}

.tracking__form input,
.tracking__form button {
  min-height: 3rem;
  border-radius: 0.75rem;
}

.tracking__form input {
  border: 1px solid var(--line);
  padding: 0 0.95rem;
}

.tracking__form button {
  width: fit-content;
  border: 0;
  background: var(--primary);
  color: #fff;
  font-weight: 700;
  padding: 0 1.25rem;
}

.tracking__state,
.tracking__error {
  margin: 0;
}

.tracking__error {
  color: var(--danger);
}

.tracking__card {
  display: grid;
  gap: 1rem;
}

.tracking__summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.tracking__summary strong {
  display: block;
  color: var(--muted);
  font-size: 0.95rem;
}

.tracking__summary p {
  margin: 0.25rem 0 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.tracking__card mark {
  display: inline-flex;
  align-items: center;
  padding: 0.55rem 0.95rem;
  border-radius: 999px;
  font-weight: 700;
  background: rgba(59, 130, 246, 0.12);
  color: var(--primary-dark);
}

.tracking__status--ok {
  background: rgba(16, 185, 129, 0.15);
  color: #047857;
}

.tracking__status--warn {
  background: rgba(245, 158, 11, 0.15);
  color: #92400e;
}

.tracking__status--neutral {
  background: rgba(148, 163, 184, 0.15);
  color: #334155;
}

.tracking dl {
  display: grid;
  gap: 0.9rem;
  margin: 0;
}

.tracking dt {
  color: var(--muted);
  font-size: 0.85rem;
}

.tracking dd {
  margin: 0.2rem 0 0;
  font-weight: 700;
}

.tracking__events h2 {
  margin: 0 0 0.75rem;
}

.tracking__events ol {
  display: grid;
  gap: 0.8rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tracking__events li {
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 0.85rem;
}

.tracking__events strong {
  display: block;
  margin-bottom: 0.35rem;
}

.tracking__events span,
.tracking__events time {
  display: block;
  color: var(--muted);
  font-size: 0.92rem;
}

@media (min-width: 680px) {
  .tracking__form {
    grid-template-columns: 1fr auto;
    align-items: end;
  }

  .tracking dl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
