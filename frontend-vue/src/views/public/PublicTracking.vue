<template>
  <main class="tracking">
    <header class="tracking__header">
      <div>
        <p>Portal publico</p>
        <h1>Seguimiento de expediente</h1>
      </div>
      <button type="button" @click="goToLogin">Iniciar sesion</button>
    </header>

    <form class="tracking__form" novalidate @submit.prevent="search">
      <fieldset>
        <legend>Consulta para cliente</legend>
        <label>
          Codigo de expediente
          <input v-model.trim="codigo" :class="{ 'is-invalid': error }" type="text" placeholder="EXP-2026-000001" />
        </label>
      </fieldset>
      <button type="submit" :disabled="loading">{{ loading ? 'Consultando...' : 'Consultar' }}</button>
    </form>

    <p v-if="error" class="tracking__error">{{ error }}</p>

    <section v-if="result" class="tracking__result">
      <div class="tracking__summary">
        <h2>{{ tracking.codigo }}</h2>
        <p>{{ tracking.ubicacion || tracking.cliente || 'Ubicacion en actualizacion' }}</p>
        <mark>{{ tracking.estado_actual || tracking.estado }}</mark>
      </div>

      <ol class="tracking__timeline">
        <li v-for="event in events" :key="`${event.estado}-${event.fecha_evento || event.creado_en}`">
          <strong>{{ event.estado }}</strong>
          <span>{{ event.evento || event.comentario || 'Actualizacion registrada' }}</span>
          <time>{{ formatDate(event.fecha_evento || event.creado_en) }}</time>
        </li>
      </ol>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../../services/api';

const router = useRouter();

const codigo = ref('EXP-2026-0001');
const loading = ref(false);
const error = ref('');
const result = ref(null);

function formatDate(value) {
  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

async function search() {
  error.value = '';
  result.value = null;

  if (codigo.value.length < 6) {
    error.value = 'Ingresa un codigo de expediente valido.';
    return;
  }

  loading.value = true;
  try {
    result.value = await api(`/tracking/${encodeURIComponent(codigo.value)}`);
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    loading.value = false;
  }
}

const tracking = computed(() => result.value?.expediente || result.value || {});
const events = computed(() => result.value?.historial || result.value?.eventos || []);

function goToLogin() {
  router.push({ name: 'Login' });
}
</script>

<style scoped>
.tracking {
  width: min(100%, 58rem);
  margin: 0 auto;
  padding: 1rem;
}

.tracking__header,
.tracking__form,
.tracking__result {
  border: 1px solid var(--line);
  border-radius: 1.25rem;
  background: var(--surface);
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.08);
}

.tracking__header {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.tracking__header p,
.tracking__header h1 {
  margin: 0;
}

.tracking__header p {
  color: var(--muted);
}

.tracking__header button,
.tracking__form button {
  padding: 0.75rem 0.95rem;
  border: 1px solid var(--line);
  border-radius: 0.85rem;
  background: #fff;
  transition: transform 180ms ease, border-color 180ms ease;
}

.tracking__header button:hover,
.tracking__form button:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
}

.tracking__form {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.tracking__form fieldset {
  padding: 0;
  border: 0;
}

.tracking__form legend {
  margin-bottom: 0.75rem;
  font-weight: 800;
}

.tracking__form label {
  display: grid;
  gap: 0.45rem;
  font-weight: 700;
}

.tracking__form input {
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: 0.85rem;
}

.tracking__form input:focus {
  outline: 0;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.14);
}

.tracking__form .is-invalid {
  border-color: var(--danger);
}

.tracking__form button {
  color: #fff;
  border-color: var(--primary);
  background: var(--primary);
}

.tracking__error {
  padding: 1rem;
  color: var(--danger);
  border-radius: 0.9rem;
  background: rgba(220, 38, 38, 0.08);
}

.tracking__result {
  margin-top: 1rem;
  padding: 1rem;
}

.tracking__summary h2,
.tracking__summary p {
  margin: 0;
}

.tracking__summary p {
  color: var(--muted);
}

.tracking__summary mark {
  display: inline-block;
  margin-top: 0.75rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  color: var(--primary-dark);
  background: rgba(59, 130, 246, 0.12);
}

.tracking__timeline {
  display: grid;
  gap: 0.85rem;
  padding-left: 1.25rem;
  margin: 1.25rem 0 0;
}

.tracking__timeline li {
  padding: 0.9rem;
  border: 1px solid var(--line);
  border-radius: 0.9rem;
  background: #f8fafc;
}

.tracking__timeline span,
.tracking__timeline time {
  display: block;
  color: var(--muted);
}

@media (min-width: 768px) {
  .tracking {
    padding: 1.5rem;
  }

  .tracking__header,
  .tracking__form {
    grid-template-columns: 1fr auto;
    align-items: end;
  }
}
</style>
