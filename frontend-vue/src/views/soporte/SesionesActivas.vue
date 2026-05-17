<template>
  <section class="premium-page">
    <div class="premium-content">
      <header class="premium-header">
        <div>
          <p class="premium-kicker"><i class="fas fa-user-clock"></i> Soporte Tecnico</p>
          <h1 class="premium-title">Sesiones activas</h1>
          <p class="premium-subtitle">Sesiones simuladas por usuario y rol.</p>
        </div>
      </header>
      <p v-if="error" class="premium-error">{{ error }}</p>
      <section class="premium-panel">
        <table class="premium-table">
          <thead><tr><th>Usuario</th><th>Rol</th><th>IP</th><th>Expira</th></tr></thead>
          <tbody><tr v-for="item in sessions" :key="item.id"><td>{{ item.usuario }}</td><td>{{ item.rol }}</td><td>{{ item.ip }}</td><td>{{ item.expira_en_min }} min</td></tr></tbody>
        </table>
      </section>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../../services/api';
const sessions = ref([]);
const error = ref('');
onMounted(async () => {
  try { const response = await api('/sesiones'); sessions.value = response.data || response; } catch (err) { error.value = err.message; }
});
</script>

<style scoped src="../premium.css"></style>
