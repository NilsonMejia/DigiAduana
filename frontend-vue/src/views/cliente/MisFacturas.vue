<template>
  <section class="premium-page">
    <div class="premium-content">
      <header class="premium-header">
        <div>
          <p class="premium-kicker"><i class="fas fa-receipt"></i> Portal de cliente</p>
          <h1 class="premium-title">Mis facturas</h1>
          <p class="premium-subtitle">DTE asociados a tus operaciones visibles.</p>
        </div>
      </header>
      <p v-if="error" class="premium-error">{{ error }}</p>
      <section class="premium-panel">
        <table class="premium-table">
          <thead><tr><th>DTE</th><th>Expediente</th><th>Estado</th><th>Total</th></tr></thead>
          <tbody><tr v-for="item in dtes" :key="item.id"><td>{{ item.numero_control }}</td><td>{{ item.expediente || item.expediente_codigo }}</td><td><span class="premium-status">{{ item.estado }}</span></td><td>${{ item.total }}</td></tr></tbody>
        </table>
      </section>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../../services/api';
const dtes = ref([]);
const error = ref('');
onMounted(async () => {
  try { const response = await api('/dte'); dtes.value = response.data || response; } catch (err) { error.value = err.message; }
});
</script>

<style scoped src="../premium.css"></style>
