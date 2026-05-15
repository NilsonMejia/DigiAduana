<template>
  <main class="form-page">
    <header class="form-page__header">
      <div>
        <p>Nuevo tramite</p>
        <h1>Crear expediente aduanal</h1>
      </div>
      <button type="button" @click="$emit('navigate', '/expedientes')">Volver al listado</button>
    </header>

    <form class="form-page__form" novalidate @submit.prevent="submit">
      <fieldset>
        <legend>Datos generales</legend>

        <label>
          Cliente ID
          <input v-model.number="form.cliente_id" :class="{ 'is-invalid': errors.cliente_id }" type="number" min="1" />
          <small v-if="errors.cliente_id">{{ errors.cliente_id }}</small>
        </label>

        <label>
          Tipo de operacion
          <select v-model="form.tipo_operacion" :class="{ 'is-invalid': errors.tipo_operacion }">
            <option value="">Selecciona una opcion</option>
            <option value="IMPORTACION">Importacion</option>
            <option value="EXPORTACION">Exportacion</option>
            <option value="TRANSITO">Transito</option>
            <option value="REEXPORTACION">Reexportacion</option>
          </select>
          <small v-if="errors.tipo_operacion">{{ errors.tipo_operacion }}</small>
        </label>

        <label>
          Regimen
          <input v-model.trim="form.regimen" :class="{ 'is-invalid': errors.regimen }" type="text" placeholder="Importacion definitiva" />
          <small v-if="errors.regimen">{{ errors.regimen }}</small>
        </label>

        <label>
          Aduana ingreso
          <input v-model.trim="form.aduana_ingreso" type="text" placeholder="Aduana Maritima Acajutla" />
        </label>

        <label>
          Aduana salida
          <input v-model.trim="form.aduana_salida" type="text" placeholder="San Salvador" />
        </label>

        <label class="form-page__wide">
          Descripcion
          <textarea v-model.trim="form.descripcion" rows="4" placeholder="Detalle operativo del expediente"></textarea>
        </label>
      </fieldset>

      <p v-if="message" class="form-page__message">{{ message }}</p>
      <p v-if="serverError" class="form-page__error">{{ serverError }}</p>

      <div class="form-page__footer">
        <button type="button" @click="resetForm">Limpiar</button>
        <button class="form-page__primary" type="submit" :disabled="loading">
          {{ loading ? 'Guardando...' : 'Crear expediente' }}
        </button>
      </div>
    </form>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { api } from '../services/api';

defineEmits(['navigate']);

const loading = ref(false);
const message = ref('');
const serverError = ref('');
const form = reactive({
  cliente_id: 1,
  tipo_operacion: '',
  regimen: '',
  aduana_ingreso: '',
  aduana_salida: '',
  descripcion: ''
});
const errors = reactive({
  cliente_id: '',
  tipo_operacion: '',
  regimen: ''
});

function validate() {
  errors.cliente_id = form.cliente_id > 0 ? '' : 'Selecciona un cliente valido.';
  errors.tipo_operacion = form.tipo_operacion ? '' : 'Selecciona el tipo de operacion.';
  errors.regimen = form.regimen.length >= 4 ? '' : 'Escribe un regimen claro.';
  return !errors.cliente_id && !errors.tipo_operacion && !errors.regimen;
}

function resetForm() {
  form.cliente_id = 1;
  form.tipo_operacion = '';
  form.regimen = '';
  form.aduana_ingreso = '';
  form.aduana_salida = '';
  form.descripcion = '';
  message.value = '';
  serverError.value = '';
}

async function submit() {
  message.value = '';
  serverError.value = '';
  if (!validate()) return;

  loading.value = true;
  try {
    const created = await api('/expedientes', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    message.value = `Expediente ${created.codigo} creado correctamente.`;
    resetForm();
  } catch (error) {
    serverError.value = error.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.form-page {
  width: min(100%, 64rem);
  margin: 0 auto;
  padding: 1rem;
}

.form-page__header,
.form-page__form {
  border: 1px solid var(--line);
  border-radius: 1.25rem;
  background: var(--surface);
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.08);
}

.form-page__header {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.form-page__header p,
.form-page__header h1 {
  margin: 0;
}

.form-page__header p {
  color: var(--muted);
}

.form-page__header button,
.form-page__footer button {
  padding: 0.75rem 0.95rem;
  border: 1px solid var(--line);
  border-radius: 0.85rem;
  background: #fff;
  transition: transform 180ms ease, border-color 180ms ease;
}

.form-page__header button:hover,
.form-page__footer button:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
}

.form-page__form {
  padding: 1rem;
}

.form-page__form fieldset {
  display: grid;
  gap: 1rem;
  padding: 0;
  border: 0;
}

.form-page__form legend {
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
  font-weight: 800;
}

.form-page__form label {
  display: grid;
  gap: 0.45rem;
  font-weight: 700;
}

.form-page__form input,
.form-page__form select,
.form-page__form textarea {
  width: 100%;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: 0.85rem;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.form-page__form input:focus,
.form-page__form select:focus,
.form-page__form textarea:focus {
  outline: 0;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.14);
}

.form-page__form .is-invalid {
  border-color: var(--danger);
}

.form-page__form small,
.form-page__error {
  color: var(--danger);
}

.form-page__message {
  color: #047857;
}

.form-page__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.2rem;
}

.form-page__primary {
  color: #fff;
  border-color: var(--primary) !important;
  background: var(--primary) !important;
}

@media (min-width: 640px) {
  .form-page__form fieldset {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-page__wide {
    grid-column: 1 / -1;
  }
}

@media (min-width: 768px) {
  .form-page {
    padding: 1.5rem;
  }

  .form-page__header {
    grid-template-columns: 1fr auto;
    align-items: center;
  }
}

@media (min-width: 1024px) {
  .form-page__form {
    padding: 1.5rem;
  }
}
</style>
