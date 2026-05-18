<template>
  <main class="premium-page">
    <section class="hero-shell">
      <div>
        <span class="eyebrow"><i class="fas fa-folder-tree"></i> Gestion documental</span>
        <h1>Documentos con auditoria completa</h1>
        <p>Sube, valida, observa, previsualiza y descarga archivos asociados a expedientes activos.</p>
      </div>
      <div class="role-pill">
        <i class="fas fa-user-shield"></i>
        {{ roleLabel }}
      </div>
    </section>

    <section class="workspace-grid">
      <form v-if="canUpload" class="glass-panel upload-panel" @submit.prevent="uploadDocument">
        <div class="panel-head">
          <span class="eyebrow">Carga inteligente</span>
          <strong>Nuevo documento</strong>
        </div>

        <label>
          Expediente
          <input v-model.trim="expedienteSearch" type="search" placeholder="Buscar expediente o cliente" />
          <select v-model="uploadForm.expediente_id" required>
            <option disabled value="">Selecciona expediente</option>
            <option v-for="expediente in filteredExpedientes" :key="expediente.id" :value="expediente.id">
              {{ expediente.codigo }} · {{ expediente.cliente }}
            </option>
          </select>
        </label>

        <div class="form-row">
          <label>
            Tipo
            <select v-model="uploadForm.tipo" required>
              <option value="BL">BL</option>
              <option value="AWB">AWB</option>
              <option value="Factura">Factura</option>
              <option value="DUCA">DUCA</option>
              <option value="Permisos">Permisos</option>
            </select>
          </label>
          <label>
            Nombre
            <input v-model.trim="uploadForm.nombre" type="text" required placeholder="factura-comercial.pdf" />
          </label>
        </div>

        <label>
          Descripcion
          <textarea v-model.trim="uploadForm.descripcion" rows="3" placeholder="Detalle opcional del documento"></textarea>
        </label>

        <label class="file-drop" :class="{ invalid: fileError }">
          <i class="fas fa-cloud-arrow-up"></i>
          <span>{{ selectedFile ? selectedFile.name : 'PDF, JPG o PNG hasta 10MB' }}</span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" @change="onFileChange" />
        </label>
        <small v-if="fileError" class="field-error">{{ fileError }}</small>

        <div v-if="uploading" class="progress-track">
          <span :style="{ width: `${uploadProgress}%` }"></span>
        </div>

        <button class="primary-action" type="submit" :disabled="uploading">
          <i :class="uploading ? 'fas fa-circle-notch fa-spin' : 'fas fa-upload'"></i>
          Subir documento
        </button>
      </form>

      <section class="glass-panel documents-panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">Trazabilidad</span>
            <strong>Documentos registrados</strong>
          </div>
          <button class="ghost-action" type="button" :disabled="loading" @click="loadAll">
            <i class="fas fa-rotate"></i>
            Actualizar
          </button>
        </div>

        <div class="filters">
          <button v-for="filter in filters" :key="filter.value" type="button" :class="{ active: statusFilter === filter.value }" @click="statusFilter = filter.value">
            {{ filter.label }}
            <span>{{ countByStatus(filter.value) }}</span>
          </button>
        </div>

        <div v-if="error" class="alert error"><i class="fas fa-triangle-exclamation"></i>{{ error }}</div>
        <div v-if="notice" class="alert success"><i class="fas fa-circle-check"></i>{{ notice }}</div>

        <div v-if="loading" class="skeleton-list">
          <div v-for="item in 6" :key="item" class="skeleton-row"></div>
        </div>

        <div v-else class="docs-list">
          <article v-for="doc in filteredDocuments" :key="doc.id" class="document-card" :class="statusClass(doc.estado)">
            <div class="document-main">
              <div class="doc-icon"><i :class="fileIcon(doc)"></i></div>
              <div>
                <strong>{{ doc.nombre }}</strong>
                <p>{{ doc.tipo_documento || doc.tipo }} · {{ doc.expediente }} · {{ doc.cliente }}</p>
                <div class="trace">
                  <span><i class="fas fa-arrow-up-from-bracket"></i> {{ doc.subido_por_nombre }} · {{ date(doc.fecha_subida || doc.fecha_carga) }}</span>
                  <span v-if="doc.fecha_validacion"><i class="fas fa-user-check"></i> {{ doc.validado_por_nombre }} · {{ date(doc.fecha_validacion) }}</span>
                </div>
                <small v-if="isRejected(doc)" class="observation">{{ doc.observacion || doc.observaciones }}</small>
              </div>
            </div>
            <div class="document-actions">
              <span class="status-badge" :class="statusClass(doc.estado)">
                <i :class="statusIcon(doc.estado)"></i>
                {{ displayStatus(doc.estado) }}
              </span>
              <button class="icon-action" type="button" title="Previsualizar" @click="previewDocument(doc)"><i class="fas fa-eye"></i></button>
              <button class="icon-action" type="button" title="Descargar" @click="downloadDocument(doc)"><i class="fas fa-download"></i></button>
              <button v-if="canValidate && isPending(doc)" class="primary-action compact" type="button" @click="openValidation(doc, 'VALIDADO')">
                <i class="fas fa-check"></i>
                Validar
              </button>
              <button v-if="canValidate && isPending(doc)" class="danger-action compact" type="button" @click="openValidation(doc, 'RECHAZADO')">
                <i class="fas fa-xmark"></i>
                Rechazar
              </button>
            </div>
          </article>

          <div v-if="!filteredDocuments.length" class="empty-state">
            <i class="fas fa-folder-open"></i>
            No hay documentos para este filtro.
          </div>
        </div>
      </section>
    </section>

    <div v-if="validation.doc" class="modal-backdrop" @click.self="closeValidation">
      <form class="modal-card" @submit.prevent="submitValidation">
        <div class="modal-head">
          <div>
            <span class="eyebrow">Supervisor</span>
            <h2>{{ validation.estado === 'VALIDADO' ? 'Validar documento' : 'Rechazar documento' }}</h2>
          </div>
          <button class="icon-action" type="button" @click="closeValidation"><i class="fas fa-xmark"></i></button>
        </div>
        <p>{{ validation.doc.nombre }}</p>
        <label>
          Observacion
          <textarea v-model.trim="validation.observacion" rows="4" :required="validation.estado === 'RECHAZADO'" placeholder="Obligatoria al rechazar"></textarea>
        </label>
        <div class="modal-actions">
          <button class="ghost-action" type="button" @click="closeValidation">Cancelar</button>
          <button class="primary-action" type="submit" :disabled="validating">
            <i :class="validating ? 'fas fa-circle-notch fa-spin' : 'fas fa-floppy-disk'"></i>
            Guardar decision
          </button>
        </div>
      </form>
    </div>

    <div v-if="preview.url" class="modal-backdrop" @click.self="closePreview">
      <section class="preview-card">
        <div class="modal-head">
          <div>
            <span class="eyebrow">Previsualizacion</span>
            <h2>{{ preview.name }}</h2>
          </div>
          <button class="icon-action" type="button" @click="closePreview"><i class="fas fa-xmark"></i></button>
        </div>
        <img v-if="preview.type.startsWith('image/')" :src="preview.url" :alt="preview.name" />
        <iframe v-else :src="preview.url" title="Previsualizacion PDF"></iframe>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../../stores/authStore';
import { api, getToken } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const auth = useAuthStore();
const { userRole } = storeToRefs(auth);

const documents = ref([]);
const expedientes = ref([]);
const loading = ref(true);
const error = ref('');
const notice = ref('');
const statusFilter = ref('TODOS');
const expedienteSearch = ref('');
const selectedFile = ref(null);
const fileError = ref('');
const uploading = ref(false);
const uploadProgress = ref(0);
const validating = ref(false);
const preview = reactive({ url: '', type: '', name: '' });
const validation = reactive({ doc: null, estado: 'VALIDADO', observacion: '' });

const uploadForm = reactive({
  expediente_id: '',
  tipo: 'Factura',
  nombre: '',
  descripcion: ''
});

const filters = [
  { label: 'Todos', value: 'TODOS' },
  { label: 'Pendientes', value: 'PENDIENTE' },
  { label: 'Validados', value: 'VALIDADO' },
  { label: 'Rechazados', value: 'RECHAZADO' }
];

const roleLabel = computed(() => {
  const labels = {
    forwarder: 'Freight Forwarder',
    supervisor: 'Supervisor',
    admin: 'Administrador',
    cliente: 'Cliente',
    soporte: 'Soporte'
  };
  return labels[userRole.value] || 'Usuario';
});

const canValidate = computed(() => ['supervisor', 'admin'].includes(userRole.value));
const canUpload = computed(() => ['forwarder', 'admin'].includes(userRole.value));

const filteredExpedientes = computed(() => {
  const term = expedienteSearch.value.toLowerCase();
  return expedientes.value.filter((item) => `${item.codigo} ${item.cliente}`.toLowerCase().includes(term)).slice(0, 20);
});

const filteredDocuments = computed(() => {
  if (statusFilter.value === 'TODOS') return documents.value;
  return documents.value.filter((doc) => normalizeStatus(doc.estado) === statusFilter.value);
});

function normalizeStatus(status) {
  const value = String(status || '').toUpperCase();
  if (value.includes('VALID') || value === 'APROBADO') return 'VALIDADO';
  if (value.includes('RECH') || value === 'OBSERVADO') return 'RECHAZADO';
  return 'PENDIENTE';
}

function isPending(doc) {
  return normalizeStatus(doc.estado) === 'PENDIENTE';
}

function isRejected(doc) {
  return normalizeStatus(doc.estado) === 'RECHAZADO';
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
    PENDIENTE: 'fas fa-hourglass-half'
  }[normalizeStatus(status)];
}

function fileIcon(doc) {
  const type = String(doc.mime_type || '').toLowerCase();
  if (type.includes('image')) return 'fas fa-file-image';
  return 'fas fa-file-pdf';
}

function countByStatus(status) {
  if (status === 'TODOS') return documents.value.length;
  return documents.value.filter((doc) => normalizeStatus(doc.estado) === status).length;
}

function date(value) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function onFileChange(event) {
  const file = event.target.files?.[0] || null;
  selectedFile.value = file;
  fileError.value = '';
  if (!file) return;
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowed.includes(file.type)) fileError.value = 'Solo se aceptan PDF, JPG o PNG.';
  if (file.size > 10 * 1024 * 1024) fileError.value = 'El archivo supera el limite de 10MB.';
  if (!uploadForm.nombre) uploadForm.nombre = file.name;
}

function startProgress() {
  uploadProgress.value = 12;
  return window.setInterval(() => {
    uploadProgress.value = Math.min(92, uploadProgress.value + 8);
  }, 180);
}

async function loadAll() {
  loading.value = true;
  error.value = '';
  try {
    const [docsResponse, expResponse] = await Promise.all([
      api('/documentos'),
      api('/expedientes?limit=100')
    ]);
    documents.value = docsResponse.data || docsResponse || [];
    expedientes.value = expResponse.data || expResponse || [];
    if (!uploadForm.expediente_id && expedientes.value[0]) uploadForm.expediente_id = expedientes.value[0].id;
  } catch (err) {
    error.value = err.message || 'No se pudo cargar la gestion documental.';
  } finally {
    loading.value = false;
  }
}

async function uploadDocument() {
  notice.value = '';
  error.value = '';
  if (!selectedFile.value || fileError.value) {
    fileError.value = fileError.value || 'Selecciona un archivo valido.';
    return;
  }

  const body = new FormData();
  body.append('archivo', selectedFile.value);
  body.append('tipo', uploadForm.tipo);
  body.append('nombre', uploadForm.nombre);
  body.append('descripcion', uploadForm.descripcion);

  uploading.value = true;
  const interval = startProgress();
  try {
    const response = await api(`/expedientes/${uploadForm.expediente_id}/documentos`, { method: 'POST', body });
    uploadProgress.value = 100;
    documents.value = [response.documento, ...documents.value].filter(Boolean);
    notice.value = response.mensaje || 'Documento cargado correctamente.';
    selectedFile.value = null;
    uploadForm.nombre = '';
    uploadForm.descripcion = '';
  } catch (err) {
    error.value = err.message || 'No se pudo subir el documento.';
  } finally {
    window.clearInterval(interval);
    setTimeout(() => {
      uploading.value = false;
      uploadProgress.value = 0;
    }, 350);
  }
}

function openValidation(doc, estado) {
  validation.doc = doc;
  validation.estado = estado;
  validation.observacion = '';
}

function closeValidation() {
  validation.doc = null;
}

function replaceDocument(updated) {
  const doc = updated?.documento || updated;
  const index = documents.value.findIndex((item) => item.id === doc.id);
  if (index >= 0) documents.value[index] = doc;
}

async function submitValidation() {
  if (!validation.doc) return;
  validating.value = true;
  error.value = '';
  notice.value = '';
  try {
    const response = await api(`/documentos/${validation.doc.id}/validar`, {
      method: 'PATCH',
      body: JSON.stringify({
        estado: validation.estado,
        observacion: validation.observacion
      })
    });
    replaceDocument(response);
    notice.value = response.mensaje || 'Decision guardada.';
    closeValidation();
  } catch (err) {
    error.value = err.message || 'No se pudo validar el documento.';
  } finally {
    validating.value = false;
  }
}

async function fetchDocumentBlob(doc) {
  const response = await fetch(`${API_BASE}/documentos/${doc.id}/download`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.mensaje || 'No se pudo obtener el documento.');
  }
  return response.blob();
}

async function downloadDocument(doc) {
  error.value = '';
  try {
    const blob = await fetchDocumentBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.nombre;
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    error.value = err.message;
  }
}

async function previewDocument(doc) {
  error.value = '';
  closePreview();
  try {
    const blob = await fetchDocumentBlob(doc);
    preview.url = URL.createObjectURL(blob);
    preview.type = doc.mime_type || blob.type || 'application/pdf';
    preview.name = doc.nombre;
  } catch (err) {
    error.value = err.message;
  }
}

function closePreview() {
  if (preview.url) URL.revokeObjectURL(preview.url);
  preview.url = '';
  preview.type = '';
  preview.name = '';
}

onMounted(loadAll);
</script>

<style scoped>
.premium-page {
  min-height: 100vh;
  padding: 2rem;
  color: #f8fbff;
  font-family: Inter, system-ui, sans-serif;
  background:
    radial-gradient(circle at 16% 12%, rgba(37, 99, 235, 0.34), transparent 34%),
    radial-gradient(circle at 86% 14%, rgba(20, 184, 166, 0.18), transparent 26%),
    radial-gradient(circle at 50% 100%, rgba(99, 102, 241, 0.2), transparent 34%),
    #07101f;
  animation: pulseBg 12s ease-in-out infinite alternate;
}

@keyframes pulseBg {
  from { background-position: 0 0, 0 0, 0 0, 0 0; }
  to { background-position: 18px -22px, -22px 14px, 0 -18px, 0 0; }
}

.hero-shell,
.glass-panel,
.document-card,
.modal-card,
.preview-card {
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
  margin-bottom: 1rem;
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

h1, h2 { margin: 0.35rem 0; letter-spacing: 0; }
h1 { font-size: clamp(2rem, 4vw, 4rem); }
p { color: #cbd5e1; margin: 0.25rem 0; }

.role-pill {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  border: 1px solid rgba(147, 197, 253, 0.24);
  border-radius: 999px;
  padding: 0.75rem 1rem;
  color: #bfdbfe;
  background: rgba(15, 23, 42, 0.72);
  font-weight: 800;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.85fr) minmax(0, 1.65fr);
  gap: 1rem;
}

.glass-panel { padding: 1.25rem; }
.panel-head, .modal-head, .modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.panel-head strong { display: block; font-size: 1.35rem; margin-top: 0.25rem; }

label { display: grid; gap: 0.45rem; color: #dbeafe; font-weight: 800; margin: 0.9rem 0; }
input, select, textarea {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.26);
  background: rgba(2, 8, 23, 0.72);
  color: #f8fbff;
  border-radius: 1rem;
  padding: 0.92rem 1rem;
  outline: 0;
}
textarea { resize: vertical; }
.form-row { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 0.8rem; }

.file-drop {
  min-height: 8rem;
  place-items: center;
  text-align: center;
  border: 1px dashed rgba(147, 197, 253, 0.42);
  background: rgba(15, 23, 42, 0.62);
  cursor: pointer;
}
.file-drop i { font-size: 2rem; color: #60a5fa; }
.file-drop input { display: none; }
.file-drop.invalid { border-color: rgba(248, 113, 113, 0.75); }
.field-error, .observation { color: #fecaca; }

.progress-track { height: 0.6rem; overflow: hidden; border-radius: 999px; background: rgba(15, 23, 42, 0.9); margin: 0.9rem 0; }
.progress-track span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(135deg, #2563eb, #14b8a6); transition: width 0.2s ease; }

.filters { display: flex; flex-wrap: wrap; gap: 0.55rem; margin: 1rem 0; }
.filters button {
  border: 1px solid rgba(147, 197, 253, 0.18);
  background: rgba(15, 23, 42, 0.72);
  color: #dbeafe;
  border-radius: 999px;
  padding: 0.65rem 0.85rem;
  font-weight: 800;
}
.filters button.active { background: linear-gradient(135deg, rgba(37, 99, 235, 0.95), rgba(20, 184, 166, 0.85)); }
.filters span { margin-left: 0.35rem; color: #fff; }

.docs-list { display: grid; gap: 0.85rem; }
.document-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.document-card:hover { transform: translateY(-2px); border-color: rgba(96, 165, 250, 0.42); }
.document-card.pendiente { border-color: rgba(245, 158, 11, 0.38); }
.document-main { display: flex; gap: 0.9rem; min-width: 0; }
.doc-icon {
  display: grid;
  place-items: center;
  flex: 0 0 3.1rem;
  height: 3.1rem;
  border-radius: 1rem;
  color: #93c5fd;
  background: rgba(37, 99, 235, 0.14);
}
.document-main strong { display: block; overflow-wrap: anywhere; }
.trace { display: flex; flex-wrap: wrap; gap: 0.7rem; color: #94a3b8; font-size: 0.82rem; margin-top: 0.4rem; }
.document-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; flex-wrap: wrap; }

.status-badge {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  border-radius: 999px;
  padding: 0.42rem 0.7rem;
  font-weight: 800;
  font-size: 0.78rem;
}
.status-badge.validado { color: #86efac; background: rgba(16, 185, 129, 0.14); }
.status-badge.rechazado { color: #fecaca; background: rgba(239, 68, 68, 0.14); }
.status-badge.pendiente { color: #fde68a; background: rgba(245, 158, 11, 0.14); }

button { cursor: pointer; transition: transform 0.2s ease, opacity 0.2s ease; }
button:disabled { cursor: not-allowed; opacity: 0.55; }
button:not(:disabled):hover { transform: translateY(-2px); }
.primary-action, .danger-action, .ghost-action, .icon-action {
  border: 1px solid rgba(147, 197, 253, 0.24);
  color: #f8fbff;
  font-weight: 800;
}
.primary-action { width: 100%; border-radius: 0.95rem; padding: 0.82rem 1rem; background: linear-gradient(135deg, #2563eb, #14b8a6); }
.danger-action { border-radius: 0.95rem; padding: 0.72rem 0.9rem; background: linear-gradient(135deg, #dc2626, #f97316); }
.ghost-action { border-radius: 0.95rem; padding: 0.78rem 1rem; background: rgba(15, 23, 42, 0.76); }
.icon-action { width: 2.65rem; height: 2.65rem; border-radius: 0.9rem; background: rgba(15, 23, 42, 0.86); }
.compact { width: auto; padding: 0.72rem 0.9rem; }

.alert { display: flex; gap: 0.65rem; align-items: center; padding: 0.9rem 1rem; border-radius: 1rem; margin: 0.8rem 0; }
.alert.error { background: rgba(127, 29, 29, 0.34); color: #fecaca; }
.alert.success { background: rgba(6, 95, 70, 0.34); color: #bbf7d0; }
.empty-state { display: flex; justify-content: center; gap: 0.8rem; padding: 2rem; color: #cbd5e1; }
.skeleton-row { height: 5.2rem; border-radius: 1rem; margin: 0.7rem 0; background: linear-gradient(90deg, rgba(148,163,184,.12), rgba(148,163,184,.26), rgba(148,163,184,.12)); animation: shimmer 1.2s infinite; }
@keyframes shimmer { 0% { opacity: .45; } 50% { opacity: 1; } 100% { opacity: .45; } }

.modal-backdrop { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(2, 6, 23, 0.72); padding: 1rem; z-index: 30; }
.modal-card, .preview-card { width: min(640px, 100%); padding: 1.35rem; }
.preview-card { width: min(980px, 100%); }
.preview-card img, .preview-card iframe { width: 100%; height: min(70vh, 720px); margin-top: 1rem; border: 0; border-radius: 1rem; background: #fff; object-fit: contain; }

@media (max-width: 1100px) {
  .workspace-grid { grid-template-columns: 1fr; }
}

@media (max-width: 760px) {
  .premium-page { padding: 1rem; }
  .hero-shell, .panel-head, .document-card, .document-actions { align-items: stretch; flex-direction: column; }
  .form-row { grid-template-columns: 1fr; }
  .document-actions { justify-content: flex-start; }
  .modal-actions { flex-direction: column; align-items: stretch; }
}
</style>
