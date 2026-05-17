<template>
  <section class="premium-page">
    <div class="premium-content">
      <header class="premium-header">
        <div>
          <p class="premium-kicker"><i class="fas fa-triangle-exclamation"></i> Soporte Tecnico</p>
          <h1 class="premium-title">Incidentes</h1>
          <p class="premium-subtitle">Eventos recientes de la API y auditoria operativa.</p>
        </div>
      </header>
      <p v-if="error" class="premium-error">{{ error }}</p>
      <section class="premium-panel">
        <table class="premium-table">
          <thead><tr><th>Fecha</th><th>Evento</th><th>Estado</th><th>Duracion</th></tr></thead>
          <tbody><tr v-for="log in logs" :key="log.id"><td>{{ new Date(log.fecha).toLocaleString() }}</td><td>{{ log.mensaje || log.url }}</td><td><span class="premium-status">{{ log.status }}</span></td><td>{{ log.duracion_ms }} ms</td></tr></tbody>
        </table>
      </section>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../../services/api';
const logs = ref([]);
const error = ref('');
onMounted(async () => {
  try { const response = await api('/logs?limit=50'); logs.value = response.data || response; } catch (err) { error.value = err.message; }
});
</script>

<style scoped src="../premium.css"></style>
