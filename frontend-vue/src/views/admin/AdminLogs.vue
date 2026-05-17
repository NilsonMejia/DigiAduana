<template>
  <section class="premium-page">
    <div class="premium-content">
      <header class="premium-header">
        <div>
          <p class="premium-kicker"><i class="fas fa-clipboard-list"></i> Auditoria</p>
          <h1 class="premium-title">Bitacora de acciones</h1>
          <p class="premium-subtitle">Solicitudes y eventos de auditoria registrados por el mock.</p>
        </div>
      </header>

      <p v-if="error" class="premium-error">{{ error }}</p>
      <section class="premium-panel">
        <table class="premium-table">
          <thead><tr><th>Fecha</th><th>Metodo</th><th>Ruta</th><th>Estado</th><th>Usuario</th></tr></thead>
          <tbody>
            <tr v-for="item in logs" :key="item.id">
              <td>{{ new Date(item.fecha).toLocaleString() }}</td>
              <td>{{ item.metodo }}</td>
              <td>{{ item.mensaje || item.url }}</td>
              <td><span class="premium-status">{{ item.status }}</span></td>
              <td>{{ item.usuario_id || 'publico' }}</td>
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

const logs = ref([]);
const error = ref('');

onMounted(async () => {
  try {
    const response = await api('/logs?limit=100');
    logs.value = response.data || response;
  } catch (err) {
    error.value = err.message;
  }
});
</script>

<style scoped src="../premium.css"></style>
