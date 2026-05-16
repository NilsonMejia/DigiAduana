<template>
  <div class="expediente-container">
    <div class="animated-bg"></div>
    
    <main class="form-page">
      <!-- Cabecera mejorada -->
      <header class="form-page__header">
        <div class="header-info">
          <div class="badge">Nuevo trámite</div>
          <h1>Crear expediente aduanal</h1>
          <p>Complete los datos del expediente para iniciar el proceso aduanero</p>
        </div>
        <button class="btn-back" type="button" @click="$emit('navigate', '/expedientes')">
          <i class="fas fa-arrow-left"></i> Volver al listado
        </button>
      </header>

      <!-- Formulario mejorado -->
      <form class="form-page__form" novalidate @submit.prevent="submit">
        <div class="form-grid">
          <!-- Sección: Datos generales -->
          <div class="form-section">
            <div class="section-title">
              <i class="fas fa-info-circle"></i>
              <h3>Datos generales</h3>
            </div>
            
            <div class="field-group">
              <label>
                <i class="fas fa-user"></i>
                <span>Cliente ID</span>
              </label>
              <div class="input-wrapper">
                <input 
                  v-model.number="form.cliente_id" 
                  :class="{ 'is-invalid': errors.cliente_id }" 
                  type="number" 
                  min="1"
                  placeholder="Ingrese el ID del cliente"
                />
                <div class="input-focus-border"></div>
              </div>
              <small v-if="errors.cliente_id" class="error-msg">
                <i class="fas fa-exclamation-triangle"></i> {{ errors.cliente_id }}
              </small>
            </div>

            <div class="field-group">
              <label>
                <i class="fas fa-exchange-alt"></i>
                <span>Tipo de operación</span>
              </label>
              <div class="select-wrapper">
                <select v-model="form.tipo_operacion" :class="{ 'is-invalid': errors.tipo_operacion }">
                  <option value="">Seleccione una opción</option>
                  <option value="IMPORTACION">📦 Importación</option>
                  <option value="EXPORTACION">📤 Exportación</option>
                  <option value="TRANSITO">🚚 Tránsito</option>
                  <option value="REEXPORTACION">🔄 Reexportación</option>
                </select>
                <i class="fas fa-chevron-down select-icon"></i>
              </div>
              <small v-if="errors.tipo_operacion" class="error-msg">
                <i class="fas fa-exclamation-triangle"></i> {{ errors.tipo_operacion }}
              </small>
            </div>

            <div class="field-group">
              <label>
                <i class="fas fa-flag-checkered"></i>
                <span>Régimen</span>
              </label>
              <div class="input-wrapper">
                <input 
                  v-model.trim="form.regimen" 
                  :class="{ 'is-invalid': errors.regimen }" 
                  type="text" 
                  placeholder="Ej: Importación definitiva"
                />
                <div class="input-focus-border"></div>
              </div>
              <small v-if="errors.regimen" class="error-msg">
                <i class="fas fa-exclamation-triangle"></i> {{ errors.regimen }}
              </small>
            </div>
          </div>

          <!-- Sección: Aduanas -->
          <div class="form-section">
            <div class="section-title">
              <i class="fas fa-map-marker-alt"></i>
              <h3>Puntos aduaneros</h3>
            </div>

            <div class="field-group">
              <label>
                <i class="fas fa-ship"></i>
                <span>Aduana de ingreso</span>
              </label>
              <div class="input-wrapper">
                <input 
                  v-model.trim="form.aduana_ingreso" 
                  type="text" 
                  placeholder="Ej: Aduana Marítima Acajutla"
                />
                <div class="input-focus-border"></div>
              </div>
            </div>

            <div class="field-group">
              <label>
                <i class="fas fa-truck"></i>
                <span>Aduana de salida</span>
              </label>
              <div class="input-wrapper">
                <input 
                  v-model.trim="form.aduana_salida" 
                  type="text" 
                  placeholder="Ej: San Salvador"
                />
                <div class="input-focus-border"></div>
              </div>
            </div>

            <div class="field-group full-width">
              <label>
                <i class="fas fa-file-alt"></i>
                <span>Descripción del expediente</span>
              </label>
              <div class="input-wrapper">
                <textarea 
                  v-model.trim="form.descripcion" 
                  rows="4" 
                  placeholder="Detalle operativo del expediente, mercancías, observaciones especiales..."
                ></textarea>
                <div class="input-focus-border"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mensajes de estado -->
        <div v-if="message" class="alert success">
          <i class="fas fa-check-circle"></i> {{ message }}
        </div>
        <div v-if="serverError" class="alert error">
          <i class="fas fa-times-circle"></i> {{ serverError }}
        </div>

        <!-- Botones de acción -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="resetForm">
            <i class="fas fa-eraser"></i> Limpiar formulario
          </button>
          <button class="btn-primary" type="submit" :disabled="loading">
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-save"></i>
            {{ loading ? 'Guardando...' : 'Crear expediente' }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { api } from '../services/api';

defineEmits(['navigate']);

const loading = ref(false);
const message = ref('');
const serverError = ref('');
const form = reactive({
  cliente_id: 1,
  tipo_operacion: '',
  regimen: '',
  aduana_ingreso: '',
  aduana_salida: '',
  descripcion: ''
});
const errors = reactive({
  cliente_id: '',
  tipo_operacion: '',
  regimen: ''
});

function validate() {
  errors.cliente_id = form.cliente_id > 0 ? '' : 'Seleccione un cliente válido.';
  errors.tipo_operacion = form.tipo_operacion ? '' : 'Seleccione el tipo de operación.';
  errors.regimen = form.regimen.length >= 4 ? '' : 'Ingrese un régimen claro (mínimo 4 caracteres).';
  return !errors.cliente_id && !errors.tipo_operacion && !errors.regimen;
}

function resetForm() {
  form.cliente_id = 1;
  form.tipo_operacion = '';
  form.regimen = '';
  form.aduana_ingreso = '';
  form.aduana_salida = '';
  form.descripcion = '';
  message.value = '';
  serverError.value = '';
}

async function submit() {
  message.value = '';
  serverError.value = '';
  if (!validate()) return;

  loading.value = true;
  try {
    const created = await api('/expedientes', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    message.value = `✅ Expediente ${created.codigo} creado correctamente.`;
    // Opcional: resetear solo si quieres limpiar tras éxito
    resetForm();
    // Opcional: redirigir después de 2 segundos
    setTimeout(() => {
      if (message.value) message.value = '';
    }, 5000);
  } catch (error) {
    serverError.value = error.message || 'Error al crear el expediente. Intente nuevamente.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* ----- FONDO ----- */
.expediente-container {
  min-height: 100vh;
  background: radial-gradient(circle at 10% 20%, #0B1120, #030712);
  position: relative;
  padding: 2rem;
}

.animated-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.08), transparent 70%);
  animation: pulseBg 8s infinite alternate;
}

@keyframes pulseBg {
  0% { opacity: 0.3; transform: scale(1); }
  100% { opacity: 0.7; transform: scale(1.05); }
}

/* ----- MAIN CONTENT ----- */
.form-page {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* ----- HEADER PREMIUM ----- */
.form-page__header {
  background: rgba(15, 25, 45, 0.6);
  backdrop-filter: blur(16px);
  border-radius: 2rem;
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-info .badge {
  display: inline-block;
  background: rgba(59, 130, 246, 0.2);
  padding: 0.25rem 1rem;
  border-radius: 2rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #3B82F6;
  margin-bottom: 0.75rem;
}

.header-info h1 {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem 0;
}

.header-info p {
  color: #94A3B8;
  margin: 0;
}

.btn-back {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2rem;
  padding: 0.7rem 1.5rem;
  color: #CBD5E1;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-back:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3B82F6;
  transform: translateY(-2px);
}

/* ----- FORMULARIO GLASS ----- */
.form-page__form {
  background: rgba(15, 25, 45, 0.5);
  backdrop-filter: blur(12px);
  border-radius: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.form-section {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 1.5rem;
  padding: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title i {
  font-size: 1.2rem;
  color: #3B82F6;
}

.section-title h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

/* Campos */
.field-group {
  margin-bottom: 1.5rem;
}

.field-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #CBD5E1;
  margin-bottom: 0.5rem;
}

.field-group label i {
  font-size: 0.85rem;
  color: #3B82F6;
}

.input-wrapper {
  position: relative;
}

.input-wrapper input,
.input-wrapper textarea,
.select-wrapper select {
  width: 100%;
  padding: 0.85rem 1rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  color: white;
  font-size: 0.9rem;
  transition: all 0.2s;
  font-family: inherit;
}

.select-wrapper {
  position: relative;
}

.select-wrapper select {
  appearance: none;
  cursor: pointer;
}

.select-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  pointer-events: none;
}

.input-wrapper textarea {
  resize: vertical;
  min-height: 100px;
}

.input-wrapper input:focus,
.input-wrapper textarea:focus,
.select-wrapper select:focus {
  outline: none;
  border-color: #3B82F6;
  background: rgba(0, 0, 0, 0.7);
}

.input-wrapper .input-focus-border {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #3B82F6, #00D4FF);
  transition: width 0.3s ease;
  border-radius: 2px;
}

.input-wrapper input:focus ~ .input-focus-border,
.input-wrapper textarea:focus ~ .input-focus-border {
  width: 100%;
}

.is-invalid {
  border-color: #EF4444 !important;
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: #FCA5A5;
  margin-top: 0.4rem;
}

.full-width {
  grid-column: span 2;
}

/* Mensajes de alerta */
.alert {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert.success {
  background: rgba(16, 185, 129, 0.15);
  border-left: 3px solid #10B981;
  color: #6EE7B7;
}

.alert.error {
  background: rgba(239, 68, 68, 0.15);
  border-left: 3px solid #EF4444;
  color: #FCA5A5;
}

/* Botones de acción */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 0.8rem 1.5rem;
  color: #CBD5E1;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.btn-primary {
  background: linear-gradient(135deg, #1E3A8A, #3B82F6);
  border: none;
  border-radius: 1rem;
  padding: 0.8rem 2rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .full-width {
    grid-column: span 1;
  }
  
  .form-page__header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .expediente-container {
    padding: 1rem;
  }
  
  .form-page__form {
    padding: 1.5rem;
  }
}

@media (max-width: 640px) {
  .form-actions {
    flex-direction: column;
  }
  
  .btn-primary, .btn-secondary {
    justify-content: center;
  }
}
</style>