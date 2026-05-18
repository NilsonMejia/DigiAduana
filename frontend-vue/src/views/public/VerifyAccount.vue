<template>
  <main class="verify-page">
    <div class="animated-bg"></div>

    <section class="verify-card">
      <div class="brand-mark">
        <img :src="iconNavbar" alt="DigiAduana" />
      </div>

      <p class="eyebrow">
        <i class="fas fa-envelope-circle-check"></i>
        Verificacion de cuenta
      </p>

      <h1>{{ title }}</h1>
      <p class="copy">{{ copy }}</p>

      <div v-if="loading" class="status-card">
        <span class="spinner"></span>
        <span>Validando enlace seguro...</span>
      </div>

      <div v-else class="status-card" :class="status">
        <i :class="status === 'success' ? 'fas fa-check-circle' : 'fas fa-circle-exclamation'"></i>
        <span>{{ message }}</span>
      </div>

      <button class="primary-btn" type="button" @click="router.push({ name: 'Login' })">
        <i class="fas fa-sign-in-alt"></i>
        Ir al login
      </button>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../../services/api';
import iconNavbar from '../../assets/icon-navbar.png';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const status = ref('success');
const message = ref('');

const title = computed(() => (status.value === 'success' ? 'Cuenta activada' : 'No pudimos activar la cuenta'));
const copy = computed(() =>
  status.value === 'success'
    ? 'Tu acceso a DigiAduana quedo verificado. Ya puedes iniciar sesion con tus credenciales.'
    : 'El enlace puede estar vencido, usado o incompleto. Solicita al administrador que reenvie la verificacion.'
);

onMounted(async () => {
  const token = String(route.query.token || '').trim();

  if (!token) {
    loading.value = false;
    status.value = 'error';
    message.value = 'El enlace no incluye un token de verificacion.';
    return;
  }

  try {
    const response = await api(`/verificar?token=${encodeURIComponent(token)}`);
    status.value = 'success';
    message.value = response.mensaje || 'Cuenta verificada correctamente.';
  } catch (error) {
    status.value = 'error';
    message.value = error.message || 'Token invalido o expirado.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;500;600;700;800;900&display=swap');

.verify-page {
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

.verify-card {
  position: relative;
  z-index: 1;
  width: min(100%, 34rem);
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

.status-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.9rem;
  border-radius: 0.9rem;
  color: #bfdbfe;
  background: rgba(59, 130, 246, 0.12);
}

.status-card.success {
  color: #86efac;
  background: rgba(16, 185, 129, 0.13);
}

.status-card.error {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.14);
}

.spinner {
  width: 1.15rem;
  height: 1.15rem;
  border: 2px solid rgba(191, 219, 254, 0.28);
  border-top-color: #bfdbfe;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.primary-btn {
  width: 100%;
  min-height: 2.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border: 0;
  border-radius: 999px;
  color: #fff;
  font-weight: 900;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  box-shadow: 0 12px 30px rgba(59, 130, 246, 0.28);
  cursor: pointer;
}
</style>
