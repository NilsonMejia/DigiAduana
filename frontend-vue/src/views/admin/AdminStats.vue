<template>
  <section class="premium-page">
    <div class="premium-content">
      <header class="premium-header">
        <div>
          <p class="premium-kicker"><i class="fas fa-chart-line"></i> Estadisticas</p>
          <h1 class="premium-title">Indicadores globales</h1>
          <p class="premium-subtitle">Distribuciones por estado y tipo de operacion calculadas por el API.</p>
        </div>
      </header>

      <p v-if="error" class="premium-error">{{ error }}</p>
      <div class="premium-grid">
        <article class="premium-card">
          <div class="premium-card__icon"><i class="fas fa-percent"></i></div>
          <strong>{{ dashboard?.kpis?.tasa_entrega || 0 }}%</strong>
          <span>Tasa de entrega</span>
        </article>
        <article class="premium-card">
          <div class="premium-card__icon"><i class="fas fa-weight-hanging"></i></div>
          <strong>{{ Number(dashboard?.kpis?.peso_total_kg || 0).toLocaleString() }}</strong>
          <span>Peso total kg</span>
        </article>
      </div>

      <section class="premium-panel">
        <h2>Expedientes por estado</h2>
        <table class="premium-table">
          <tbody>
            <tr v-for="[estado, total] in Object.entries(dashboard?.por_estado || {})" :key="estado">
              <td>{{ estado }}</td>
              <td><span class="premium-status">{{ total }}</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="premium-panel">
        <h2>Por tipo de operacion</h2>
        <table class="premium-table">
          <tbody>
            <tr v-for="[tipo, total] in Object.entries(dashboard?.por_tipo_operacion || {})" :key="tipo">
              <td>{{ tipo }}</td>
              <td><span class="premium-status">{{ total }}</span></td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../../services/api';

const dashboard = ref(null);
const error = ref('');

onMounted(async () => {
  try {
    dashboard.value = await api('/reportes/dashboard');
  } catch (err) {
    error.value = err.message;
  }
});
</script>

<style scoped src="../premium.css"></style>
