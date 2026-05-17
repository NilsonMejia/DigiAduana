<template>
  <section class="detail">
    <header class="detail__header">
      <div>
        <p>Detalle de expediente</p>
        <h1>{{ expediente?.codigo || `Expediente ${id}` }}</h1>
      </div>
      <button type="button" @click="goBack">Volver</button>
    </header>

    <p v-if="loading" class="detail__state">Cargando expediente...</p>
    <p v-else-if="error" class="detail__error">{{ error }}</p>

    <article v-else-if="expediente" class="detail__card">
      <header class="detail__status">
        <mark>{{ expediente.estado || 'SIN_ESTADO' }}</mark>
        <span>{{ expediente.tipo_operacion || 'Operacion no disponible' }}</span>
      </header>

      <dl>
        <div>
          <dt>Cliente</dt>
          <dd>{{ expediente.cliente || expediente.cliente_nombre || 'No disponible' }}</dd>
        </div>
        <div>
          <dt>Regimen</dt>
          <dd>{{ expediente.regimen || 'No disponible' }}</dd>
        </div>
        <div>
          <dt>Aduana ingreso</dt>
          <dd>{{ expediente.aduana_ingreso || 'No disponible' }}</dd>
        </div>
        <div>
          <dt>Aduana salida</dt>
          <dd>{{ expediente.aduana_salida || 'No disponible' }}</dd>
        </div>
        <div>
          <dt>Fecha de creacion</dt>
          <dd>{{ formatDate(expediente.fecha_creacion) }}</dd>
        </div>
        <div>
          <dt>Ultima actualizacion</dt>
          <dd>{{ formatDate(expediente.fecha_actualizacion) }}</dd>
        </div>
      </dl>

      <section class="detail__notes">
        <h2>Descripcion</h2>
        <p>{{ expediente.descripcion || 'Sin descripcion registrada.' }}</p>
      </section>
    </article>
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  }
});

const router = useRouter();
const loading = ref(false);
const error = ref('');
const expediente = ref(null);

function formatDate(value) {
  if (!value) return 'No disponible';
  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

async function loadExpediente() {
  loading.value = true;
  error.value = '';
  expediente.value = null;

  try {
    const response = await fetch(`/expedientes/${encodeURIComponent(props.id)}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.mensaje || `Expediente no encontrado (${props.id})`);
    }

    expediente.value = payload;
  } catch (reason) {
    error.value = reason.message || 'No se pudo cargar el expediente.';
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push({ name: 'ForwarderExpedientes' });
}

onMounted(loadExpediente);
watch(() => props.id, loadExpediente);
</script>

<style scoped>
.detail {
  width: min(100%, 64rem);
  margin: 0 auto;
}

.detail__header,
.detail__card,
.detail__state,
.detail__error {
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--surface);
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.08);
}

.detail__header {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.detail__header p,
.detail__header h1 {
  margin: 0;
}

.detail__header p {
  color: var(--muted);
}

.detail__header button {
  padding: 0.85rem 1rem;
  border: 1px solid var(--line);
  border-radius: 0.85rem;
  background: #fff;
  cursor: pointer;
}

.detail__card,
.detail__state,
.detail__error {
  padding: 1.25rem;
}

.detail__status {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.detail__status mark {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  color: var(--primary-dark);
  font-weight: 700;
}

.detail__status span {
  color: var(--muted);
}

.detail dl {
  display: grid;
  gap: 0.85rem;
  margin: 0;
}

.detail dt {
  color: var(--muted);
  font-size: 0.85rem;
}

.detail dd {
  margin: 0.25rem 0 0;
  font-weight: 700;
}

.detail__notes {
  padding-top: 1rem;
  border-top: 1px solid var(--line);
}

.detail__notes h2,
.detail__notes p {
  margin: 0;
}

.detail__notes p {
  margin-top: 0.55rem;
  color: var(--muted);
}

.detail__error {
  color: var(--danger);
}

@media (min-width: 680px) {
  .detail__header {
    grid-template-columns: 1fr auto;
    align-items: center;
  }

  .detail dl {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
