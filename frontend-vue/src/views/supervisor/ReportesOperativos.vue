<template>
  <section class="premium-page">
    <div class="premium-content">
      <header class="premium-header">
        <div>
          <p class="premium-kicker"><i class="fas fa-chart-column"></i> Reportes</p>
          <h1 class="premium-title">Reportes operativos</h1>
          <p class="premium-subtitle">Indicadores por estado y tipo de operacion calculados por la API.</p>
        </div>
      </header>
      <p v-if="error" class="premium-error">{{ error }}</p>
      <div class="premium-grid">
        <article class="premium-card" v-for="[estado, total] in Object.entries(report?.por_estado || {})" :key="estado">
          <div class="premium-card__icon"><i class="fas fa-layer-group"></i></div>
          <strong>{{ total }}</strong>
          <span>{{ estado }}</span>
        </article>
      </div>
      <section class="premium-panel">
        <table class="premium-table">
          <thead><tr><th>Operacion</th><th>Total</th></tr></thead>
          <tbody><tr v-for="[tipo, total] in Object.entries(report?.por_tipo_operacion || {})" :key="tipo"><td>{{ tipo }}</td><td>{{ total }}</td></tr></tbody>
        </table>
      </section>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../../services/api';
const report = ref(null);
const error = ref('');
onMounted(async () => {
  try { report.value = await api('/reportes/dashboard'); } catch (err) { error.value = err.message; }
});
</script>

<style scoped src="../premium.css"></style>
