<template>
  <section class="premium-page">
    <div class="premium-content">
      <header class="premium-header">
        <div>
          <p class="premium-kicker"><i class="fas fa-database"></i> Respaldos</p>
          <h1 class="premium-title">Backups del sistema</h1>
          <p class="premium-subtitle">Historial simulado de copias, tamanos y proxima ventana programada.</p>
        </div>
      </header>

      <p v-if="error" class="premium-error">{{ error }}</p>
      <article v-if="nextBackup" class="premium-card">
        <div class="premium-card__icon"><i class="fas fa-calendar-check"></i></div>
        <strong>{{ new Date(nextBackup).toLocaleString() }}</strong>
        <span>Proximo respaldo programado</span>
      </article>

      <section class="premium-panel">
        <table class="premium-table">
          <thead><tr><th>Archivo</th><th>Estado</th><th>Tamano</th><th>Fecha</th></tr></thead>
          <tbody>
            <tr v-for="item in backups" :key="item.id">
              <td>{{ item.nombre }}</td>
              <td><span class="premium-status">{{ item.estado }}</span></td>
              <td>{{ item.tamano_mb }} MB</td>
              <td>{{ new Date(item.fecha).toLocaleString() }}</td>
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

const backups = ref([]);
const nextBackup = ref('');
const error = ref('');

onMounted(async () => {
  try {
    const response = await api('/backups');
    backups.value = response.data || response;
    nextBackup.value = response.proximo;
  } catch (err) {
    error.value = err.message;
  }
});
</script>

<style scoped src="../premium.css"></style>
