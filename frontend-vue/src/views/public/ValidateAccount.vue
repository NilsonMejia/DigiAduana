<template>
  <main class="validate-page">
    <div class="animated-bg"></div>

    <section class="validate-card">
      <div class="brand-mark">
        <img :src="iconNavbar" alt="DigiAduana" />
      </div>

      <p class="eyebrow"><i class="fas fa-user-check"></i> Activacion segura</p>
      <h1>Valida tu cuenta</h1>
      <p class="copy">Ingresa el codigo enviado por correo y define tu nueva contrasena para activar el acceso.</p>

      <form class="validate-form" @submit.prevent="submit">
        <label>
          Correo electronico
          <input v-model.trim="form.email" type="email" autocomplete="email" placeholder="nombre@empresa.com" />
        </label>

        <label>
          Codigo de verificacion
          <input
            v-model.trim="form.codigo"
            class="code-input"
            inputmode="numeric"
            maxlength="6"
            pattern="[0-9]{6}"
            autocomplete="one-time-code"
            placeholder="000000"
            @input="form.codigo = form.codigo.replace(/\D/g, '').slice(0, 6)"
          />
        </label>

        <label>
          Nueva contrasena
          <input v-model="form.password" type="password" autocomplete="new-password" placeholder="Minimo 8 caracteres" />
        </label>

        <label>
          Confirmar contrasena
          <input v-model="form.confirmPassword" type="password" autocomplete="new-password" placeholder="Repite la contrasena" />
        </label>

        <p v-if="message" class="message success">{{ message }}</p>
        <p v-if="error" class="message error">{{ error }}</p>

        <button class="primary-btn" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <template v-else><i class="fas fa-shield-halved"></i> Activar cuenta</template>
        </button>
      </form>

      <div class="actions">
        <button type="button" :disabled="resending" @click="resendCode">
          {{ resending ? 'Reenviando...' : 'Reenviar codigo' }}
        </button>
        <button type="button" @click="router.push({ name: 'Login' })">
          Ir al login
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../../services/api';
import iconNavbar from '../../assets/icon-navbar.png';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const resending = ref(false);
const message = ref('');
const error = ref('');

const form = reactive({
  email: '',
  codigo: '',
  password: '',
  confirmPassword: ''
});

function validateForm() {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Escribe un correo valido.';
  if (!/^\d{6}$/.test(form.codigo)) return 'El codigo debe tener 6 digitos.';
  if (form.password.length < 8) return 'La contrasena debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) {
    return 'La contrasena debe incluir mayusculas, minusculas y numeros.';
  }
  if (form.password !== form.confirmPassword) return 'Las contrasenas no coinciden.';
  return '';
}

async function submit() {
  message.value = '';
  error.value = validateForm();
  if (error.value) return;

  loading.value = true;
  try {
    const response = await api('/validar-cuenta', {
      method: 'POST',
      body: JSON.stringify({
        email: form.email,
        codigo: form.codigo,
        nueva_password: form.password
      })
    });
    message.value = response.mensaje || 'Cuenta activada correctamente.';
    setTimeout(() => router.push({ name: 'Login' }), 1300);
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    loading.value = false;
  }
}

async function resendCode() {
  message.value = '';
  error.value = '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    error.value = 'Escribe tu correo para reenviar el codigo.';
    return;
  }

  resending.value = true;
  try {
    const response = await api('/reenviar-codigo', {
      method: 'POST',
      body: JSON.stringify({ email: form.email })
    });
    message.value = response.mensaje || 'Codigo reenviado.';
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    resending.value = false;
  }
}

onMounted(() => {
  form.email = String(route.query.email || '').trim();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;500;600;700;800;900&display=swap');

.validate-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
  padding: 1.5rem;
  color: #e2e8f0;
  background: radial-gradient(circle at 10% 20%, #0b1120, #030712);
  font-family: Inter, system-ui, sans-serif;
}

.animated-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 75% 20%, rgba(59, 130, 246, 0.2), transparent 32rem),
    radial-gradient(circle at 20% 85%, rgba(14, 165, 233, 0.14), transparent 28rem);
  animation: pulseBg 8s ease-in-out infinite alternate;
}

@keyframes pulseBg {
  from { opacity: 0.6; transform: scale(1); }
  to { opacity: 1; transform: scale(1.04); }
}

.validate-card {
  position: relative;
  z-index: 1;
  width: min(100%, 36rem);
  padding: clamp(1.5rem, 4vw, 2.3rem);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.5rem;
  background: rgba(15, 25, 45, 0.72);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(18px);
}

.brand-mark {
  width: 4rem;
  height: 4rem;
  display: grid;
  place-items: center;
  margin-bottom: 1rem;
  border-radius: 1.1rem;
  background: rgba(3, 7, 18, 0.62);
  box-shadow: 0 18px 38px rgba(59, 130, 246, 0.28);
  overflow: hidden;
}

.brand-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.22rem;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0 0 0.75rem;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.14);
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(2rem, 6vw, 3.25rem);
  line-height: 1;
}

.copy {
  margin: 0.9rem 0 1.25rem;
  color: #94a3b8;
}

.validate-form,
.validate-form label {
  display: grid;
  gap: 0.75rem;
}

.validate-form label {
  color: #dbeafe;
  font-weight: 800;
}

input {
  width: 100%;
  min-height: 2.85rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.85rem;
  padding: 0.82rem 0.95rem;
  color: #fff;
  background: rgba(3, 7, 18, 0.5);
  font: inherit;
}

.code-input {
  text-align: center;
  font-size: 1.35rem;
  font-weight: 900;
  letter-spacing: 0.22rem;
}

.message {
  margin: 0;
  padding: 0.8rem;
  border-radius: 0.85rem;
  font-weight: 800;
}

.success {
  color: #86efac;
  background: rgba(16, 185, 129, 0.13);
}

.error {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.14);
}

.primary-btn,
.actions button {
  min-height: 2.85rem;
  border-radius: 999px;
  font-weight: 900;
  cursor: pointer;
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border: 0;
  color: #fff;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  box-shadow: 0 12px 30px rgba(59, 130, 246, 0.28);
}

.primary-btn:disabled,
.actions button:disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

.actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.actions button {
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #bfdbfe;
  background: rgba(255, 255, 255, 0.06);
}

.spinner {
  width: 1.15rem;
  height: 1.15rem;
  border: 2px solid rgba(255, 255, 255, 0.28);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 520px) {
  .actions {
    grid-template-columns: 1fr;
  }
}
</style>
