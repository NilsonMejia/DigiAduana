<template>
  <div class="cliente-layout">
    <Sidebar compact class="cliente-layout__sidebar" />
    <div class="cliente-layout__body">
      <Header />
      <main class="cliente-layout__content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import Sidebar from '../components/common/Sidebar.vue';
import Header from '../components/common/Header.vue';
</script>

<style scoped>
.cliente-layout {
  min-height: 100vh;
  background: var(--surface-alt);
}

.cliente-layout__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.cliente-layout__content {
  padding: 1.2rem;
}

@media (min-width: 920px) {
  .cliente-layout {
    display: grid;
    grid-template-columns: 16rem 1fr;
  }

  .cliente-layout__sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
  }

  .cliente-layout__content {
    padding: 1.75rem;
  }
}
</style>
