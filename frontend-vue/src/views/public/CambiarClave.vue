<template>
  <main class="change-page">
    <div class="ambient ambient-a"></div>
    <div class="ambient ambient-b"></div>

    <section class="change-card">
      <div class="brand-row">
        <div class="brand-mark">
          <img :src="iconNavbar" alt="DigiAduana" />
        </div>
        <div>
          <p class="eyebrow"><i class="fas fa-shield-halved"></i> Activacion segura</p>
          <h1>Cambia tu clave temporal</h1>
        </div>
      </div>

      <p class="copy">
        Ingresa el codigo de verificacion enviado por correo y establece tu contrasena definitiva para activar la cuenta.
      </p>

      <form class="change-form" @submit.prevent="submit">
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
          <div class="password-field">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Minimo 8 caracteres"
            />
            <button type="button" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </label>

        <label>
          Confirmar contrasena
          <input
            v-model="form.confirmPassword"
            type="password"
            autocomplete="new-password"
            placeholder="Repite la nueva contrasena"
          />
        </label>

        <p v-if="message" class="notice success"><i class="fas fa-circle-check"></i> {{ message }}</p>
        <p v-if="error" class="notice error"><i class="fas fa-circle-exclamation"></i> {{ error }}</p>

        <button class="primary-btn" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <template v-else>
            <i class="fas fa-user-check"></i>
            Activar cuenta y establecer contrasena
          </template>
        </button>
      </form>

      <button class="secondary-btn" type="button" @click="router.push({ name: 'Login' })">
        <i class="fas fa-arrow-left"></i>
        Volver al login
      </button>
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
const showPassword = ref(false);
const message = ref('');
const error = ref('');

const form = reactive({
  email: '',
  codigo: '',
  password: '',
  confirmPassword: ''
});

function validateForm() {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Escribe un correo electronico valido.';
  if (!/^\d{6}$/.test(form.codigo)) return 'El codigo debe tener 6 digitos.';
  if (form.password.length < 8) return 'La nueva contrasena debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) {
    return 'La nueva contrasena debe incluir mayusculas, minusculas y numeros.';
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
    const response = await api('/validar-codigo', {
      method: 'POST',
      body: JSON.stringify({
        email: form.email,
        codigo: form.codigo,
        nueva_password: form.password
      })
    });
    message.value = response.mensaje || 'Cuenta activada correctamente. Ya puedes iniciar sesion.';
    setTimeout(() => {
      router.push({ name: 'Login' });
    }, 1300);
  } catch (requestError) {
    error.value = requestError.message || 'No se pudo activar la cuenta.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  form.email = String(route.query.email || '').trim();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;500;600;700;800;900&display=swap');

.change-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
  padding: 1.5rem;
  color: #e2e8f0;
  background:
    radial-gradient(circle at 20% 20%, #102a43 0, transparent 32rem),
    radial-gradient(circle at 82% 70%, rgba(13, 148, 136, 0.28), transparent 30rem),
    linear-gradient(135deg, #030712 0%, #07111f 58%, #06121a 100%);
  font-family: Inter, system-ui, sans-serif;
}

.ambient {
  position: fixed;
  border-radius: 999px;
  filter: blur(70px);
  opacity: 0.34;
  pointer-events: none;
  animation: drift 9s ease-in-out infinite alternate;
}

.ambient-a {
  width: 24rem;
  height: 24rem;
  top: -8rem;
  left: -6rem;
  background: #38bdf8;
}

.ambient-b {
  width: 22rem;
  height: 22rem;
  right: -7rem;
  bottom: -7rem;
  background: #fbbf24;
  animation-delay: -3s;
}

@keyframes drift {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to { transform: translate3d(1.5rem, -1rem, 0) scale(1.07); }
}

.change-card {
  position: relative;
  z-index: 1;
  width: min(100%, 40rem);
  padding: clamp(1.35rem, 4vw, 2.4rem);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 1.5rem;
  background: rgba(8, 17, 31, 0.72);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
}

.brand-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.brand-mark {
  width: 4.25rem;
  height: 4.25rem;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 1.1rem;
  background: rgba(3, 7, 18, 0.7);
  box-shadow: 0 18px 38px rgba(56, 189, 248, 0.22);
  overflow: hidden;
}

.brand-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.24rem;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0 0 0.55rem;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  color: #bae6fd;
  background: rgba(14, 165, 233, 0.14);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(1.85rem, 6vw, 3rem);
  line-height: 1.02;
}

.copy {
  margin: 0 0 1.4rem;
  color: #a8c0d8;
  line-height: 1.6;
}

.change-form,
.change-form label {
  display: grid;
  gap: 0.7rem;
}

.change-form {
  gap: 1rem;
}

.change-form label {
  color: #dbeafe;
  font-size: 0.82rem;
  font-weight: 800;
}

input {
  width: 100%;
  min-height: 2.95rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.85rem;
  padding: 0.85rem 0.95rem;
  color: #fff;
  background: rgba(3, 7, 18, 0.55);
  font: inherit;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus {
  border-color: rgba(56, 189, 248, 0.72);
  box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.12);
}

.code-input {
  text-align: center;
  font-size: 1.35rem;
  font-weight: 900;
  letter-spacing: 0.24rem;
}

.password-field {
  display: grid;
  grid-template-columns: 1fr 3rem;
  gap: 0.5rem;
}

.password-field button,
.secondary-btn {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.85rem;
  color: #bae6fd;
  background: rgba(255, 255, 255, 0.07);
}

.notice {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0;
  padding: 0.82rem;
  border-radius: 0.85rem;
  font-weight: 800;
}

.success {
  color: #bbf7d0;
  background: rgba(22, 163, 74, 0.14);
}

.error {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.16);
}

.primary-btn,
.secondary-btn {
  min-height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  font-weight: 900;
  cursor: pointer;
}

.primary-btn {
  width: 100%;
  border: 0;
  border-radius: 0.9rem;
  color: #fff;
  background: linear-gradient(135deg, #0f766e, #2563eb);
  box-shadow: 0 16px 34px rgba(37, 99, 235, 0.28);
}

.primary-btn:disabled,
.secondary-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.secondary-btn {
  width: 100%;
  margin-top: 0.9rem;
}

.spinner {
  width: 1.2rem;
  height: 1.2rem;
  border: 2px solid rgba(255, 255, 255, 0.32);
  border-top-color: #fff;
  border-radius: 999px;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 560px) {
  .brand-row {
    align-items: flex-start;
  }

  .brand-mark {
    width: 3.4rem;
    height: 3.4rem;
  }
}
</style>
