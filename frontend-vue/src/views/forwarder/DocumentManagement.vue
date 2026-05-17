<template>
  <section class="premium-page">
    <div class="premium-content">
      <header class="premium-header">
        <div>
          <p class="premium-kicker"><i class="fas fa-file-shield"></i> Operacion aduanera</p>
          <h1 class="premium-title">Gestion documental</h1>
          <p class="premium-subtitle">Control de documentos, expedientes, validaciones y pendientes operativos.</p>
        </div>
        <button class="premium-btn" type="button" @click="loadDocuments">
          <i class="fas fa-rotate"></i>
          Actualizar
        </button>
      </header>

      <p v-if="error" class="premium-error">{{ error }}</p>

      <section class="premium-grid">
        <article v-for="metric in metrics" :key="metric.label" class="premium-card">
          <div class="premium-card__icon"><i :class="metric.icon"></i></div>
          <strong>{{ metric.value }}</strong>
          <span>{{ metric.label }}</span>
          <p>{{ metric.detail }}</p>
        </article>
      </section>

      <section class="premium-panel document-toolbar" aria-label="Filtros documentales">
        <label>
          Buscar
          <input v-model.trim="filters.search" type="search" placeholder="Expediente, archivo o tipo" />
        </label>
        <label>
          Estado
          <select v-model="filters.status">
            <option value="">Todos</option>
            <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
          </select>
        </label>
      </section>

      <section class="premium-panel">
        <div class="document-panel__head">
          <div>
            <h2>Repositorio documental</h2>
            <span>{{ filteredDocuments.length }} documentos visibles</span>
          </div>
          <span class="premium-status">{{ pendingCount }} pendientes</span>
        </div>

        <div v-if="loading" class="premium-empty">Cargando documentos...</div>
        <div v-else-if="!filteredDocuments.length" class="premium-empty">No hay documentos para estos filtros.</div>
        <table v-else class="premium-table">
          <thead>
            <tr>
              <th>Expediente</th>
              <th>Tipo</th>
              <th>Archivo</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Riesgo</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in filteredDocuments" :key="doc.id">
              <td>{{ doc.expediente }}</td>
              <td>{{ doc.tipo }}</td>
              <td>{{ doc.nombre }}</td>
              <td><span class="premium-status">{{ doc.estado }}</span></td>
              <td>{{ formatDate(doc.fecha_carga) }}</td>
              <td>{{ riskFor(doc) }}</td>
              <td>
                <button class="premium-btn premium-btn--ghost document-action" type="button" @click="openDocument(doc)">
                  <i class="fas fa-download"></i>
                  Archivo
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { api } from '../../services/api';

const documents = ref([]);
const error = ref('');
const loading = ref(false);
const filters = reactive({
  search: '',
  status: ''
});

const statuses = computed(() => [...new Set(documents.value.map((doc) => doc.estado).filter(Boolean))]);
const filteredDocuments = computed(() => {
  const term = filters.search.toLowerCase();
  return documents.value.filter((doc) => {
    const matchesText = [doc.expediente, doc.tipo, doc.nombre].some((value) =>
      String(value || '').toLowerCase().includes(term)
    );
    const matchesStatus = !filters.status || doc.estado === filters.status;
    return matchesText && matchesStatus;
  });
});

const pendingCount = computed(() => documents.value.filter((doc) => doc.estado !== 'APROBADO' && doc.estado !== 'VALIDADO').length);
const rejectedCount = computed(() => documents.value.filter((doc) => doc.estado === 'RECHAZADO').length);
const expedienteCount = computed(() => new Set(documents.value.map((doc) => doc.expediente)).size);

const metrics = computed(() => [
  {
    label: 'Documentos visibles',
    value: documents.value.length,
    detail: `${expedienteCount.value} expedientes con respaldo`,
    icon: 'fas fa-folder-tree'
  },
  {
    label: 'Pendientes de revision',
    value: pendingCount.value,
    detail: 'Requieren validacion o seguimiento',
    icon: 'fas fa-file-circle-exclamation'
  },
  {
    label: 'Rechazados',
    value: rejectedCount.value,
    detail: 'Con observacion documental',
    icon: 'fas fa-circle-xmark'
  },
  {
    label: 'Aprobados',
    value: documents.value.filter((doc) => doc.estado === 'APROBADO' || doc.estado === 'VALIDADO').length,
    detail: 'Listos para cierre operativo',
    icon: 'fas fa-circle-check'
  }
]);

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium' }).format(new Date(value));
}

function riskFor(doc) {
  if (doc.estado === 'RECHAZADO') return 'Alto';
  if (doc.estado === 'PENDIENTE') return 'Medio';
  return 'Controlado';
}

function openDocument(doc) {
  if (!doc.url) return;
  const normalizedUrl = doc.url.startsWith('http') || doc.url.startsWith('/') ? doc.url : `/${doc.url.replace(/\\/g, '/')}`;
  window.open(normalizedUrl, '_blank', 'noopener');
}

async function loadDocuments() {
  loading.value = true;
  error.value = '';
  try {
    const response = await api('/documentos');
    documents.value = response.data || response.documentos || response;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadDocuments);
</script>

<style scoped src="../premium.css"></style>
<style scoped>
.document-toolbar {
  display: grid;
  gap: 1rem;
}

.document-toolbar label {
  display: grid;
  gap: 0.45rem;
  color: #dbeafe;
  font-weight: 700;
}

.document-toolbar input,
.document-toolbar select {
  width: 100%;
  padding: 0.8rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.75rem;
  color: #e2e8f0;
  background: rgba(3, 7, 18, 0.5);
}

.document-toolbar input::placeholder {
  color: #94a3b8;
}

.document-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.document-panel__head h2 {
  margin: 0;
  color: #fff;
  font-size: 1.05rem;
}

.document-panel__head span {
  color: #94a3b8;
}

.document-action {
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  box-shadow: none;
}

@media (min-width: 720px) {
  .document-toolbar {
    grid-template-columns: 1fr 14rem;
  }
}
</style>
