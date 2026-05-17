<template>
  <main class="home">
    <section class="home__panel">
      <header class="home__header">
        <span class="home__mark">DA</span>
        <div>
          <h1>DigiAduana</h1>
          <p>Consulta publica de seguimiento de expedientes aduaneros.</p>
        </div>
      </header>

      <form class="home__search" @submit.prevent="searchTracking">
        <label>
          Código de seguimiento
          <input v-model.trim="codigo" type="search" placeholder="Ej. EXP-2026-0001" />
        </label>
        <button type="submit">Consultar</button>
      </form>

      <p v-if="error" class="home__error">{{ error }}</p>

      <footer class="home__footer">
        <RouterLink :to="{ name: 'Login' }">Acceso para usuarios internos</RouterLink>
      </footer>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const codigo = ref('');
const error = ref('');

function searchTracking() {
  error.value = '';
  if (!codigo.value) {
    error.value = 'Ingresa un código de expediente válido.';
    return;
  }

  router.push({ name: 'PublicTracking', params: { codigo: codigo.value } });
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: var(--surface-alt);
}

.home__panel {
  width: min(100%, 46rem);
  padding: 1.5rem;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--surface);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
}

.home__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.home__mark {
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  color: #fff;
  border-radius: 0.85rem;
  background: linear-gradient(135deg, var(--primary), var(--success));
  font-weight: 800;
}

.home h1,
.home p {
  margin: 0;
}

.home p {
  color: var(--muted);
}

.home__search {
  display: grid;
  gap: 0.85rem;
}

.home__search label {
  display: grid;
  gap: 0.45rem;
  font-weight: 700;
}

.home__search input,
.home__search button {
  min-height: 3rem;
  border-radius: 0.75rem;
}

.home__search input {
  border: 1px solid var(--line);
  padding: 0 0.95rem;
}

.home__search button {
  color: #fff;
  border: 0;
  background: var(--primary);
  font-weight: 800;
}

.home__error {
  margin-top: 0.8rem;
  color: var(--danger);
}

.home__footer {
  margin-top: 1.2rem;
}

@media (min-width: 680px) {
  .home__search {
    grid-template-columns: 1fr 10rem;
    align-items: end;
  }
}
</style>
