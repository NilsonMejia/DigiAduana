<template>
  <div class="app-layout">
    <Sidebar class="app-layout__sidebar" />
    <div class="app-layout__body">
      <Header />
      <main class="app-layout__content">
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
.app-layout {
  min-height: 100vh;
  background: radial-gradient(circle at 10% 20%, #0b1120, #030712);
}

.app-layout__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.app-layout__content {
  width: 100%;
  padding: 1.25rem;
}

@media (min-width: 920px) {
  .app-layout {
    display: grid;
    grid-template-columns: 18.5rem 1fr;
  }

  .app-layout__sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
  }

  .app-layout__content {
    padding: 1.75rem;
  }
}
</style>
