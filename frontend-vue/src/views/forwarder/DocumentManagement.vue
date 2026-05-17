<template>
  <section class="premium-page">
    <div class="premium-content">
      <header class="premium-header">
        <div>
          <p class="premium-kicker"><i class="fas fa-file-shield"></i> Operacion aduanera</p>
          <h1 class="premium-title">Gestion documental</h1>
          <p class="premium-subtitle">Documentos asociados a expedientes visibles para tu rol.</p>
        </div>
      </header>
      <p v-if="error" class="premium-error">{{ error }}</p>
      <section class="premium-panel">
        <table class="premium-table">
          <thead><tr><th>Expediente</th><th>Tipo</th><th>Archivo</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            <tr v-for="doc in documents" :key="doc.id">
              <td>{{ doc.expediente }}</td><td>{{ doc.tipo }}</td><td>{{ doc.nombre }}</td><td><span class="premium-status">{{ doc.estado }}</span></td><td>{{ new Date(doc.fecha_carga).toLocaleDateString() }}</td>
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
const documents = ref([]);
const error = ref('');
onMounted(async () => {
  try {
    const response = await api('/documentos');
    documents.value = response.data || response.documentos || response;
  } catch (err) {
    error.value = err.message;
  }
});
</script>

<style scoped src="../premium.css"></style>
