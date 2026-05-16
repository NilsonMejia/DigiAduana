<template>
  <component :is="currentView" :session="session" @navigate="navigate" @session-change="refreshSession" />
</template>

<script setup>
import { computed, ref } from 'vue';
import { getStoredUser } from './services/api';
import LoginView from './views/LoginView.vue';
import HomePage from './views/HomePage.vue';
import DashboardView from './views/DashboardView.vue';
import ExpedientesListView from './views/ExpedientesListView.vue';
import ExpedienteFormView from './views/ExpedienteFormView.vue';
import ProfileView from './views/ProfileView.vue';
import SeguimientoClienteView from './views/SeguimientoClienteView.vue';

const route = ref(window.location.hash.replace('#', '') || '/home');
const session = ref(getStoredUser());

const routes = {
  '/login': LoginView,
  '/home': HomePage,
  '/dashboard': DashboardView,
  '/expedientes': ExpedientesListView,
  '/expedientes/nuevo': ExpedienteFormView,
  '/perfil': ProfileView,
  '/seguimiento': SeguimientoClienteView
};

const currentView = computed(() => routes[route.value] || LoginView);

function navigate(path) {
  route.value = path;
  window.location.hash = path;
}

function refreshSession() {
  session.value = getStoredUser();
}

window.addEventListener('hashchange', () => {
  route.value = window.location.hash.replace('#', '') || '/home';
});
</script>
