<template>
  <aside class="sidebar" :class="{ 'sidebar--compact': compact }">
    <RouterLink class="sidebar__brand" :to="{ name: 'RoleDashboard' }">
      <span class="sidebar__mark">DA</span>
      <span v-if="!compact">DigiAduana</span>
    </RouterLink>

    <nav class="sidebar__nav" aria-label="Navegacion principal">
      <RouterLink class="sidebar__link" :to="{ name: 'RoleDashboard' }">
        <span aria-hidden="true">⌂</span>
        <span>Dashboard</span>
      </RouterLink>

      <RouterLink
        v-for="item in menuItems"
        :key="item.name"
        class="sidebar__link"
        :to="{ name: item.name }"
      >
        <span aria-hidden="true">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../../stores/authStore';

defineProps({
  compact: {
    type: Boolean,
    default: false
  }
});

const auth = useAuthStore();

const menusByRole = {
  forwarder: [
    { label: 'Expedientes', name: 'ForwarderExpedientes', icon: 'E' },
    { label: 'Nuevo tramite', name: 'ForwarderExpedienteCreate', icon: '+' },
    { label: 'Gestion documental', name: 'ForwarderDocuments', icon: 'D' },
    { label: 'Facturacion DTE', name: 'ForwarderFacturacionDTE', icon: '$' }
  ],
  admin: [
    { label: 'Usuarios y roles', name: 'AdminUsers', icon: 'U' },
    { label: 'Backups', name: 'AdminBackups', icon: 'B' },
    { label: 'Monitoreo', name: 'AdminServerMonitor', icon: 'M' },
    { label: 'Configuracion', name: 'AdminUsers', icon: 'C' }
  ],
  supervisor: [
    { label: 'Dashboard gerencial', name: 'SupervisorDashboard', icon: 'K' },
    { label: 'Reportes operativos', name: 'SupervisorReportes', icon: 'R' }
  ],
  cliente: [
    { label: 'Mi carga', name: 'ClienteDashboard', icon: 'T' },
    { label: 'Mis facturas', name: 'ClienteFacturas', icon: 'F' }
  ],
  soporte: [
    { label: 'Incidentes', name: 'SoporteIncidentes', icon: 'I' },
    { label: 'Sesiones activas', name: 'SoporteSesiones', icon: 'S' },
    { label: 'Infraestructura', name: 'SoporteInfraestructura', icon: 'N' }
  ]
};

const menuItems = computed(() => menusByRole[auth.userRole] || []);
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border-right: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px);
}

.sidebar__brand,
.sidebar__link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sidebar__brand {
  min-height: 3rem;
  color: var(--ink);
  font-weight: 850;
}

.sidebar__mark,
.sidebar__link span:first-child {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.sidebar__mark {
  width: 2.5rem;
  height: 2.5rem;
  color: #fff;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, var(--primary), var(--success));
}

.sidebar__nav {
  display: grid;
  gap: 0.35rem;
}

.sidebar__link {
  min-height: 2.75rem;
  padding: 0.7rem 0.75rem;
  color: var(--muted);
  border-radius: 0.75rem;
}

.sidebar__link span:first-child {
  width: 1.75rem;
  height: 1.75rem;
  color: var(--primary-dark);
  border: 1px solid var(--line);
  border-radius: 0.5rem;
  background: #fff;
  font-size: 0.78rem;
  font-weight: 800;
}

.sidebar__link.router-link-active {
  color: var(--primary-dark);
  background: rgba(59, 130, 246, 0.12);
}

@media (max-width: 919px) {
  .sidebar {
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .sidebar__nav {
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }
}
</style>
