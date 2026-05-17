<template>
  <section class="premium-page">
    <div class="premium-content">
      <header class="premium-header">
        <div>
          <p class="premium-kicker"><i class="fas fa-location-dot"></i> Portal de cliente</p>
          <h1 class="premium-title">Mi carga</h1>
          <p class="premium-subtitle">Trazabilidad de expedientes asociados a tu cuenta.</p>
        </div>
      </header>
      <p v-if="error" class="premium-error">{{ error }}</p>
      <section class="premium-panel">
        <table class="premium-table">
          <thead><tr><th>Codigo</th><th>Operacion</th><th>Estado</th><th>Ubicacion</th></tr></thead>
          <tbody>
            <tr v-for="item in expedientes" :key="item.id">
              <td>{{ item.codigo }}</td><td>{{ item.tipo_operacion }}</td><td><span class="premium-status">{{ item.estado }}</span></td><td>{{ item.ubicacion_actual }}</td>
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
const expedientes = ref([]);
const error = ref('');
onMounted(async () => {
  try {
    const response = await api('/expedientes?limit=50');
    expedientes.value = response.data || response;
  } catch (err) {
    error.value = err.message;
  }
});
</script>

<style scoped src="../premium.css"></style>
