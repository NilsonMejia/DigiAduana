<template>
  <section class="premium-page">
    <div class="premium-content">
      <header class="premium-header">
        <div>
          <p class="premium-kicker"><i class="fas fa-server"></i> Soporte Tecnico</p>
          <h1 class="premium-title">Infraestructura</h1>
          <p class="premium-subtitle">Estado de integraciones y servicios externos.</p>
        </div>
      </header>
      <p v-if="error" class="premium-error">{{ error }}</p>
      <div class="premium-grid">
        <article v-for="service in services" :key="service.nombre" class="premium-card">
          <div class="premium-card__icon"><i class="fas fa-plug-circle-check"></i></div>
          <strong>{{ service.nombre }}</strong>
          <span class="premium-status">{{ service.estado }}</span>
          <p>{{ service.latencia_ms }} ms</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../../services/api';
const services = ref([]);
const error = ref('');
onMounted(async () => {
  try { const response = await api('/integraciones/estado'); services.value = response.servicios || []; } catch (err) { error.value = err.message; }
});
</script>

<style scoped src="../premium.css"></style>
