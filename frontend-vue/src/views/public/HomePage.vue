<template>
  <div class="home-container">
    <div class="animated-bg"></div>
    
    <nav class="navbar">
      <div class="nav-brand">
        <div class="logo-icon">
          <i class="fas fa-passport"></i>
        </div>
        <div class="logo-text-wrapper">
          <div class="logo-text">
            <span class="text-digi">Digi</span><span class="text-aduana">Aduana</span>
          </div>
          <span class="logo-subtitle">Automatización Inteligente</span>
        </div>
      </div>
      
      <div class="nav-links">
        <button class="nav-link" @click="goToLogin">
          <i class="fas fa-sign-in-alt"></i> Iniciar sesión
        </button>
      </div>
    </nav>

    <main class="home-content">
      <section class="hero">
        <div class="hero-badge">
          <i class="fas fa-shield-alt"></i> Plataforma aduanera certificada
        </div>
        <h1>Automatización <span class="gradient">inteligente</span> de aduanas</h1>
        <p>Gestiona tus operaciones de importación y exportación con la tecnología más avanzada. Seguimiento en tiempo real, documentación digital y cumplimiento normativo.</p>
        <div class="hero-buttons">
          <button class="btn-primary" @click="scrollToTracking">
            <i class="fas fa-search"></i> Seguimiento de carga
          </button>
        </div>
      </section>

      <section id="tracking-section" class="tracking-section">
        <div class="section-header">
          <i class="fas fa-boxes"></i>
          <h2>Seguimiento de tu carga</h2>
          <p>Ingresa el código de seguimiento de tu expediente o contenedor</p>
        </div>
        <div class="tracking-card">
          <div class="tracking-input">
            <i class="fas fa-barcode"></i>
            <input 
              v-model="trackingCode" 
              type="text" 
              placeholder="Ej: EXP-2026-00123 o MAEU1234567"
              @keyup.enter="trackShipment"
            />
            <button @click="trackShipment" :disabled="trackingLoading">
              <i v-if="trackingLoading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-arrow-right"></i>
              <span>Buscar</span>
            </button>
          </div>
          <div v-if="trackingResult" class="tracking-result" :class="{ error: trackingResult.error }">
            <div class="result-icon">
              <i :class="trackingResult.error ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle'"></i>
            </div>
            <div class="result-info">
              <h4>{{ trackingResult.title }}</h4>
              <p>{{ trackingResult.message }}</p>
              <div v-if="trackingResult.details" class="result-details">
                <span><i class="fas fa-calendar"></i> {{ trackingResult.details.fecha }}</span>
                <span><i class="fas fa-map-marker-alt"></i> {{ trackingResult.details.ubicacion }}</span>
                <span><i class="fas fa-flag-checkered"></i> {{ trackingResult.details.estado }}</span>
              </div>
            </div>
          </div>
          <div class="tracking-example">
            <i class="fas fa-info-circle"></i> Prueba con: <code>EXP-001</code> o <code>MAEU1234567</code>
          </div>
        </div>
      </section>

      <section class="features-section">
        <div class="section-header">
          <i class="fas fa-cogs"></i>
          <h2>¿Por qué DigiAduana?</h2>
          <p>La solución integral para el comercio exterior en El Salvador</p>
        </div>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon"><i class="fas fa-chart-line"></i></div>
            <h3>Trazabilidad en tiempo real</h3>
            <p>Sigue el estado de tus trámites aduaneros desde cualquier dispositivo.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon"><i class="fas fa-file-invoice-dollar"></i></div>
            <h3>Integración DTE</h3>
            <p>Conectado directamente con el Ministerio de Hacienda para emisión de documentos tributarios electrónicos.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon"><i class="fas fa-shield-alt"></i></div>
            <h3>Seguridad bancaria</h3>
            <p>Base de datos Oracle SQL y autenticación JWT para proteger tu información.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon"><i class="fas fa-ship"></i></div>
            <h3>Gestión multimodal</h3>
            <p>Marítimo, aéreo y terrestre en una sola plataforma.</p>
          </div>
        </div>
      </section>

      <section class="cta-section">
        <div class="cta-card">
          <h3>¿Listo para gestionar tu operación aduanera?</h3>
          <p>Accede a tu panel de control seguro.</p>
          <button class="btn-primary large" @click="goToLogin">
            <i class="fas fa-sign-in-alt"></i> Iniciar sesión
          </button>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="footer-content">
        <div class="footer-brand footer-brand-premium">
          <div class="logo-icon small">
            <i class="fas fa-passport"></i>
          </div>
          <div class="logo-text-wrapper">
            <div class="logo-text small">
              <span class="text-digi">Digi</span><span class="text-aduana">Aduana</span>
            </div>
            <span class="logo-subtitle">Automatización Inteligente</span>
          </div>
        </div>
        <div class="footer-links">
          <div class="link-group">
            <h4>Plataforma</h4>
            <a href="#" @click.prevent="goToLogin">Iniciar sesión</a>
            <a href="#" @click.prevent="scrollToTracking">Seguimiento</a>
          </div>
          <div class="link-group">
            <h4>Soporte</h4>
            <a href="#">Centro de ayuda</a>
            <a href="#">Contacto</a>
            <a href="#">Políticas</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 DigiAduana. Todos los derechos reservados.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';

const router = useRouter();
const auth = useAuthStore();

const trackingCode = ref('');
const trackingLoading = ref(false);
const trackingResult = ref(null);

function goToLogin() {
  auth.logout();
  router.push({ name: 'Login' });
}

function scrollToTracking() {
  const element = document.getElementById('tracking-section');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

async function trackShipment() {
  if (!trackingCode.value.trim()) {
    trackingResult.value = {
      error: true,
      title: 'Codigo no ingresado',
      message: 'Por favor ingresa un codigo de seguimiento valido.'
    };
    return;
  }

  trackingLoading.value = true;
  trackingResult.value = null;

  try {
    const code = trackingCode.value.trim().toUpperCase();
    const response = await api(`/tracking/${encodeURIComponent(code)}`);
    const tracking = response.expediente || response;
    const event = response.eventos?.at?.(-1) || response.historial?.at?.(-1) || {};
    trackingResult.value = {
      error: false,
      title: 'Expediente encontrado',
      message: `Tu carga esta en estado ${tracking.estado_actual || tracking.estado}.`,
      details: {
        fecha: new Date(tracking.ultima_actualizacion || tracking.fecha_creacion || event.fecha_evento || event.creado_en).toLocaleDateString(),
        ubicacion: tracking.ubicacion || event.ubicacion || 'En actualizacion',
        estado: tracking.estado_actual || tracking.estado
      }
    };
  } catch (error) {
    trackingResult.value = {
      error: true,
      title: 'No encontrado',
      message: error.message || 'No se encontro ninguna carga con ese codigo. Verifica el numero e intenta nuevamente.'
    };
  } finally {
    trackingLoading.value = false;
  }
}
</script>

<style scoped>
/* ----- GLOBAL ----- */
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;500;600;700;800;900&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.home-container {
  min-height: 100vh;
  background: radial-gradient(circle at 10% 20%, #0B1120, #030712);
  font-family: 'Inter', sans-serif;
  color: #E2E8F0;
  position: relative;
}

.animated-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: radial-gradient(circle at 70% 30%, rgba(59, 130, 246, 0.08), transparent 70%);
  animation: pulseBg 8s infinite alternate;
}

@keyframes pulseBg {
  0% { opacity: 0.3; transform: scale(1); }
  100% { opacity: 0.7; transform: scale(1.05); }
}

/* ----- NAVBAR ----- */
.navbar {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 2rem;
  background: rgba(15, 25, 45, 0.6);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  flex-wrap: wrap;
  gap: 1rem;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  position: relative;
  background: radial-gradient(circle at center, rgba(59, 130, 246, 0.1), transparent 70%);
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #1E3A8A, #3B82F6);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: white;
  box-shadow: 0 8px 20px rgba(59,130,246,0.4);
  transition: transform 0.3s ease;
}

.logo-icon.small {
  width: 36px;
  height: 36px;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(59,130,246,0.3);
}

.nav-brand:hover .logo-icon {
  transform: scale(1.1) rotate(-5deg);
}

.logo-text-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1;
}

.logo-text {
  font-family: 'Inter', sans-serif;
  font-size: 1.9rem;
  font-weight: 900;
  letter-spacing: -1.5px;
  filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.6));
}

.logo-text.small {
  font-size: 1.4rem;
}

.text-digi {
  background: linear-gradient(180deg, #00D4FF 0%, #0066FF 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.text-aduana {
  background: linear-gradient(180deg, #FFFFFF 0%, #A0B4CE 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.logo-subtitle {
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: #94A3B8;
  margin-top: 3px;
  text-transform: uppercase;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 2rem;
  padding: 0.5rem 1.2rem;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3B82F6;
}

/* ----- CONTENIDO PRINCIPAL ----- */
.home-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Hero section */
.hero {
  text-align: center;
  padding: 4rem 1rem 5rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(59, 130, 246, 0.15);
  padding: 0.4rem 1rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  color: #93C5FD;
  margin-bottom: 1.5rem;
}

.hero h1 {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #FFFFFF, #CBD5E1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero h1 .gradient {
  background: linear-gradient(135deg, #3B82F6, #00D4FF);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero p {
  max-width: 700px;
  margin: 0 auto 2rem;
  color: #94A3B8;
  font-size: 1.1rem;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem 1.8rem;
  border-radius: 2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #1E3A8A, #3B82F6);
  color: white;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.btn-primary.large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-secondary:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3B82F6;
  transform: translateY(-2px);
}

/* Sección de seguimiento */
.tracking-section {
  margin: 4rem 0;
  text-align: center;
}

.section-header {
  text-align: center;
  margin-bottom: 2rem;
}

.section-header i {
  font-size: 2rem;
  color: #3B82F6;
  margin-bottom: 0.5rem;
}

.section-header h2 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.section-header p {
  color: #94A3B8;
}

.tracking-card {
  max-width: 700px;
  margin: 0 auto;
  background: rgba(15, 25, 45, 0.5);
  backdrop-filter: blur(12px);
  border-radius: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
}

.tracking-input {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 3rem;
  padding: 0.2rem 0.2rem 0.2rem 1rem;
  border: 1px solid rgba(59, 130, 246, 0.3);
  transition: all 0.3s;
}

.tracking-input:focus-within {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.tracking-input i {
  color: #5A6E7A;
}

.tracking-input input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 1rem 0;
  color: white;
  font-size: 1rem;
}

.tracking-input input:focus {
  outline: none;
}

.tracking-input button {
  background: linear-gradient(135deg, #1E3A8A, #3B82F6);
  border: none;
  border-radius: 2rem;
  padding: 0.7rem 1.5rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.tracking-input button:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
}

.tracking-input button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tracking-result {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 1rem;
  display: flex;
  gap: 1rem;
  text-align: left;
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

.tracking-result.error {
  background: rgba(239, 68, 68, 0.15);
  border-left: 3px solid #EF4444;
}

.tracking-result:not(.error) {
  background: rgba(16, 185, 129, 0.15);
  border-left: 3px solid #10B981;
}

.result-icon i {
  font-size: 1.5rem;
}

.tracking-result.error .result-icon i {
  color: #FCA5A5;
}

.tracking-result:not(.error) .result-icon i {
  color: #6EE7B7;
}

.result-info h4 {
  margin-bottom: 0.25rem;
  color: white;
}

.result-info p {
  color: #CBD5E1;
  font-size: 0.85rem;
}

.result-details {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.75rem;
  color: #94A3B8;
}

.result-details i {
  margin-right: 0.2rem;
}

.tracking-example {
  margin-top: 1rem;
  font-size: 0.7rem;
  color: #5A6E7A;
}

.tracking-example code {
  background: rgba(0,0,0,0.5);
  padding: 0.2rem 0.4rem;
  border-radius: 0.5rem;
  color: #60A5FA;
}

/* Características */
.features-section {
  margin: 5rem 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature-card {
  background: rgba(15, 25, 45, 0.5);
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.8rem;
  text-align: center;
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  border-color: rgba(59, 130, 246, 0.5);
}

.feature-icon {
  width: 60px;
  height: 60px;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.feature-icon i {
  font-size: 1.8rem;
  color: #3B82F6;
}

.feature-card h3 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #94A3B8;
  font-size: 0.85rem;
}

/* CTA */
.cta-section {
  margin: 4rem 0;
}

.cta-card {
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.8), rgba(59, 130, 246, 0.6));
  border-radius: 2rem;
  padding: 3rem 2rem;
  text-align: center;
  backdrop-filter: blur(8px);
}

.cta-card h3 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.cta-card p {
  margin-bottom: 1.5rem;
  color: #CBD5E1;
}

/* Footer */
.footer {
  position: relative;
  z-index: 1;
  background: rgba(15, 25, 45, 0.8);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(59, 130, 246, 0.3);
  margin-top: 3rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2rem;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.footer-brand-premium {
  text-align: center;
}

.footer-links {
  display: flex;
  gap: 3rem;
  flex-wrap: wrap;
}

.link-group h4 {
  font-size: 0.9rem;
  margin-bottom: 0.8rem;
  color: #CBD5E1;
}

.link-group a {
  display: block;
  color: #94A3B8;
  text-decoration: none;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
}

.link-group a:hover {
  color: #3B82F6;
}

.footer-bottom {
  text-align: center;
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.7rem;
  color: #5A6E7A;
}

/* Responsive */
@media (max-width: 768px) {
  .hero h1 {
    font-size: 2.2rem;
  }
  
  .navbar {
    flex-direction: column;
    text-align: center;
  }
  
  .home-content {
    padding: 1rem;
  }
  
  .tracking-input {
    flex-wrap: wrap;
    background: transparent;
    padding: 0;
  }
  
  .tracking-input input {
    width: 100%;
    background: rgba(0,0,0,0.5);
    border-radius: 2rem;
    padding: 1rem;
  }
  
  .tracking-input button {
    width: 100%;
    justify-content: center;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
  
  .footer-links {
    justify-content: center;
  }
  
  .footer-brand {
    align-items: center;
  }
}
</style>
