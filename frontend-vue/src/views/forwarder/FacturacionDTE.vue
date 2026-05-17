<template>
  <section class="premium-page">
    <div class="premium-content">
      <header class="premium-header">
        <div>
          <p class="premium-kicker"><i class="fas fa-file-invoice-dollar"></i> Facturacion</p>
          <h1 class="premium-title">Facturacion DTE</h1>
          <p class="premium-subtitle">Emision, validacion, descarga y control de documentos tributarios electronicos.</p>
        </div>
        <button class="premium-btn" type="button" @click="loadDtes">
          <i class="fas fa-rotate"></i>
          Actualizar
        </button>
      </header>

      <p v-if="error" class="premium-error">{{ error }}</p>
      <p v-if="message" class="premium-empty">{{ message }}</p>

      <section class="premium-grid">
        <article v-for="metric in metrics" :key="metric.label" class="premium-card">
          <div class="premium-card__icon"><i :class="metric.icon"></i></div>
          <strong>{{ metric.value }}</strong>
          <span>{{ metric.label }}</span>
          <p>{{ metric.detail }}</p>
        </article>
      </section>

      <section class="premium-panel dte-toolbar" aria-label="Filtros de DTE">
        <label>
          Buscar
          <input v-model.trim="filters.search" type="search" placeholder="Numero, cliente o expediente" />
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
        <div class="dte-panel__head">
          <div>
            <h2>Comprobantes emitidos</h2>
            <span>{{ filteredDtes.length }} DTE visibles</span>
          </div>
          <span class="premium-status">${{ totalAmount.toLocaleString('es-SV', { minimumFractionDigits: 2 }) }}</span>
        </div>

        <div v-if="loading" class="premium-empty">Cargando DTE...</div>
        <div v-else-if="!filteredDtes.length" class="premium-empty">No hay DTE para estos filtros.</div>
        <table v-else class="premium-table">
          <thead>
            <tr>
              <th>Numero</th>
              <th>Expediente</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredDtes" :key="item.id">
              <td>
                <strong>{{ item.numero_control }}</strong>
                <small>{{ item.codigo_generacion || 'Sin codigo generacion' }}</small>
              </td>
              <td>{{ item.expediente || item.expediente_codigo }}</td>
              <td>{{ item.cliente }}</td>
              <td>{{ item.tipo || item.tipo_dte || 'DTE' }}</td>
              <td><span class="premium-status">{{ item.estado }}</span></td>
              <td>${{ numberValue(item.total).toLocaleString('es-SV', { minimumFractionDigits: 2 }) }}</td>
              <td>{{ formatDate(item.fecha || item.creado_en || item.validado_en) }}</td>
              <td>
                <div class="dte-actions">
                  <button class="premium-btn premium-btn--ghost" type="button" @click="downloadInvoice(item)">
                    <i class="fas fa-file-pdf"></i>
                    Factura
                  </button>
                  <button class="premium-btn premium-btn--ghost" type="button" @click="downloadJson(item)">
                    <i class="fas fa-code"></i>
                    JSON
                  </button>
                  <button
                    v-if="canValidate"
                    class="premium-btn premium-btn--ghost"
                    type="button"
                    :disabled="item.estado === 'VALIDADO'"
                    @click="validateDte(item)"
                  >
                    <i class="fas fa-stamp"></i>
                    Validar
                  </button>
                  <button
                    v-if="canValidate"
                    class="premium-btn premium-btn--ghost"
                    type="button"
                    :disabled="item.estado === 'INVALIDADO'"
                    @click="invalidateDte(item)"
                  >
                    <i class="fas fa-ban"></i>
                    Invalidar
                  </button>
                </div>
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
import { useAuthStore } from '../../stores/authStore';

const auth = useAuthStore();
const dtes = ref([]);
const error = ref('');
const message = ref('');
const loading = ref(false);
const filters = reactive({
  search: '',
  status: ''
});

const canValidate = computed(() => ['admin', 'supervisor'].includes(auth.userRole));
const statuses = computed(() => [...new Set(dtes.value.map((item) => item.estado).filter(Boolean))]);
const filteredDtes = computed(() => {
  const term = filters.search.toLowerCase();
  return dtes.value.filter((item) => {
    const matchesText = [item.numero_control, item.cliente, item.expediente, item.expediente_codigo].some((value) =>
      String(value || '').toLowerCase().includes(term)
    );
    const matchesStatus = !filters.status || item.estado === filters.status;
    return matchesText && matchesStatus;
  });
});
const totalAmount = computed(() => dtes.value.reduce((sum, item) => sum + numberValue(item.total), 0));
const metrics = computed(() => [
  {
    label: 'DTE emitidos',
    value: dtes.value.length,
    detail: 'Comprobantes disponibles',
    icon: 'fas fa-file-invoice'
  },
  {
    label: 'Validados',
    value: dtes.value.filter((item) => item.estado === 'VALIDADO').length,
    detail: 'Con respaldo de Hacienda',
    icon: 'fas fa-circle-check'
  },
  {
    label: 'Pendientes',
    value: dtes.value.filter((item) => item.estado === 'EMITIDO').length,
    detail: 'Listos para seguimiento',
    icon: 'fas fa-clock'
  },
  {
    label: 'Monto total',
    value: `$${totalAmount.value.toLocaleString('es-SV', { minimumFractionDigits: 2 })}`,
    detail: 'Facturacion visible',
    icon: 'fas fa-sack-dollar'
  }
]);

function numberValue(value) {
  return Number(value || 0);
}

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium' }).format(new Date(value));
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadInvoice(item) {
  const html = `<!doctype html>
<html lang="es">
<meta charset="utf-8">
<title>${item.numero_control}</title>
<style>
body{font-family:Arial,sans-serif;margin:40px;color:#172033}
h1{margin:0 0 8px}table{width:100%;border-collapse:collapse;margin-top:24px}
td,th{border:1px solid #dbe3ef;padding:10px;text-align:left}.total{font-size:22px;font-weight:700}
</style>
<h1>Factura DTE</h1>
<p>${item.numero_control}</p>
<table>
<tr><th>Expediente</th><td>${item.expediente || item.expediente_codigo || ''}</td></tr>
<tr><th>Cliente</th><td>${item.cliente || ''}</td></tr>
<tr><th>Tipo</th><td>${item.tipo || item.tipo_dte || 'DTE'}</td></tr>
<tr><th>Estado</th><td>${item.estado || ''}</td></tr>
<tr><th>Codigo generacion</th><td>${item.codigo_generacion || ''}</td></tr>
<tr><th>Sello recepcion</th><td>${item.sello_recepcion || ''}</td></tr>
<tr><th>Total</th><td class="total">$${numberValue(item.total).toFixed(2)}</td></tr>
</table>`;
  downloadBlob(html, `${item.numero_control || 'factura-dte'}.html`, 'text/html;charset=utf-8');
}

function downloadJson(item) {
  downloadBlob(JSON.stringify(item, null, 2), `${item.numero_control || 'dte'}.json`, 'application/json;charset=utf-8');
}

async function validateDte(item) {
  error.value = '';
  message.value = '';
  try {
    await api(`/dte/${item.id}/validar-hacienda`, { method: 'POST' });
    message.value = `${item.numero_control} enviado a validacion de Hacienda.`;
    await loadDtes();
  } catch (err) {
    error.value = err.message;
  }
}

async function invalidateDte(item) {
  error.value = '';
  message.value = '';
  try {
    await api(`/dte/${item.id}/invalidar`, {
      method: 'PATCH',
      body: JSON.stringify({ motivo: 'Invalidado desde la vista DTE' })
    });
    message.value = `${item.numero_control} invalidado.`;
    await loadDtes();
  } catch (err) {
    error.value = err.message;
  }
}

async function loadDtes() {
  loading.value = true;
  error.value = '';
  try {
    const response = await api('/dte');
    dtes.value = response.data || response;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadDtes);
</script>

<style scoped src="../premium.css"></style>
<style scoped>
.dte-toolbar {
  display: grid;
  gap: 1rem;
}

.dte-toolbar label {
  display: grid;
  gap: 0.45rem;
  color: #dbeafe;
  font-weight: 700;
}

.dte-toolbar input,
.dte-toolbar select {
  width: 100%;
  padding: 0.8rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.75rem;
  color: #e2e8f0;
  background: rgba(3, 7, 18, 0.5);
}

.dte-toolbar input::placeholder {
  color: #94a3b8;
}

.dte-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.dte-panel__head h2 {
  margin: 0;
  color: #fff;
  font-size: 1.05rem;
}

.dte-panel__head span,
.premium-table small {
  display: block;
  color: #94a3b8;
}

.premium-table strong {
  display: block;
  color: #fff;
}

.dte-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dte-actions .premium-btn {
  padding: 0.5rem 0.7rem;
  border-radius: 0.75rem;
  box-shadow: none;
}

.dte-actions .premium-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (min-width: 720px) {
  .dte-toolbar {
    grid-template-columns: 1fr 14rem;
  }
}
</style>
