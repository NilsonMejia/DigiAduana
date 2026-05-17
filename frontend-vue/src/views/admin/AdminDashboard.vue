<template>
  <section class="premium-page">
    <div class="premium-content">
      <header class="premium-header">
        <div>
          <p class="premium-kicker"><i class="fas fa-crown"></i> Administracion del Sistema</p>
          <h1 class="premium-title">Resumen global</h1>
          <p class="premium-subtitle">KPIs calculados desde la API simulada, actividad reciente y salud operativa.</p>
        </div>
        <button class="premium-btn" type="button" @click="load">
          <i class="fas fa-rotate"></i> Actualizar
        </button>
      </header>

      <p v-if="error" class="premium-error">{{ error }}</p>

      <div class="premium-grid">
        <article v-for="card in cards" :key="card.label" class="premium-card">
          <div class="premium-card__icon"><i :class="card.icon"></i></div>
          <strong>{{ card.value }}</strong>
          <span>{{ card.label }}</span>
        </article>
      </div>

      <section class="premium-panel">
        <h2>Expedientes recientes</h2>
        <table class="premium-table">
          <thead><tr><th>Codigo</th><th>Cliente</th><th>Estado</th><th>Operacion</th></tr></thead>
          <tbody>
            <tr v-for="item in recientes" :key="item.id">
              <td>{{ item.codigo }}</td>
              <td>{{ item.cliente }}</td>
              <td><span class="premium-status">{{ item.estado }}</span></td>
              <td>{{ item.tipo_operacion }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '../../services/api';

const dashboard = ref(null);
const error = ref('');

const cards = computed(() => {
  const k = dashboard.value?.kpis || {};
  return [
    { label: 'Expedientes', value: k.total_expedientes || 0, icon: 'fas fa-folder-open' },
    { label: 'Abiertos', value: k.abiertos || 0, icon: 'fas fa-clock' },
    { label: 'Observados', value: k.observados || 0, icon: 'fas fa-triangle-exclamation' },
    { label: 'Entregados', value: k.entregados || 0, icon: 'fas fa-circle-check' },
    { label: 'FOB total', value: `$${Number(k.valor_fob_total || 0).toLocaleString()}`, icon: 'fas fa-sack-dollar' }
  ];
});

const recientes = computed(() => dashboard.value?.recientes || []);

async function load() {
  error.value = '';
  try {
    dashboard.value = await api('/reportes/dashboard');
  } catch (err) {
    error.value = err.message;
  }
}

onMounted(load);
</script>

<style scoped src="../premium.css"></style>
