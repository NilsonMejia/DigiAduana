<template>
  <main class="verify-page">
    <section class="verify-card">
      <div class="verify-card__icon">
        <i class="fas fa-envelope-circle-check"></i>
      </div>
      <p class="verify-kicker">Verificacion de cuenta</p>
      <h1>Ingresa el codigo enviado a tu correo</h1>
      <p class="verify-copy">Revisa tu bandeja de entrada y pega el codigo de 6 digitos para activar tu acceso.</p>

      <form class="verify-form" @submit.prevent="submit">
        <label>
          Correo electronico
          <input v-model.trim="form.correo" type="email" autocomplete="email" placeholder="nombre@empresa.com" />
        </label>

        <label>
          Codigo de verificacion
          <input
            v-model.trim="form.codigo"
            inputmode="numeric"
            maxlength="6"
            pattern="[0-9]{6}"
            autocomplete="one-time-code"
            placeholder="000000"
            @input="form.codigo = form.codigo.replace(/\\D/g, '').slice(0, 6)"
          />
        </label>

        <p v-if="message" class="verify-message">{{ message }}</p>
        <p v-if="error" class="verify-error">{{ error }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Verificando...' : 'Verificar cuenta' }}
        </button>
      </form>

      <button class="verify-link" type="button" :disabled="resending" @click="resendCode">
        {{ resending ? 'Generando codigo...' : 'Reenviar codigo' }}
      </button>
      <button class="verify-link" type="button" @click="router.push({ name: 'Login' })">
        Volver al inicio de sesion
      </button>
    </section>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../../services/api';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const resending = ref(false);
const message = ref('');
const error = ref('');
const form = reactive({
  correo: '',
  codigo: ''
});

async function submit() {
  message.value = '';
  error.value = '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
    error.value = 'Escribe un correo valido.';
    return;
  }
  if (!/^\d{6}$/.test(form.codigo)) {
    error.value = 'El codigo debe tener 6 digitos.';
    return;
  }

  loading.value = true;
  try {
    const response = await api('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({
        correo: form.correo,
        codigo: form.codigo
      })
    });
    message.value = response.mensaje || 'Cuenta verificada correctamente.';
    setTimeout(() => router.push({ name: 'Login' }), 1200);
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    loading.value = false;
  }
}

async function resendCode() {
  message.value = '';
  error.value = '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
    error.value = 'Escribe tu correo para reenviar el codigo.';
    return;
  }

  resending.value = true;
  try {
    const response = await api('/auth/reenviar-codigo', {
      method: 'POST',
      body: JSON.stringify({ correo: form.correo })
    });
    message.value = response.devVerificationCode
      ? `${response.mensaje} Codigo: ${response.devVerificationCode}`
      : response.mensaje || 'Codigo reenviado.';
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    resending.value = false;
  }
}

onMounted(() => {
  form.correo = String(route.query.email || '');
});
</script>

<style scoped>
.verify-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  color: #e2e8f0;
  background: radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.26), transparent 30rem), #030712;
}

.verify-card {
  width: min(100%, 31rem);
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.25rem;
  background: rgba(15, 25, 45, 0.78);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(16px);
}

.verify-card__icon {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
  color: #bfdbfe;
  border-radius: 0.9rem;
  background: rgba(59, 130, 246, 0.18);
  font-size: 1.25rem;
}

.verify-kicker,
.verify-copy,
.verify-link {
  color: #94a3b8;
}

.verify-kicker {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.verify-card h1 {
  margin: 0.45rem 0;
  color: #fff;
  font-size: clamp(1.6rem, 5vw, 2.25rem);
  line-height: 1.05;
}

.verify-copy {
  margin: 0 0 1.25rem;
}

.verify-form,
.verify-form label {
  display: grid;
  gap: 0.75rem;
}

.verify-form label {
  color: #dbeafe;
  font-weight: 700;
}

.verify-form input {
  width: 100%;
  padding: 0.85rem 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.75rem;
  color: #e2e8f0;
  background: rgba(3, 7, 18, 0.5);
  font: inherit;
}

.verify-form input[name='codigo'],
.verify-form input[autocomplete='one-time-code'] {
  text-align: center;
  font-size: 1.35rem;
  letter-spacing: 0.22rem;
  font-weight: 800;
}

.verify-form button,
.verify-link {
  min-height: 2.75rem;
  border-radius: 0.75rem;
  font-weight: 800;
}

.verify-form button {
  border: 0;
  color: #fff;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
}

.verify-form button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.verify-link:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.verify-link {
  width: 100%;
  margin-top: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
}

.verify-message,
.verify-error {
  margin: 0;
  padding: 0.75rem;
  border-radius: 0.75rem;
}

.verify-message {
  color: #86efac;
  background: rgba(16, 185, 129, 0.12);
}

.verify-error {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.14);
}
</style>
