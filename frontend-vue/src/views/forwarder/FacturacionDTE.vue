<template>
  <main class="premium-page">
    <section class="hero-shell">
      <div class="hero-copy">
        <span class="eyebrow"><i class="fas fa-satellite-dish"></i> Facturacion DTE</span>
        <h1>Monitoreo fiscal en tiempo real</h1>
        <p>Transmite, corrige y descarga comprobantes legales validados por Hacienda con trazabilidad completa.</p>
      </div>
      <button class="ghost-action" type="button" :disabled="loading" @click="loadDtes">
        <i class="fas fa-rotate"></i>
        Actualizar
      </button>
    </section>

    <section class="metrics-grid" aria-label="Metricas DTE">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card">
        <div class="metric-icon"><i :class="metric.icon"></i></div>
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </article>
    </section>

    <section class="glass-panel">
      <div class="toolbar">
        <label class="search-box">
          <i class="fas fa-magnifying-glass"></i>
          <input v-model.trim="search" type="search" placeholder="Buscar por DTE, cliente o expediente" @input="page = 1" />
        </label>
        <select v-model="statusFilter" class="select-control" @change="page = 1">
          <option value="todos">Todos los estados</option>
          <option value="VALIDADO">Validados</option>
          <option value="RECHAZADO">Rechazados</option>
          <option value="PENDIENTE">Pendientes</option>
        </select>
      </div>

      <div v-if="error" class="alert error">
        <i class="fas fa-triangle-exclamation"></i>
        {{ error }}
      </div>
      <div v-if="notice" class="alert success">
        <i class="fas fa-circle-check"></i>
        {{ notice }}
      </div>

      <div v-if="loading" class="skeleton-list">
        <div v-for="item in 5" :key="item" class="skeleton-row"></div>
      </div>

      <template v-else>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>DTE</th>
                <th>Cliente</th>
                <th>Expediente</th>
                <th>Monto</th>
                <th>Emision</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in paginatedDtes" :key="item.id">
                <td>
                  <strong>{{ item.numero_control || item.numero_dte }}</strong>
                  <small>{{ item.codigo_generacion }}</small>
                </td>
                <td>{{ item.cliente }}</td>
                <td>{{ item.expediente }}</td>
                <td>{{ money(item.total || item.monto) }}</td>
                <td>{{ date(item.fecha_emision || item.fecha) }}</td>
                <td>
                  <span class="status-badge" :class="statusClass(item.estado)">
                    <i :class="statusIcon(item.estado)"></i>
                    {{ displayStatus(item.estado) }}
                  </span>
                  <span v-if="isValidated(item)" class="seal-badge">
                    <i class="fas fa-shield-halved"></i>
                    Sello de Hacienda
                  </span>
                  <small v-if="isRejected(item)" class="rejection">{{ item.motivo_rechazo || item.error_hacienda }}</small>
                  <small v-if="isPending(item)" class="pending-line"><i class="fas fa-circle-notch fa-spin"></i> Esperando transmision</small>
                </td>
                <td>
                  <div class="actions">
                    <button v-if="!isValidated(item)" class="primary-action" type="button" :disabled="isSending(item)" @click="sendDte(item)">
                      <i :class="isSending(item) ? 'fas fa-circle-notch fa-spin' : 'fas fa-paper-plane'"></i>
                      Enviar / Reintentar
                    </button>
                    <button v-if="isRejected(item)" class="icon-action" type="button" title="Corregir DTE" @click="openCorrection(item)">
                      <i class="fas fa-pen-to-square"></i>
                    </button>
                    <button v-if="isValidated(item)" class="icon-action" type="button" title="Descargar PDF" @click="downloadDte(item, 'pdf')">
                      <i class="fas fa-file-pdf"></i>
                    </button>
                    <button v-if="isValidated(item)" class="icon-action" type="button" title="Descargar XML" @click="downloadDte(item, 'xml')">
                      <i class="fas fa-file-code"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mobile-list">
          <article v-for="item in paginatedDtes" :key="`card-${item.id}`" class="dte-card">
            <div>
              <strong>{{ item.numero_control || item.numero_dte }}</strong>
              <span class="status-badge" :class="statusClass(item.estado)">
                <i :class="statusIcon(item.estado)"></i>
                {{ displayStatus(item.estado) }}
              </span>
            </div>
            <p>{{ item.cliente }} · {{ item.expediente }}</p>
            <p>{{ money(item.total || item.monto) }} · {{ date(item.fecha_emision || item.fecha) }}</p>
            <small v-if="isRejected(item)" class="rejection">{{ item.motivo_rechazo || item.error_hacienda }}</small>
            <div class="actions">
              <button v-if="!isValidated(item)" class="primary-action" type="button" :disabled="isSending(item)" @click="sendDte(item)">
                <i :class="isSending(item) ? 'fas fa-circle-notch fa-spin' : 'fas fa-paper-plane'"></i>
                Enviar
              </button>
              <button v-if="isRejected(item)" class="icon-action" type="button" @click="openCorrection(item)"><i class="fas fa-pen-to-square"></i></button>
              <button v-if="isValidated(item)" class="icon-action" type="button" @click="downloadDte(item, 'pdf')"><i class="fas fa-file-pdf"></i></button>
              <button v-if="isValidated(item)" class="icon-action" type="button" @click="downloadDte(item, 'xml')"><i class="fas fa-file-code"></i></button>
            </div>
          </article>
        </div>

        <div v-if="!filteredDtes.length" class="empty-state">
          <i class="fas fa-file-circle-question"></i>
          No hay DTE que coincidan con los filtros.
        </div>

        <div class="pagination" v-if="totalPages > 1">
          <button type="button" :disabled="page === 1" @click="page--"><i class="fas fa-chevron-left"></i></button>
          <span>Pagina {{ page }} de {{ totalPages }}</span>
          <button type="button" :disabled="page === totalPages" @click="page++"><i class="fas fa-chevron-right"></i></button>
        </div>
      </template>
    </section>

    <div v-if="editing" class="modal-backdrop" @click.self="closeCorrection">
      <form class="modal-card" @submit.prevent="saveCorrection">
        <div class="modal-head">
          <div>
            <span class="eyebrow">Correccion fiscal</span>
            <h2>{{ editing.numero_control }}</h2>
          </div>
          <button class="icon-action" type="button" @click="closeCorrection"><i class="fas fa-xmark"></i></button>
        </div>
        <label>
          Monto total
          <input v-model.number="editForm.total" type="number" min="0.01" step="0.01" required />
        </label>
        <label>
          Descripcion
          <textarea v-model.trim="editForm.descripcion" rows="4" required></textarea>
        </label>
        <div class="modal-actions">
          <button class="ghost-action" type="button" @click="closeCorrection">Cancelar</button>
          <button class="primary-action" type="submit" :disabled="savingCorrection">
            <i :class="savingCorrection ? 'fas fa-circle-notch fa-spin' : 'fas fa-floppy-disk'"></i>
            Guardar correccion
          </button>
        </div>
      </form>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { api, getToken } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const dtes = ref([]);
const loading = ref(true);
const error = ref('');
const notice = ref('');
const search = ref('');
const statusFilter = ref('todos');
const page = ref(1);
const pageSize = 10;
const sending = ref(new Set());
const editing = ref(null);
const editForm = ref({ total: 0, descripcion: '' });
const savingCorrection = ref(false);

const metrics = computed(() => {
  const list = dtes.value;
  const validated = list.filter(isValidated).length;
  const rejected = list.filter(isRejected).length;
  const amount = list.reduce((total, item) => total + Number(item.total || item.monto || 0), 0);
  return [
    { label: 'DTE emitidos', value: list.length, icon: 'fas fa-file-invoice' },
    { label: 'Validados', value: validated, icon: 'fas fa-shield-halved' },
    { label: 'Rechazados', value: rejected, icon: 'fas fa-circle-xmark' },
    { label: 'Monto facturado', value: money(amount), icon: 'fas fa-coins' }
  ];
});

const filteredDtes = computed(() => {
  const term = search.value.toLowerCase();
  return dtes.value.filter((item) => {
    const statusOk = statusFilter.value === 'todos' || normalizeStatus(item.estado) === statusFilter.value;
    const text = `${item.numero_control || item.numero_dte} ${item.cliente} ${item.expediente}`.toLowerCase();
    return statusOk && (!term || text.includes(term));
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredDtes.value.length / pageSize)));
const paginatedDtes = computed(() => filteredDtes.value.slice((page.value - 1) * pageSize, page.value * pageSize));

function normalizeStatus(status) {
  const value = String(status || '').toUpperCase();
  if (value.includes('VALID')) return 'VALIDADO';
  if (value.includes('RECH') || value.includes('ERROR')) return 'RECHAZADO';
  return 'PENDIENTE';
}

function isValidated(item) {
  return normalizeStatus(item.estado) === 'VALIDADO';
}

function isRejected(item) {
  return normalizeStatus(item.estado) === 'RECHAZADO';
}

function isPending(item) {
  return normalizeStatus(item.estado) === 'PENDIENTE';
}

function displayStatus(status) {
  return { VALIDADO: 'Validado', RECHAZADO: 'Rechazado', PENDIENTE: 'Pendiente' }[normalizeStatus(status)];
}

function statusClass(status) {
  return normalizeStatus(status).toLowerCase();
}

function statusIcon(status) {
  return {
    VALIDADO: 'fas fa-circle-check',
    RECHAZADO: 'fas fa-circle-xmark',
    PENDIENTE: 'fas fa-circle-notch fa-spin'
  }[normalizeStatus(status)];
}

function isSending(item) {
  return sending.value.has(item.id);
}

function money(value) {
  return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

function date(value) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function applyUpdatedDte(updated) {
  const normalized = updated?.dte || updated;
  if (!normalized?.id) return;
  const index = dtes.value.findIndex((item) => item.id === normalized.id);
  if (index >= 0) dtes.value[index] = normalized;
}

async function loadDtes() {
  loading.value = true;
  error.value = '';
  try {
    const response = await api('/dte');
    dtes.value = response.data || response || [];
    page.value = 1;
  } catch (err) {
    error.value = err.message || 'No se pudieron cargar los DTE.';
  } finally {
    loading.value = false;
  }
}

async function sendDte(item) {
  notice.value = '';
  error.value = '';
  sending.value = new Set([...sending.value, item.id]);
  try {
    const response = await api(`/dte/${item.id}/enviar`, { method: 'POST' });
    applyUpdatedDte(response);
    notice.value = response.mensaje || 'DTE transmitido correctamente.';
  } catch (err) {
    error.value = err.message || 'Hacienda rechazo el DTE.';
    await loadDtes();
  } finally {
    const next = new Set(sending.value);
    next.delete(item.id);
    sending.value = next;
  }
}

function openCorrection(item) {
  editing.value = item;
  editForm.value = { total: Number(item.total || item.monto || 0), descripcion: item.descripcion || '' };
}

function closeCorrection() {
  editing.value = null;
}

async function saveCorrection() {
  if (!editing.value) return;
  savingCorrection.value = true;
  error.value = '';
  notice.value = '';
  try {
    const response = await api(`/dte/${editing.value.id}`, {
      method: 'PUT',
      body: JSON.stringify(editForm.value)
    });
    applyUpdatedDte(response);
    notice.value = response.mensaje || 'DTE corregido. Puedes reenviarlo.';
    closeCorrection();
  } catch (err) {
    error.value = err.message || 'No se pudo corregir el DTE.';
  } finally {
    savingCorrection.value = false;
  }
}

async function downloadDte(item, type) {
  error.value = '';
  try {
    const response = await fetch(`${API_BASE}/dte/${item.id}/${type}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.mensaje || 'No se pudo descargar el comprobante.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.numero_control || item.numero_dte}.${type}`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    error.value = err.message;
  }
}

onMounted(loadDtes);
</script>

<style scoped>
.premium-page {
  min-height: 100vh;
  padding: 2rem;
  color: #f8fbff;
  font-family: Inter, system-ui, sans-serif;
  background:
    radial-gradient(circle at 18% 12%, rgba(59, 130, 246, 0.32), transparent 34%),
    radial-gradient(circle at 82% 18%, rgba(16, 185, 129, 0.16), transparent 28%),
    radial-gradient(circle at 50% 100%, rgba(99, 102, 241, 0.18), transparent 35%),
    #07101f;
  animation: pulseBg 12s ease-in-out infinite alternate;
}

@keyframes pulseBg {
  from { background-position: 0 0, 0 0, 0 0, 0 0; }
  to { background-position: 20px -24px, -20px 18px, 0 -18px, 0 0; }
}

.hero-shell,
.glass-panel,
.metric-card,
.modal-card,
.dte-card {
  border: 1px solid rgba(191, 219, 254, 0.16);
  background: rgba(11, 18, 32, 0.72);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
}

.hero-shell {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-end;
  padding: 2rem;
}

.eyebrow {
  display: inline-flex;
  gap: 0.45rem;
  align-items: center;
  color: #93c5fd;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0.35rem 0;
  letter-spacing: 0;
}

h1 { font-size: clamp(2rem, 4vw, 4rem); }
p { color: #cbd5e1; }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.metric-card {
  padding: 1.25rem;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.metric-card:hover { transform: translateY(-3px); border-color: rgba(96, 165, 250, 0.42); }
.metric-icon { color: #60a5fa; font-size: 1.45rem; }
.metric-card span { display: block; color: #a9b8ce; margin: 0.75rem 0 0.25rem; }
.metric-card strong { font-size: 1.7rem; }

.glass-panel { padding: 1.25rem; }
.toolbar { display: flex; gap: 0.8rem; margin-bottom: 1rem; }
.search-box, .select-control, input, textarea {
  border: 1px solid rgba(148, 163, 184, 0.26);
  background: rgba(2, 8, 23, 0.72);
  color: #f8fbff;
  border-radius: 1rem;
}

.search-box { flex: 1; display: flex; align-items: center; gap: 0.7rem; padding: 0 1rem; }
.search-box input { flex: 1; border: 0; background: transparent; outline: 0; padding: 0.95rem 0; }
.select-control, input, textarea { padding: 0.95rem 1rem; outline: 0; }
textarea { resize: vertical; }

.alert { display: flex; gap: 0.65rem; align-items: center; padding: 0.9rem 1rem; border-radius: 1rem; margin: 0.8rem 0; }
.alert.error { background: rgba(127, 29, 29, 0.34); color: #fecaca; }
.alert.success { background: rgba(6, 95, 70, 0.34); color: #bbf7d0; }

.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 980px; }
th { color: #93c5fd; text-align: left; font-size: 0.78rem; text-transform: uppercase; }
th, td { padding: 1rem; border-bottom: 1px solid rgba(148, 163, 184, 0.14); vertical-align: top; }
td small { display: block; color: #94a3b8; margin-top: 0.25rem; }

.status-badge, .seal-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  padding: 0.38rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 800;
}
.status-badge.validado, .seal-badge { background: rgba(16, 185, 129, 0.14); color: #86efac; }
.status-badge.rechazado { background: rgba(239, 68, 68, 0.14); color: #fecaca; }
.status-badge.pendiente { background: rgba(245, 158, 11, 0.14); color: #fde68a; }
.seal-badge { margin-left: 0.35rem; border: 1px solid rgba(134, 239, 172, 0.24); }
.rejection { color: #fecaca; max-width: 28rem; }
.pending-line { color: #fde68a; }

.actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
button { cursor: pointer; transition: transform 0.2s ease, opacity 0.2s ease, border-color 0.2s ease; }
button:disabled { cursor: not-allowed; opacity: 0.55; }
button:not(:disabled):hover { transform: translateY(-2px); }
.primary-action, .ghost-action, .icon-action {
  border: 1px solid rgba(147, 197, 253, 0.24);
  color: #f8fbff;
  font-weight: 800;
}
.primary-action { border-radius: 0.95rem; padding: 0.78rem 1rem; background: linear-gradient(135deg, #2563eb, #14b8a6); }
.ghost-action { border-radius: 0.95rem; padding: 0.78rem 1rem; background: rgba(15, 23, 42, 0.76); }
.icon-action { width: 2.75rem; height: 2.75rem; border-radius: 0.9rem; background: rgba(15, 23, 42, 0.86); }

.mobile-list { display: none; }
.empty-state, .pagination { display: flex; justify-content: center; align-items: center; gap: 0.8rem; padding: 1.5rem; color: #cbd5e1; }
.pagination button { width: 2.5rem; height: 2.5rem; border-radius: 0.8rem; border: 1px solid rgba(147, 197, 253, 0.24); background: rgba(15, 23, 42, 0.86); color: #fff; }

.skeleton-row { height: 4.2rem; border-radius: 1rem; margin: 0.7rem 0; background: linear-gradient(90deg, rgba(148,163,184,.12), rgba(148,163,184,.26), rgba(148,163,184,.12)); animation: shimmer 1.2s infinite; }
@keyframes shimmer { 0% { opacity: .45; } 50% { opacity: 1; } 100% { opacity: .45; } }

.modal-backdrop { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(2, 6, 23, 0.72); padding: 1rem; z-index: 30; }
.modal-card { width: min(560px, 100%); padding: 1.35rem; }
.modal-head, .modal-actions { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
.modal-card label { display: grid; gap: 0.45rem; margin: 1rem 0; color: #dbeafe; font-weight: 800; }

@media (max-width: 920px) {
  .premium-page { padding: 1rem; }
  .hero-shell, .toolbar { flex-direction: column; align-items: stretch; }
  .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .table-wrap { display: none; }
  .mobile-list { display: grid; gap: 0.8rem; }
  .dte-card { padding: 1rem; }
  .dte-card > div:first-child { display: flex; justify-content: space-between; gap: 0.75rem; align-items: center; }
}

@media (max-width: 560px) {
  .metrics-grid { grid-template-columns: 1fr; }
  .modal-actions { flex-direction: column; align-items: stretch; }
}
</style>
