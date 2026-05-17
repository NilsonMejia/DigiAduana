<template>
  <section class="premium-page">
    <div class="premium-content">
      <header class="premium-header">
        <div>
          <p class="premium-kicker"><i class="fas fa-sliders"></i> Configuracion</p>
          <h1 class="premium-title">Sistema e integraciones</h1>
          <p class="premium-subtitle">Parametros generales y estado de servicios conectados.</p>
        </div>
      </header>

      <p v-if="error" class="premium-error">{{ error }}</p>
      <div class="premium-grid">
        <article v-for="service in config?.integraciones || []" :key="service.nombre" class="premium-card">
          <div class="premium-card__icon"><i class="fas fa-plug-circle-bolt"></i></div>
          <strong>{{ service.nombre }}</strong>
          <span class="premium-status">{{ service.estado }}</span>
          <p>{{ service.latencia_ms }} ms</p>
        </article>
      </div>

      <section class="premium-panel">
        <h2>Parametros</h2>
        <table class="premium-table">
          <tbody>
            <tr v-for="item in config?.parametros || []" :key="item.clave">
              <td>{{ item.clave }}</td>
              <td>{{ item.valor }}</td>
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

const config = ref(null);
const error = ref('');

onMounted(async () => {
  try {
    config.value = await api('/configuracion');
  } catch (err) {
    error.value = err.message;
  }
});
</script>

<style scoped src="../premium.css"></style>
