<template>
  <main class="profile">
    <header class="profile__header">
      <div>
        <p>Cuenta</p>
        <h1>Perfil de usuario</h1>
      </div>
      <button type="button" @click="$emit('navigate', '/dashboard')">Dashboard</button>
    </header>

    <section class="profile__card">
      <div class="profile__avatar">{{ initials }}</div>
      <div class="profile__info">
        <h2>{{ profile?.nombre || 'Usuario' }}</h2>
        <p>{{ profile?.correo || 'Sin correo' }}</p>
      </div>
      <dl class="profile__meta">
        <div v-for="item in profileItems" :key="item.label">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>
      <p v-if="error" class="profile__error">{{ error }}</p>
      <button class="profile__danger" type="button" @click="logout">Cerrar sesion</button>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { api, clearSession, getStoredUser } from '../services/api';

const emit = defineEmits(['navigate', 'session-change']);

const profile = ref(getStoredUser());
const error = ref('');

const initials = computed(() => {
  const name = profile.value?.nombre || 'DA';
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
});

const profileItems = computed(() => [
  { label: 'Rol', value: profile.value?.rol || 'No asignado' },
  { label: 'Cliente ID', value: profile.value?.cliente_id || 'No aplica' },
  { label: 'Estado', value: profile.value?.estado || 'Activo' }
]);

async function loadProfile() {
  error.value = '';
  try {
    profile.value = await api('/auth/perfil');
  } catch (requestError) {
    error.value = requestError.message;
  }
}

function logout() {
  clearSession();
  emit('session-change');
  emit('navigate', '/login');
}

onMounted(loadProfile);
</script>

<style scoped>
.profile {
  width: min(100%, 54rem);
  margin: 0 auto;
  padding: 1rem;
}

.profile__header,
.profile__card {
  border: 1px solid var(--line);
  border-radius: 1.25rem;
  background: var(--surface);
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.08);
}

.profile__header {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.profile__header p,
.profile__header h1,
.profile__info h2,
.profile__info p {
  margin: 0;
}

.profile__header p,
.profile__info p {
  color: var(--muted);
}

.profile__header button,
.profile__danger {
  padding: 0.75rem 0.95rem;
  border: 1px solid var(--line);
  border-radius: 0.85rem;
  background: #fff;
  transition: transform 180ms ease, border-color 180ms ease;
}

.profile__header button:hover,
.profile__danger:hover {
  transform: translateY(-1px);
}

.profile__card {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
}

.profile__avatar {
  display: grid;
  place-items: center;
  width: 5rem;
  height: 5rem;
  color: #fff;
  font-size: 1.45rem;
  font-weight: 900;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, var(--primary), var(--success));
}

.profile__meta {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.profile__meta div {
  padding: 0.9rem;
  border: 1px solid var(--line);
  border-radius: 0.9rem;
  background: #f8fafc;
}

.profile__meta dt {
  color: var(--muted);
  font-size: 0.85rem;
}

.profile__meta dd {
  margin: 0.2rem 0 0;
  font-weight: 800;
}

.profile__danger {
  color: var(--danger);
  border-color: rgba(220, 38, 38, 0.25);
}

.profile__error {
  padding: 1rem;
  color: var(--danger);
  border-radius: 0.9rem;
  background: rgba(220, 38, 38, 0.08);
}

@media (min-width: 640px) {
  .profile__meta {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 768px) {
  .profile {
    padding: 1.5rem;
  }

  .profile__header,
  .profile__card {
    grid-template-columns: auto 1fr;
    align-items: center;
  }

  .profile__header button,
  .profile__danger {
    justify-self: end;
  }

  .profile__meta,
  .profile__error {
    grid-column: 1 / -1;
  }
}
</style>
