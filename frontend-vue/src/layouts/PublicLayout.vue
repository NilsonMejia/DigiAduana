<template>
  <div class="public-layout">
    <div class="public-layout__container">
      <slot />
    </div>
  </div>
</template>

<script setup>
// Layout publico: muestra las vistas de acceso abierto y consulta de seguimiento.
</script>

<style scoped>
.public-layout {
  min-height: 100vh;
  display: grid;
 
}

.public-layout__container {
  width: 100%;
}
</style>
