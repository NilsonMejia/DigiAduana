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
        <article v-for="card in metricCards" :key="card.label" class="premium-card">
          <div class="premium-card__icon"><i :class="card.icon"></i></div>
          <strong>{{ card.value }}</strong>
          <span>{{ card.label }}</span>
        </article>
      </div>

      <section class="premium-panel">
        <h2>Expedientes por estado</h2>
        <table class="premium-table">
          <tbody>
            <tr v-for="[estado, total] in Object.entries(stats.porEstado)" :key="estado">
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
            <tr v-for="[tipo, total] in Object.entries(stats.porTipoOperacion)" :key="tipo">
              <td>{{ tipo }}</td>
              <td><span class="premium-status">{{ total }}</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="premium-panel">
        <h2>Resumen documental y DTE</h2>
        <table class="premium-table">
          <tbody>
            <tr v-for="item in operationalRows" :key="item.label">
              <td>{{ item.label }}</td>
              <td><span class="premium-status">{{ item.value }}</span></td>
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

const stats = computed(() => {
  const data = dashboard.value || {};
  const expedientes = data.expedientes || {};
  const documentos = data.documentos || {};
  const dte = data.dte || {};
  const kpis = data.kpis || {};

  const totalExpedientes = Number(kpis.total_expedientes ?? expedientes.total ?? 0);
  const finalizados = Number(kpis.entregados ?? expedientes.finalizados ?? 0);
  const observados = Number(kpis.observados ?? expedientes.observado ?? 0);
  const pendientesDocumentos = Number(kpis.documentos_pendientes ?? documentos.pendientes ?? 0);
  const tasaEntrega = Number(kpis.tasa_entrega ?? (totalExpedientes ? ((finalizados / totalExpedientes) * 100).toFixed(1) : 0));

  return {
    totalExpedientes,
    finalizados,
    observados,
    pendientesDocumentos,
    tasaEntrega,
    pesoTotal: Number(kpis.peso_total_kg ?? data.cargas?.peso_total_kg ?? 0),
    valorTotal: Number(kpis.valor_fob_total ?? data.cargas?.valor_cif_total ?? 0),
    documentos,
    dte,
    porEstado: data.por_estado || {
      BORRADOR: Number(expedientes.borrador || 0),
      EN_REVISION: Number(expedientes.en_revision || 0),
      OBSERVADO: observados,
      APROBADO: Number(expedientes.aprobados || 0),
      FINALIZADO: finalizados
    },
    porTipoOperacion: data.por_tipo_operacion || {}
  };
});

const metricCards = computed(() => [
  { label: 'Expedientes totales', value: stats.value.totalExpedientes.toLocaleString(), icon: 'fas fa-folder-open' },
  { label: 'Tasa de entrega', value: `${stats.value.tasaEntrega}%`, icon: 'fas fa-percent' },
  { label: 'Documentos pendientes', value: stats.value.pendientesDocumentos.toLocaleString(), icon: 'fas fa-file-circle-exclamation' },
  { label: 'Observados', value: stats.value.observados.toLocaleString(), icon: 'fas fa-triangle-exclamation' },
  { label: 'Peso total kg', value: stats.value.pesoTotal.toLocaleString(), icon: 'fas fa-weight-hanging' },
  { label: 'Valor operativo', value: `$${stats.value.valorTotal.toLocaleString()}`, icon: 'fas fa-sack-dollar' }
]);

const operationalRows = computed(() => [
  { label: 'Documentos validados', value: Number(stats.value.documentos.validados || 0).toLocaleString() },
  { label: 'Documentos rechazados', value: Number(stats.value.documentos.rechazados || 0).toLocaleString() },
  { label: 'DTE emitidos', value: Number(stats.value.dte.total || 0).toLocaleString() },
  { label: 'DTE validados', value: Number(stats.value.dte.validados || 0).toLocaleString() },
  { label: 'Monto DTE total', value: `$${Number(stats.value.dte.monto_total || 0).toLocaleString()}` }
]);

onMounted(async () => {
  try {
    dashboard.value = await api('/reportes/dashboard');
  } catch (err) {
    error.value = err.message;
  }
});
</script>

<style scoped src="../premium.css"></style>
