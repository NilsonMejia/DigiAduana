<template>
  <header class="topbar">
    <div>
      <p>{{ route.meta.title || 'DigiAduana' }}</p>
      <h1>{{ title }}</h1>
    </div>

    <div class="topbar__profile">
      <button class="topbar__notify" type="button" aria-label="Notificaciones" @click="goToNotifications">
        <i class="fas fa-bell"></i>
        <span v-if="notificationCount" class="topbar__notify-count">{{ notificationCount }}</span>
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
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const notificationCount = ref(0);

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

async function loadNotificationsCount() {
  if (auth.userRole !== 'admin') return;
  try {
    const response = await api('/notificaciones');
    notificationCount.value = Number(response.total ?? response.data?.length ?? response.length ?? 0);
  } catch {
    notificationCount.value = 0;
  }
}

function goToNotifications() {
  if (auth.userRole === 'admin') {
    router.push({ name: 'AdminNotifications' });
  }
}

function logout() {
  auth.logout();
  router.push({ name: 'Login' });
}

onMounted(loadNotificationsCount);
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
  position: relative;
  width: 2.4rem;
  height: 2.4rem;
  color: #fcd34d;
  font-weight: 900;
  cursor: pointer;
}

.topbar__notify-count {
  position: absolute;
  top: -0.4rem;
  right: -0.4rem;
  min-width: 1.15rem;
  height: 1.15rem;
  display: grid;
  place-items: center;
  padding: 0 0.25rem;
  color: #fff;
  border: 2px solid #0f172a;
  border-radius: 999px;
  background: #ef4444;
  font-size: 0.68rem;
  line-height: 1;
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
