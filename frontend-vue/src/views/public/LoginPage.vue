<template>
  <div class="login-wrapper">
    <div class="animated-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
    </div>
    
    <div class="particles" ref="particlesContainer"></div>

    <div class="login-container">
      <div class="brand-panel">
        <div class="brand-content">
          <div class="logo-3d">
            <img :src="iconNavbar" alt="Icono DigiAduana" class="logo-img" />
            
            <div class="logo-text-wrapper">
              <div class="logo-text">
                <span class="text-digi">Digi</span><span class="text-aduana">Aduana</span>
              </div>
              <span class="logo-subtitle">Automatización Inteligente</span>
            </div>
          </div>
          
          <div class="transport-icons">
            <div class="icon-card"><i class="fas fa-ship"></i><span>Marítimo</span></div>
            <div class="icon-card"><i class="fas fa-plane"></i><span>Aéreo</span></div>
            <div class="icon-card"><i class="fas fa-truck"></i><span>Terrestre</span></div>
          </div>
          
          <div class="trust-badge">
            <i class="fas fa-certificate"></i>
            <div>
              <strong>Entorno 100% seguro</strong>
              <small>Validación en tiempo real</small>
            </div>
          </div>
        </div>
      </div>

      <div class="form-panel">
        <div class="form-card">
          <div class="form-header">
            <div class="header-badge">
              <i class="fas fa-lock"></i> Área restringida
            </div>
            <h2>Acceso seguro</h2>
            <p>Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form @submit.prevent="submit">
            <div class="input-field">
              <label>
                <i class="fas fa-envelope"></i>
                <span>Correo electrónico</span>
              </label>
              <div class="input-wrapper">
                <input
                  v-model.trim="form.correo"
                  :class="{ 'error': errors.correo }"
                  type="email"
                  placeholder="nombre@empresa.com"
                  autocomplete="email"
                />
                <div class="input-focus-border"></div>
              </div>
              <small v-if="errors.correo" class="error-msg">
                <i class="fas fa-exclamation-triangle"></i> {{ errors.correo }}
              </small>
            </div>

            <div class="input-field">
              <label>
                <i class="fas fa-key"></i>
                <span>Contraseña</span>
              </label>
              <div class="input-wrapper">
                <input
                  v-model="form.password"
                  :class="{ 'error': errors.password }"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                <button type="button" class="toggle-visibility" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
                <div class="input-focus-border"></div>
              </div>
              <small v-if="errors.password" class="error-msg">
                <i class="fas fa-exclamation-triangle"></i> {{ errors.password }}
              </small>
            </div>

            <div v-if="serverError" class="server-error">
              <i class="fas fa-circle-exclamation"></i> {{ serverError }}
            </div>

            <button type="submit" class="submit-btn" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              <template v-else>
                <span>Ingresar al sistema</span>
                <i class="fas fa-arrow-right"></i>
              </template>
            </button>

            <div class="form-footer">
              <button type="button" class="footer-link" @click="router.push({ name: 'PublicTracking' })">
                <i class="fas fa-search"></i> Consultar seguimiento público
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import iconNavbar from '../../assets/icon-navbar.png';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const loading = ref(false);
const serverError = ref('');
const showPassword = ref(false);
const particlesContainer = ref(null);

const form = reactive({
  correo: '',
  password: ''
});

const errors = reactive({
  correo: '',
  password: ''
});

function validate() {
  errors.correo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo) ? '' : 'Correo electrónico inválido';
  errors.password = form.password.length >= 6 ? '' : 'La contraseña debe tener al menos 6 caracteres';
  return !errors.correo && !errors.password;
}

async function submit() {
  serverError.value = '';
  if (!validate()) return;

  loading.value = true;
  try {
    await auth.login(form);
    router.replace(route.query.redirect || { name: 'RoleDashboard' });
  } catch (error) {
    serverError.value = error.message || 'Error de autenticación. Verifica tus credenciales.';
  } finally {
    loading.value = false;
  }
}

// Crear partículas dinámicas en el fondo
function createParticles() {
  if (!particlesContainer.value) return;
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 10 + 's';
    particle.style.animationDuration = 8 + Math.random() * 10 + 's';
    particle.style.width = Math.random() * 3 + 1 + 'px';
    particle.style.height = particle.style.width;
    particlesContainer.value.appendChild(particle);
  }
}

onMounted(() => {
  if (route.query.pendiente === 'verificacion') {
    serverError.value = 'Cuenta pendiente de verificación. Revisa tu correo para activarla.';
  }
  createParticles();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;400;500;600;700;800;900&display=swap');

/* ----- Reset y fuentes ----- */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-family: 'Inter', sans-serif;
  background: radial-gradient(circle at 20% 30%, #0A1A2F, #030712);
  overflow: hidden;
}

/* Formas animadas de fondo */
.animated-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.shape {
  position: absolute;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  filter: blur(60px);
  animation: morphing 20s infinite alternate ease-in-out;
}

.shape-1 {
  width: 500px;
  height: 500px;
  top: -150px;
  left: -150px;
  background: radial-gradient(circle, #3B82F6, #1D4ED8);
  animation-duration: 25s;
}

.shape-2 {
  width: 400px;
  height: 400px;
  bottom: -100px;
  right: -100px;
  background: radial-gradient(circle, #00D4FF, #0F3B5C);
  animation-duration: 30s;
  animation-delay: -5s;
}

.shape-3 {
  width: 300px;
  height: 300px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, #FFD966, #FFB347);
  opacity: 0.2;
  filter: blur(80px);
  animation-duration: 18s;
}

.shape-4 {
  width: 250px;
  height: 250px;
  bottom: 20%;
  left: 10%;
  background: radial-gradient(circle, #8B5CF6, #3B82F6);
  opacity: 0.3;
  filter: blur(70px);
  animation-duration: 22s;
}

@keyframes morphing {
  0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: translate(0, 0) rotate(0deg); }
  50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: translate(2%, 3%) rotate(2deg); }
  100% { border-radius: 40% 50% 60% 30% / 40% 50% 60% 30%; transform: translate(-1%, 2%) rotate(-2deg); }
}

/* Partículas */
.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.particle {
  position: absolute;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: float linear infinite;
  opacity: 0;
}

@keyframes float {
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  20% { opacity: 0.6; }
  80% { opacity: 0.4; }
  100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
}

/* Contenedor principal */
.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1300px;
  width: 90%;
  background: rgba(15, 25, 45, 0.4);
  backdrop-filter: blur(15px);
  border-radius: 3rem;
  overflow: hidden;
  box-shadow: 0 30px 50px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  z-index: 2;
  transition: transform 0.3s ease;
}

/* Panel izquierdo - branding */
.brand-panel {
  background: linear-gradient(135deg, rgba(10, 30, 50, 0.8), rgba(5, 15, 30, 0.9));
  padding: 3rem 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.brand-content {
  text-align: center;
  max-width: 320px;
}

.logo-3d {
  margin-bottom: 2rem;
}

/* Estilos de la imagen del logo */
.logo-img {
  width: 110px;
  height: 110px;
  object-fit: contain;
  margin: 0 auto 1.5rem;
  display: block;
  -webkit-mask-image: radial-gradient(circle at center, black 60%, transparent 100%);
  mask-image: radial-gradient(circle at center, black 60%, transparent 100%);
  filter: drop-shadow(0 0 12px rgba(0, 212, 255, 0.5));
  animation: floatLogo 3s ease-in-out infinite;
}

@keyframes floatLogo {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Estilos del texto premium */
.logo-text-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1;
}

.logo-text {
  font-family: 'Inter', sans-serif;
  font-size: 2.8rem;
  font-weight: 900;
  letter-spacing: -1.5px;
  filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.6));
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
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: #94A3B8;
  margin-top: 8px;
  text-transform: uppercase;
}

.transport-icons {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin: 2.5rem 0 2rem;
}

.icon-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.6rem;
  border-radius: 1rem;
  text-align: center;
  width: 70px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.icon-card i {
  font-size: 1.6rem;
  color: #00D4FF;
  display: block;
  margin-bottom: 0.3rem;
}

.icon-card span {
  font-size: 0.7rem;
  color: #CBD5E1;
}

.icon-card:hover {
  transform: translateY(-5px);
  background: rgba(0, 212, 255, 0.2);
  border-color: #00D4FF;
}

.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  background: rgba(0, 0, 0, 0.4);
  padding: 0.8rem 1.2rem;
  border-radius: 2rem;
  margin-top: 1rem;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.trust-badge i {
  font-size: 1.5rem;
  color: #FFD966;
}

.trust-badge strong {
  display: block;
  font-size: 0.8rem;
  color: white;
}

.trust-badge small {
  font-size: 0.65rem;
  color: #94A3B8;
}

/* Panel derecho - formulario */
.form-panel {
  background: rgba(255, 255, 255, 0.96);
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-card {
  width: 100%;
  max-width: 380px;
}

.form-header {
  margin-bottom: 2rem;
  text-align: center;
}

.header-badge {
  display: inline-block;
  background: rgba(59, 130, 246, 0.1);
  padding: 0.3rem 0.9rem;
  border-radius: 2rem;
  font-size: 0.7rem;
  color: #3B82F6;
  margin-bottom: 1rem;
  font-weight: 600;
}

.form-header h2 {
  font-size: 2rem;
  font-weight: 800;
  color: #0A2540;
  margin-bottom: 0.5rem;
}

.form-header p {
  color: #5A6E7A;
  font-size: 0.85rem;
}

.input-field {
  margin-bottom: 1.5rem;
}

.input-field label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1F3A4F;
  margin-bottom: 0.5rem;
}

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1.5px solid #E2E8F0;
  border-radius: 1rem;
  font-size: 0.9rem;
  transition: all 0.2s;
  background: white;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #3B82F6;
}

.input-wrapper input.error {
  border-color: #EF4444;
}

.input-focus-border {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #3B82F6, #00D4FF);
  transition: width 0.3s ease;
  border-radius: 2px;
}

.input-wrapper input:focus ~ .input-focus-border {
  width: 100%;
}

.toggle-visibility {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  color: #EF4444;
  margin-top: 0.3rem;
}

.server-error {
  background: #FEF2F2;
  border-left: 3px solid #EF4444;
  padding: 0.6rem;
  border-radius: 0.6rem;
  font-size: 0.75rem;
  color: #B91C1C;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #1E3A8A, #3B82F6);
  border: none;
  padding: 0.9rem;
  border-radius: 1rem;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.submit-btn:hover::before {
  left: 100%;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-footer {
  margin-top: 1.5rem;
  text-align: center;
  display: grid;
  gap: 0.55rem;
}

.footer-link {
  background: none;
  border: none;
  color: #3B82F6;
  font-size: 0.8rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #1D4ED8;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 950px) {
  .login-container {
    grid-template-columns: 1fr;
    width: 95%;
  }
  
  .brand-panel {
    border-right: none;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding: 2rem;
  }
  
  .form-panel {
    padding: 2rem;
  }
  
  .transport-icons {
    justify-content: center;
  }
}
</style>
