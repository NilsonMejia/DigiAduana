<template>
  <component :is="$route.meta.layout || 'div'">
    <RouterView />
  </component>
</template>

<script setup>
// App solo decide el layout activo. Las vistas y guards viven en el router.
</script>
