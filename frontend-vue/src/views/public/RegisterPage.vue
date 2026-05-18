<template>
  <main class="register-page">
    <section class="register-shell">
      <aside class="register-brand">
        <div class="brand-mark">
          <img :src="iconNavbar" alt="DigiAduana" />
        </div>
        <p>Alta segura</p>
        <h1>Crea tu cuenta DigiAduana</h1>
        <span>Recibiras un codigo de 6 digitos en tu correo para activar el acceso.</span>
      </aside>

      <section class="register-card">
        <header>
          <p>Registro de usuario</p>
          <h2>Datos de acceso</h2>
        </header>

        <form class="register-form" novalidate @submit.prevent="submit">
          <label>
            Nombre completo
            <input v-model.trim="form.nombre" :class="{ 'is-invalid': errors.nombre }" type="text" autocomplete="name" placeholder="Nombre y apellido" />
            <small v-if="errors.nombre">{{ errors.nombre }}</small>
          </label>

          <label>
            Correo electronico
            <input v-model.trim="form.correo" :class="{ 'is-invalid': errors.correo }" type="email" autocomplete="email" placeholder="nombre@empresa.com" />
            <small v-if="errors.correo">{{ errors.correo }}</small>
          </label>

          <label>
            Contrasena
            <div class="password-field">
              <input
                v-model="form.password"
                :class="{ 'is-invalid': errors.password }"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Minimo 8 caracteres"
              />
              <button type="button" @click="showPassword = !showPassword">
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <small v-if="errors.password">{{ errors.password }}</small>
          </label>

          <label>
            Confirmar contrasena
            <input
              v-model="form.confirmPassword"
              :class="{ 'is-invalid': errors.confirmPassword }"
              type="password"
              autocomplete="new-password"
              placeholder="Repite tu contrasena"
            />
            <small v-if="errors.confirmPassword">{{ errors.confirmPassword }}</small>
          </label>

          <p v-if="message" class="register-message">{{ message }}</p>
          <p v-if="devCode" class="register-code">Codigo: {{ devCode }}</p>
          <p v-if="serverError" class="register-error">{{ serverError }}</p>

          <button class="register-submit" type="submit" :disabled="loading">
            {{ loading ? 'Creando cuenta...' : 'Crear cuenta y enviar codigo' }}
          </button>
        </form>

        <div class="register-actions">
          <button type="button" @click="router.push({ name: 'VerifyEmail', query: { email: form.correo } })">
            Ya tengo un codigo
          </button>
          <button type="button" @click="router.push({ name: 'Login' })">
            Iniciar sesion
          </button>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../../services/api';
import iconNavbar from '../../assets/icon-navbar.png';

const router = useRouter();
const loading = ref(false);
const showPassword = ref(false);
const message = ref('');
const serverError = ref('');
const devCode = ref('');

const form = reactive({
  nombre: '',
  correo: '',
  password: '',
  confirmPassword: ''
});

const errors = reactive({
  nombre: '',
  correo: '',
  password: '',
  confirmPassword: ''
});

function validate() {
  errors.nombre = form.nombre.length >= 3 ? '' : 'Escribe tu nombre completo.';
  errors.correo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo) ? '' : 'Escribe un correo valido.';
  errors.password = form.password.length >= 8 ? '' : 'La contrasena debe tener al menos 8 caracteres.';
  errors.confirmPassword = form.confirmPassword === form.password ? '' : 'Las contrasenas no coinciden.';
  return !errors.nombre && !errors.correo && !errors.password && !errors.confirmPassword;
}

async function submit() {
  message.value = '';
  serverError.value = '';
  devCode.value = '';
  if (!validate()) return;

  loading.value = true;
  try {
    const response = await api('/auth/registro', {
      method: 'POST',
      body: JSON.stringify({
        nombre: form.nombre,
        correo: form.correo,
        password: form.password
      })
    });
    message.value = response.mensaje || 'Cuenta creada. Revisa tu correo para copiar el codigo.';
    devCode.value = response.devVerificationCode || '';
    setTimeout(() => {
      router.push({ name: 'VerifyEmail', query: { email: form.correo } });
    }, devCode.value ? 3500 : 1200);
  } catch (error) {
    serverError.value = error.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  color: #e2e8f0;
  background:
    radial-gradient(circle at 15% 20%, rgba(59, 130, 246, 0.24), transparent 28rem),
    radial-gradient(circle at 85% 80%, rgba(14, 165, 233, 0.14), transparent 30rem),
    #030712;
}

.register-shell {
  width: min(100%, 68rem);
  display: grid;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.5rem;
  background: rgba(15, 25, 45, 0.72);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(16px);
}

.register-brand,
.register-card {
  padding: clamp(1.5rem, 4vw, 2.5rem);
}

.register-brand {
  display: grid;
  align-content: center;
  gap: 0.85rem;
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.78), rgba(3, 7, 18, 0.66));
}

.brand-mark {
  width: 4.5rem;
  height: 4.5rem;
  display: grid;
  place-items: center;
  border-radius: 1.2rem;
  background: rgba(3, 7, 18, 0.62);
  box-shadow: 0 18px 38px rgba(59, 130, 246, 0.28);
  overflow: hidden;
}

.brand-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.25rem;
}

.register-brand p,
.register-card header p {
  margin: 0;
  color: #93c5fd;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.register-brand h1,
.register-card h2 {
  margin: 0;
  color: #fff;
  line-height: 1.05;
}

.register-brand h1 {
  max-width: 22rem;
  font-size: clamp(2rem, 5vw, 3.4rem);
}

.register-brand span,
.register-actions button {
  color: #cbd5e1;
}

.register-card {
  background: rgba(3, 7, 18, 0.28);
}

.register-card header {
  margin-bottom: 1.25rem;
}

.register-card h2 {
  margin-top: 0.35rem;
  font-size: 1.65rem;
}

.register-form,
.register-form label {
  display: grid;
  gap: 0.75rem;
}

.register-form label {
  color: #dbeafe;
  font-weight: 700;
}

.register-form input {
  width: 100%;
  min-height: 2.8rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.75rem;
  color: #e2e8f0;
  background: rgba(3, 7, 18, 0.52);
  font: inherit;
}

.register-form input::placeholder {
  color: #94a3b8;
}

.register-form .is-invalid {
  border-color: #ef4444;
}

.password-field {
  position: relative;
}

.password-field button {
  position: absolute;
  top: 50%;
  right: 0.4rem;
  transform: translateY(-50%);
  width: 2.2rem;
  height: 2.2rem;
  border: 0;
  color: #94a3b8;
  background: transparent;
}

.register-form small,
.register-error {
  color: #fecaca;
}

.register-message,
.register-code,
.register-error {
  margin: 0;
  padding: 0.75rem;
  border-radius: 0.75rem;
}

.register-message {
  color: #86efac;
  background: rgba(16, 185, 129, 0.12);
}

.register-code {
  color: #bfdbfe;
  background: rgba(59, 130, 246, 0.16);
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 0.18rem;
  text-align: center;
}

.register-error {
  background: rgba(239, 68, 68, 0.14);
}

.register-submit,
.register-actions button {
  min-height: 2.75rem;
  border-radius: 0.75rem;
  font-weight: 800;
}

.register-submit {
  border: 0;
  color: #fff;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
}

.register-submit:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.register-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.register-actions button {
  flex: 1 1 10rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
}

@media (min-width: 820px) {
  .register-shell {
    grid-template-columns: 0.9fr 1.1fr;
  }
}
</style>
