<template>
  <aside class="sidebar" :class="{ 'sidebar--compact': compact }">
    <RouterLink class="sidebar__brand" :to="{ name: 'RoleDashboard' }">
      <span class="sidebar__mark">DA</span>
      <span v-if="!compact">DigiAduana</span>
    </RouterLink>

    <button class="sidebar__toggle" type="button" @click="open = !open">
      <i class="fas fa-bars"></i>
      <span>Menu</span>
    </button>

    <nav class="sidebar__nav" :class="{ 'sidebar__nav--open': open }" aria-label="Navegacion principal">
      <RouterLink class="sidebar__link" :to="{ name: 'RoleDashboard' }" @click="open = false">
        <span aria-hidden="true"><i class="fas fa-gauge-high"></i></span>
        <span>Dashboard</span>
      </RouterLink>

      <RouterLink
        v-for="item in menuItems"
        :key="item.name"
        class="sidebar__link"
        :to="{ name: item.name }"
        @click="open = false"
      >
        <span aria-hidden="true"><i :class="item.icon"></i></span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useAuthStore } from '../../stores/authStore';

defineProps({
  compact: {
    type: Boolean,
    default: false
  }
});

const auth = useAuthStore();
const open = ref(false);

const menusByRole = {
  admin: [
    { label: 'Resumen', name: 'AdminDashboard', icon: 'fas fa-chart-pie' },
    { label: 'Usuarios y roles', name: 'AdminUsers', icon: 'fas fa-users-gear' },
    { label: 'Notificaciones', name: 'AdminNotifications', icon: 'fas fa-bell' },
    { label: 'Estadisticas', name: 'AdminStats', icon: 'fas fa-chart-line' },
    { label: 'Configuracion', name: 'AdminSettings', icon: 'fas fa-sliders' },
    { label: 'Respaldos', name: 'AdminBackups', icon: 'fas fa-database' },
    { label: 'Logs', name: 'AdminLogs', icon: 'fas fa-clipboard-list' }
  ],
  forwarder: [
    { label: 'Expedientes', name: 'ForwarderExpedientes', icon: 'fas fa-folder-open' },
    { label: 'Nuevo tramite', name: 'ForwarderExpedienteCreate', icon: 'fas fa-plus' },
    { label: 'Gestion documental', name: 'ForwarderDocuments', icon: 'fas fa-file-shield' },
    { label: 'Facturacion DTE', name: 'ForwarderFacturacionDTE', icon: 'fas fa-file-invoice-dollar' }
  ],
  supervisor: [
    { label: 'Dashboard gerencial', name: 'SupervisorDashboard', icon: 'fas fa-gauge' },
    { label: 'Reportes operativos', name: 'SupervisorReportes', icon: 'fas fa-chart-column' }
  ],
  cliente: [
    { label: 'Mi carga', name: 'ClienteDashboard', icon: 'fas fa-location-dot' },
    { label: 'Mis facturas', name: 'ClienteFacturas', icon: 'fas fa-receipt' }
  ],
  soporte: [
    { label: 'Incidentes', name: 'SoporteIncidentes', icon: 'fas fa-triangle-exclamation' },
    { label: 'Sesiones activas', name: 'SoporteSesiones', icon: 'fas fa-user-clock' },
    { label: 'Infraestructura', name: 'SoporteInfraestructura', icon: 'fas fa-server' }
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
  color: #e2e8f0;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(circle at 20% 0%, rgba(59, 130, 246, 0.22), transparent 18rem),
    rgba(3, 7, 18, 0.94);
  backdrop-filter: blur(18px);
}

.sidebar__brand,
.sidebar__link,
.sidebar__toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sidebar__brand {
  min-height: 3rem;
  color: #fff;
  font-weight: 900;
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
  border-radius: 0.8rem;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  box-shadow: 0 10px 26px rgba(59, 130, 246, 0.26);
}

.sidebar__toggle {
  display: none;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.8rem;
  padding: 0.75rem;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.sidebar__nav {
  display: grid;
  gap: 0.35rem;
}

.sidebar__link {
  min-height: 2.75rem;
  padding: 0.7rem 0.75rem;
  color: #94a3b8;
  border-radius: 0.85rem;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.sidebar__link span:first-child {
  width: 1.85rem;
  height: 1.85rem;
  color: #bfdbfe;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.55rem;
  background: rgba(255, 255, 255, 0.07);
  font-size: 0.84rem;
}

.sidebar__link:hover,
.sidebar__link.router-link-active {
  color: #fff;
  background: rgba(59, 130, 246, 0.16);
  transform: translateX(2px);
}

@media (max-width: 919px) {
  .sidebar {
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .sidebar__toggle {
    display: inline-flex;
  }

  .sidebar__nav {
    display: none;
  }

  .sidebar__nav--open {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  }
}
</style>
