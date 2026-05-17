<template>
  <header class="topbar">
    <div>
      <p>{{ route.meta.title || 'DigiAduana' }}</p>
      <h1>{{ title }}</h1>
    </div>

    <div class="topbar__profile">
      <button class="topbar__notify" type="button" aria-label="Notificaciones">
        <i class="fas fa-bell"></i>
      </button>
      <div class="topbar__avatar" aria-hidden="true">{{ initials }}</div>
      <div class="topbar__user">
        <strong>{{ auth.userName }}</strong>
        <span>{{ roleLabel }}</span>
      </div>
      <button class="topbar__logout" type="button" @click="logout">Salir</button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const title = computed(() => route.meta.title || 'Panel principal');
const initials = computed(() =>
  auth.userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
);

const roleLabels = {
  forwarder: 'Forwarder',
  admin: 'Administrador',
  supervisor: 'Supervisor',
  cliente: 'Cliente',
  soporte: 'Soporte tecnico'
};

const roleLabel = computed(() => roleLabels[auth.userRole] || 'Usuario');

function logout() {
  auth.logout();
  router.push({ name: 'Login' });
}
</script>

<style scoped>
.topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  color: #e2e8f0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(3, 7, 18, 0.74);
  backdrop-filter: blur(16px);
}

.topbar p,
.topbar h1 {
  margin: 0;
}

.topbar p {
  color: #94a3b8;
  font-size: 0.86rem;
}

.topbar h1 {
  color: #fff;
  font-size: clamp(1.15rem, 2vw, 1.55rem);
}

.topbar__profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.topbar__notify,
.topbar__logout {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.7rem;
  background: rgba(255, 255, 255, 0.08);
}

.topbar__notify {
  width: 2.4rem;
  height: 2.4rem;
  color: #fcd34d;
  font-weight: 900;
}

.topbar__avatar {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  color: #fff;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  font-weight: 800;
}

.topbar__user {
  display: none;
}

.topbar__user strong,
.topbar__user span {
  display: block;
}

.topbar__user span {
  color: #94a3b8;
  font-size: 0.83rem;
}

.topbar__logout {
  padding: 0.65rem 0.85rem;
  color: #fecaca;
  font-weight: 700;
}

@media (min-width: 680px) {
  .topbar__user {
    display: block;
  }
}
</style>
