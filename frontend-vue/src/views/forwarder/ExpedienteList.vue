<template>
  <section class="list">
    <header class="list__header">
      <div>
        <p>Gestion de tramites</p>
        <h1>Expedientes aduanales</h1>
      </div>
      <div class="list__actions">
        <button type="button" @click="router.push({ name: 'RoleDashboard' })">Dashboard</button>
        <button type="button" class="list__primary" @click="router.push({ name: createRouteName })">
          Nuevo expediente
        </button>
      </div>
    </header>

    <section class="list__filters" aria-label="Filtros">
      <label>
        Buscar
        <input v-model.trim="filters.search" type="search" placeholder="Codigo, cliente o regimen" />
      </label>
      <label>
        Estado
        <select v-model="filters.estado">
          <option value="">Todos</option>
          <option v-for="estado in estados" :key="estado" :value="estado">{{ estado }}</option>
        </select>
      </label>
    </section>

    <p v-if="error" class="list__error">{{ error }}</p>

    <section class="list__table" aria-live="polite">
      <div v-if="loading" class="list__empty">Cargando expedientes...</div>
      <div v-else-if="filteredExpedientes.length === 0" class="list__empty">No hay coincidencias.</div>
      <article
        v-for="item in filteredExpedientes"
        v-else
        :key="item.id"
        class="list__row"
        @click="openDetail(item)"
      >
        <div>
          <strong>{{ item.codigo }}</strong>
          <span>{{ item.cliente }}</span>
        </div>
        <div>
          <span>{{ item.tipo_operacion }}</span>
          <small>{{ item.regimen }}</small>
        </div>
        <mark>{{ item.estado }}</mark>
      </article>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const router = useRouter();
const auth = useAuthStore();
const loading = ref(false);
const error = ref('');
const expedientes = ref([]);
const estados = ['BORRADOR', 'EN_REVISION', 'OBSERVADO', 'APROBADO', 'RECHAZADO', 'FINALIZADO'];
const filters = reactive({
  search: '',
  estado: ''
});

const createRouteName = computed(() =>
  auth.userRole === 'supervisor' ? 'SupervisorExpedienteCreate' : 'ForwarderExpedienteCreate'
);

const detailRouteName = computed(() =>
  auth.userRole === 'supervisor' ? 'SupervisorExpedienteDetail' : 'ForwarderExpedienteDetail'
);

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

function openDetail(item) {
  router.push({ name: detailRouteName.value, params: { id: item.id } });
}

async function loadExpedientes() {
  loading.value = true;
  error.value = '';
  try {
    const response = await api('/expedientes?limit=100');
    expedientes.value = response.data || response;
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadExpedientes);
</script>

<style scoped>
.list {
  width: min(100%, 72rem);
  margin: 0 auto;
  color: #e2e8f0;
}

.list__header,
.list__filters,
.list__table {
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 1rem;
  background: rgba(15, 25, 45, 0.72);
  box-shadow: 0 20px 52px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(16px);
}

.list__header {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
}

.list__header p,
.list__header h1 {
  margin: 0;
}

.list__header p {
  color: #94a3b8;
}

.list__header h1 {
  color: #fff;
}

.list__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.list__actions button,
.list__filters input,
.list__filters select {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.75rem;
}

.list__actions button {
  padding: 0.75rem 0.95rem;
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.08);
}

.list__primary {
  color: #fff;
  border-color: var(--primary) !important;
  background: var(--primary) !important;
}

.list__filters {
  display: grid;
  gap: 1rem;
  margin: 1rem 0;
  padding: 1rem;
}

.list__filters label {
  display: grid;
  gap: 0.45rem;
  color: #dbeafe;
  font-weight: 700;
}

.list__filters input,
.list__filters select {
  padding: 0.8rem 0.9rem;
  color: #e2e8f0;
  background: rgba(3, 7, 18, 0.5);
}

.list__filters input::placeholder {
  color: #94a3b8;
}

.list__table {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
}

.list__row {
  display: grid;
  gap: 0.75rem;
  padding: 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 0.75rem;
  background: rgba(3, 7, 18, 0.42);
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.list__row:hover {
  border-color: rgba(96, 165, 250, 0.45);
  transform: translateY(-2px);
}

.list__row strong {
  color: #fff;
}

.list__row span,
.list__row small {
  display: block;
  color: #94a3b8;
}

.list__row mark {
  width: max-content;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  color: #bfdbfe;
  background: rgba(59, 130, 246, 0.12);
}

.list__empty,
.list__error {
  padding: 1rem;
  border-radius: 0.75rem;
}

.list__error {
  color: var(--danger);
  background: rgba(220, 38, 38, 0.08);
}

.list__empty {
  color: #bfdbfe;
  background: rgba(255, 255, 255, 0.06);
}

@media (min-width: 640px) {
  .list__filters {
    grid-template-columns: 1fr 14rem;
  }
}

@media (min-width: 768px) {
  .list__header,
  .list__row {
    grid-template-columns: 1fr auto;
    align-items: center;
  }
}

@media (min-width: 1024px) {
  .list__row {
    grid-template-columns: 1.2fr 1fr auto;
  }
}
</style>
