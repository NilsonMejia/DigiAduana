<template>
  <section class="premium-page">
    <div class="premium-content">
      <header class="premium-header">
        <div>
          <p class="premium-kicker"><i class="fas fa-bell"></i> Centro de alertas</p>
          <h1 class="premium-title">Notificaciones</h1>
          <p class="premium-subtitle">Avisos generados a partir de expedientes observados y documentos pendientes.</p>
        </div>
        <button class="premium-btn" @click="load"><i class="fas fa-rotate"></i> Actualizar</button>
      </header>

      <p v-if="error" class="premium-error">{{ error }}</p>
      <div class="premium-grid">
        <article v-for="item in notifications" :key="item.id" class="premium-card">
          <div class="premium-card__icon"><i :class="iconFor(item.tipo)"></i></div>
          <strong>{{ item.titulo }}</strong>
          <p>{{ item.mensaje }}</p>
          <span>{{ new Date(item.fecha).toLocaleString() }}</span>
        </article>
      </div>
      <p v-if="!error && !notifications.length" class="premium-empty">No hay alertas activas.</p>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../../services/api';

const notifications = ref([]);
const error = ref('');

function iconFor(type) {
  return type === 'danger' ? 'fas fa-circle-exclamation' : type === 'warning' ? 'fas fa-triangle-exclamation' : 'fas fa-circle-info';
}

async function load() {
  error.value = '';
  try {
    const response = await api('/notificaciones');
    notifications.value = response.data || response;
  } catch (err) {
    error.value = err.message;
  }
}

onMounted(load);
</script>

<style scoped src="../premium.css"></style>
