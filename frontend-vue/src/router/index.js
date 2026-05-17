import { createRouter, createWebHistory } from 'vue-router';
import PublicLayout from '../layouts/PublicLayout.vue';
import AppLayout from '../layouts/AppLayout.vue';
import ClienteLayout from '../layouts/ClienteLayout.vue';
import { useAuthStore } from '../stores/authStore';

export const ROLE = Object.freeze({
  ADMIN: 'admin',
  FORWARDER: 'forwarder',
  SUPERVISOR: 'supervisor',
  CLIENTE: 'cliente',
  SOPORTE: 'soporte'
});

const dashboardByRole = {
  [ROLE.ADMIN]: { name: 'AdminUsers' },
  [ROLE.FORWARDER]: { name: 'ForwarderExpedientes' },
  [ROLE.SUPERVISOR]: { name: 'SupervisorDashboard' },
  [ROLE.CLIENTE]: { name: 'ClienteDashboard' },
  [ROLE.SOPORTE]: { name: 'SoporteIncidentes' }
};

const routes = [
  {
    path: '/',
    redirect: { name: 'Home' }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/public/HomePage.vue'),
    meta: { public: true, layout: PublicLayout }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/public/LoginPage.vue'),
    meta: { public: true, guestOnly: true, layout: PublicLayout }
  },
  {
    path: '/tracking/:codigo?',
    name: 'PublicTracking',
    component: () => import('../views/public/PublicTracking.vue'),
    meta: { public: true, layout: PublicLayout },
    props: (route) => ({ codigo: route.params.codigo || route.query.codigo || '' })
  },
  {
    path: '/dashboard',
    name: 'RoleDashboard',
    redirect: () => dashboardByRole[useAuthStore().userRole] || { name: 'Home' },
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    meta: { requiresAuth: true, requiredRole: [ROLE.ADMIN], layout: AppLayout },
    children: [
      {
        path: '',
        redirect: { name: 'AdminUsers' }
      },
      {
        path: 'usuarios',
        name: 'AdminUsers',
        component: () => import('../views/admin/UserManagement.vue'),
        meta: { title: 'Usuarios y roles' }
      },
      {
        path: 'backups',
        name: 'AdminBackups',
        component: () => import('../views/admin/BackupConfig.vue'),
        meta: { title: 'Backup y configuracion' }
      },
      {
        path: 'monitoreo',
        name: 'AdminServerMonitor',
        component: () => import('../views/admin/ServerMonitor.vue'),
        meta: { title: 'Monitoreo del servidor' }
      }
    ]
  },
  {
    path: '/forwarder',
    meta: { requiresAuth: true, requiredRole: [ROLE.FORWARDER], layout: AppLayout },
    children: [
      {
        path: '',
        redirect: { name: 'ForwarderExpedientes' }
      },
      {
        path: 'expedientes',
        name: 'ForwarderExpedientes',
        component: () => import('../views/forwarder/ExpedienteList.vue'),
        meta: { title: 'Expedientes' }
      },
      {
        path: 'expedientes/nuevo',
        name: 'ForwarderExpedienteCreate',
        component: () => import('../views/forwarder/ExpedienteForm.vue'),
        meta: { title: 'Nuevo expediente' }
      },
      {
        path: 'expedientes/:id',
        name: 'ForwarderExpedienteDetail',
        component: () => import('../views/forwarder/ExpedienteDetail.vue'),
        meta: { title: 'Detalle de expediente' },
        props: true
      },
      {
        path: 'documentos',
        name: 'ForwarderDocuments',
        component: () => import('../views/forwarder/DocumentManagement.vue'),
        meta: { title: 'Gestion documental' }
      },
      {
        path: 'facturacion-dte',
        name: 'ForwarderFacturacionDTE',
        component: () => import('../views/forwarder/FacturacionDTE.vue'),
        meta: { title: 'Facturacion DTE' }
      }
    ]
  },
  {
    path: '/supervisor',
    meta: { requiresAuth: true, requiredRole: [ROLE.SUPERVISOR], layout: AppLayout },
    children: [
      {
        path: '',
        redirect: { name: 'SupervisorDashboard' }
      },
      {
        path: 'dashboard',
        name: 'SupervisorDashboard',
        component: () => import('../views/supervisor/DashboardGerencial.vue'),
        meta: { title: 'Dashboard gerencial' }
      },
      {
        path: 'reportes',
        name: 'SupervisorReportes',
        component: () => import('../views/supervisor/ReportesOperativos.vue'),
        meta: { title: 'Reportes operativos' }
      }
    ]
  },
  {
    path: '/cliente',
    meta: { requiresAuth: true, requiredRole: [ROLE.CLIENTE], layout: ClienteLayout },
    children: [
      {
        path: '',
        redirect: { name: 'ClienteDashboard' }
      },
      {
        path: 'dashboard',
        name: 'ClienteDashboard',
        component: () => import('../views/cliente/ClienteDashboard.vue'),
        meta: { title: 'Dashboard cliente' }
      },
      {
        path: 'facturas',
        name: 'ClienteFacturas',
        component: () => import('../views/cliente/MisFacturas.vue'),
        meta: { title: 'Mis facturas' }
      }
    ]
  },
  {
    path: '/soporte',
    meta: { requiresAuth: true, requiredRole: [ROLE.SOPORTE], layout: AppLayout },
    children: [
      {
        path: '',
        redirect: { name: 'SoporteIncidentes' }
      },
      {
        path: 'incidentes',
        name: 'SoporteIncidentes',
        component: () => import('../views/soporte/Incidentes.vue'),
        meta: { title: 'Incidentes' }
      },
      {
        path: 'sesiones',
        name: 'SoporteSesiones',
        component: () => import('../views/soporte/SesionesActivas.vue'),
        meta: { title: 'Sesiones activas' }
      },
      {
        path: 'infraestructura',
        name: 'SoporteInfraestructura',
        component: () => import('../views/soporte/Infraestructura.vue'),
        meta: { title: 'Infraestructura' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'Home' }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  auth.checkAuth();

  if (to.meta.public) {
    if (to.meta.guestOnly && auth.isAuthenticated) {
      return dashboardByRole[auth.userRole] || { name: 'Home' };
    }
    return true;
  }

  if (!auth.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } };
  }

  const requiredRole = to.matched
    .map((record) => record.meta.requiredRole)
    .find(Boolean);

  if (requiredRole && !auth.hasRole(requiredRole)) {
    return dashboardByRole[auth.userRole] || { name: 'Home' };
  }

  return true;
});

export default router;
