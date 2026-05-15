<template>
  <main class="login">
    <section class="login__panel" aria-labelledby="login-title">
      <div class="login__brand">
        <span class="login__mark">DA</span>
        <div>
          <h1 id="login-title">DigiAduana</h1>
          <p>Acceso seguro para operaciones aduaneras.</p>
        </div>
      </div>

      <form class="login__form" novalidate @submit.prevent="submit">
        <fieldset>
          <legend>Iniciar sesion</legend>

          <label class="login__field">
            <span>Correo electronico</span>
            <input
              v-model.trim="form.correo"
              :class="{ 'is-invalid': errors.correo }"
              type="email"
              autocomplete="email"
              placeholder="admin@digiaduana.local"
            />
            <small v-if="errors.correo">{{ errors.correo }}</small>
          </label>

          <label class="login__field">
            <span>Password</span>
            <input
              v-model="form.password"
              :class="{ 'is-invalid': errors.password }"
              type="password"
              autocomplete="current-password"
              placeholder="Tu password"
            />
            <small v-if="errors.password">{{ errors.password }}</small>
          </label>
        </fieldset>

        <p v-if="serverError" class="login__error">{{ serverError }}</p>

        <button class="login__button" type="submit" :disabled="loading">
          {{ loading ? 'Validando...' : 'Ingresar' }}
        </button>
      </form>

      <button class="login__link" type="button" @click="$emit('navigate', '/seguimiento')">
        Consultar seguimiento publico
      </button>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { api, saveSession } from '../services/api';

const emit = defineEmits(['navigate', 'session-change']);

const loading = ref(false);
const serverError = ref('');
const form = reactive({
  correo: 'admin@digiaduana.local',
  password: 'password'
});
const errors = reactive({
  correo: '',
  password: ''
});

function validate() {
  errors.correo = form.correo.includes('@') ? '' : 'Ingresa un correo valido.';
  errors.password = form.password.length >= 6 ? '' : 'El password debe tener al menos 6 caracteres.';
  return !errors.correo && !errors.password;
}

async function submit() {
  serverError.value = '';
  if (!validate()) return;

  loading.value = true;
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    saveSession(data);
    emit('session-change');
    emit('navigate', '/dashboard');
  } catch (error) {
    serverError.value = error.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.login__panel {
  width: min(100%, 28rem);
  padding: 1.25rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 1.25rem;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
}

.login__brand {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

.login__mark {
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  color: #fff;
  font-weight: 800;
  border-radius: 1rem;
  background: linear-gradient(135deg, var(--primary), var(--success));
}

.login__brand h1,
.login__brand p {
  margin: 0;
}

.login__brand p {
  color: var(--muted);
}

.login__form fieldset {
  display: grid;
  gap: 1rem;
  padding: 0;
  border: 0;
}

.login__form legend {
  margin-bottom: 0.75rem;
  font-size: 1.35rem;
  font-weight: 800;
}

.login__field {
  display: grid;
  gap: 0.45rem;
  color: var(--ink);
  font-weight: 650;
}

.login__field input {
  width: 100%;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--line);
  border-radius: 0.85rem;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.login__field input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

.login__field input.is-invalid {
  border-color: var(--danger);
}

.login__field small,
.login__error {
  color: var(--danger);
}

.login__button,
.login__link {
  width: 100%;
  margin-top: 1rem;
  padding: 0.9rem 1rem;
  border: 0;
  border-radius: 0.9rem;
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.login__button {
  color: #fff;
  font-weight: 800;
  background: var(--primary);
  box-shadow: 0 12px 28px rgba(59, 130, 246, 0.25);
}

.login__button:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.login__button:disabled {
  opacity: 0.65;
  cursor: wait;
}

.login__link {
  color: var(--primary);
  background: transparent;
}

@media (min-width: 640px) {
  .login__panel {
    padding: 2rem;
  }
}
</style>
