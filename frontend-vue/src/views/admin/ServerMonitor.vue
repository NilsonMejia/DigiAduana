<template>
  <section class="monitor-page">
    <div class="monitor-bg"></div>
    <div class="monitor-shell">
      <header class="hero">
        <div>
          <p class="eyebrow"><i class="fas fa-server"></i> CU-ADM-03</p>
          <h1>Monitoreo del Servidor e Infraestructura</h1>
          <span>Telemetría corporativa, OracleDB, conexiones activas y auditoría de red.</span>
        </div>
        <div class="live-chip">
          <span></span>
          Live telemetry
        </div>
      </header>

      <section class="kpi-grid">
        <article v-for="metric in kpis" :key="metric.label" class="glass-card">
          <i :class="metric.icon"></i>
          <strong>{{ metric.value }}</strong>
          <span>{{ metric.label }}</span>
        </article>
      </section>

      <section class="chart-grid">
        <article class="chart-card">
          <header>
            <div>
              <strong>CPU últimas 24 horas</strong>
              <span>Promedio por hora en nodos API</span>
            </div>
            <span class="status-pill online">Cluster estable</span>
          </header>
          <canvas ref="cpuCanvas"></canvas>
        </article>

        <article class="chart-card">
          <header>
            <div>
              <strong>RAM últimas 24 horas</strong>
              <span>Consumo combinado Vite/API/DB pool</span>
            </div>
            <span class="status-pill warning">Picos controlados</span>
          </header>
          <canvas ref="ramCanvas"></canvas>
        </article>
      </section>

      <section class="ops-grid">
        <article class="panel">
          <header>
            <strong><i class="fas fa-database"></i> OracleDB Gateway</strong>
            <span class="status-pill online">{{ oracle.status }}</span>
          </header>
          <div class="db-health">
            <div><span>Instancia</span><strong>{{ oracle.instance }}</strong></div>
            <div><span>Latencia</span><strong>{{ oracle.latency }} ms</strong></div>
            <div><span>Pool</span><strong>{{ oracle.pool }}</strong></div>
            <div><span>Último backup</span><strong>{{ oracle.lastBackup }}</strong></div>
          </div>
        </article>

        <article class="panel">
          <header>
            <strong><i class="fas fa-network-wired"></i> Conexiones activas</strong>
            <span>{{ activeConnections.length }} sesiones</span>
          </header>
          <div class="connection-list">
            <div v-for="connection in activeConnections" :key="connection.id">
              <span>{{ connection.service }}</span>
              <strong>{{ connection.count }}</strong>
              <small>{{ connection.avgLatency }} ms promedio</small>
            </div>
          </div>
        </article>
      </section>

      <section class="panel">
        <header>
          <strong><i class="fas fa-shield-virus"></i> Auditoría de red</strong>
          <span>IPs sospechosas bloqueadas o auditadas</span>
        </header>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>IP origen</th>
                <th>País / ASN</th>
                <th>Evento</th>
                <th>Endpoint</th>
                <th>Riesgo</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in suspiciousIps" :key="entry.id">
                <td>{{ entry.ip }}</td>
                <td>{{ entry.origin }}</td>
                <td>{{ entry.event }}</td>
                <td>{{ entry.endpoint }}</td>
                <td><span class="risk" :class="entry.risk.toLowerCase()">{{ entry.risk }}</span></td>
                <td>{{ entry.action }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { Chart, Filler, Legend, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

const cpuCanvas = ref(null);
const ramCanvas = ref(null);
let cpuChart;
let ramChart;

const labels = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

const cpuSeries = ref([31, 28, 26, 25, 29, 34, 42, 56, 61, 68, 72, 66, 63, 70, 76, 81, 78, 73, 65, 58, 49, 44, 38, 33]);
const ramSeries = ref([48, 47, 46, 45, 47, 52, 57, 63, 69, 74, 76, 71, 70, 73, 78, 82, 84, 80, 74, 68, 62, 58, 54, 51]);

const oracle = {
  status: 'Online',
  instance: 'ORCL-ADUANA-PROD-01',
  latency: 18,
  pool: '42 / 80 conexiones',
  lastBackup: '2026-05-17 02:10'
};

const activeConnections = [
  { id: 1, service: 'API Express Gateway', count: 184, avgLatency: 92 },
  { id: 2, service: 'OracleDB Pool', count: 42, avgLatency: 18 },
  { id: 3, service: 'Vite Frontend Sessions', count: 316, avgLatency: 44 },
  { id: 4, service: 'Hacienda DTE Connector', count: 28, avgLatency: 380 },
  { id: 5, service: 'Navieras Tracking API', count: 67, avgLatency: 240 }
];

const suspiciousIps = [
  { id: 1, ip: '185.220.101.42', origin: 'Tor Exit / EU', event: 'Password spraying', endpoint: '/api/auth/login', risk: 'Alto', action: 'Bloqueada 24h' },
  { id: 2, ip: '45.155.205.233', origin: 'ASN-9009', event: 'JWT replay', endpoint: '/api/usuarios', risk: 'Crítico', action: 'Bloqueada permanente' },
  { id: 3, ip: '103.145.12.18', origin: 'APNIC', event: 'SQL probing', endpoint: '/api/expedientes', risk: 'Alto', action: 'WAF challenge' },
  { id: 4, ip: '201.247.88.19', origin: 'SV Telecom', event: '5 intentos fallidos', endpoint: '/api/auth/login', risk: 'Medio', action: 'MFA requerido' },
  { id: 5, ip: '190.57.44.201', origin: 'SV Business', event: 'Token expirado repetido', endpoint: '/api/dte', risk: 'Bajo', action: 'Auditada' },
  { id: 6, ip: '37.120.203.91', origin: 'VPN Provider', event: 'Path traversal', endpoint: '/uploads/../', risk: 'Alto', action: 'Bloqueada 12h' },
  { id: 7, ip: '64.227.12.80', origin: 'Cloud VPS', event: 'Rate limit excedido', endpoint: '/api/tracking', risk: 'Medio', action: 'Throttling' },
  { id: 8, ip: '181.189.12.30', origin: 'SV ISP', event: 'Sesión concurrente anómala', endpoint: '/api/reportes', risk: 'Medio', action: 'Auditada' },
  { id: 9, ip: '91.240.118.172', origin: 'Scanner Network', event: 'Header injection', endpoint: '/api/health', risk: 'Alto', action: 'Bloqueada 24h' },
  { id: 10, ip: '200.31.170.55', origin: 'Regional Partner', event: 'Refresh token inválido', endpoint: '/api/auth/perfil', risk: 'Bajo', action: 'Auditada' },
  { id: 11, ip: '89.248.165.77', origin: 'Known Scanner', event: 'Port scan HTTP', endpoint: '/', risk: 'Crítico', action: 'Bloqueada permanente' },
  { id: 12, ip: '170.82.44.129', origin: 'LATAM CDN', event: 'Payload sospechoso', endpoint: '/api/documentos', risk: 'Medio', action: 'Sandbox file scan' },
  { id: 13, ip: '138.68.99.24', origin: 'Cloud VPS', event: 'Brute force admin', endpoint: '/api/auth/login', risk: 'Crítico', action: 'Bloqueada permanente' },
  { id: 14, ip: '186.32.91.17', origin: 'Cliente SV', event: 'Cambio IP abrupto', endpoint: '/api/expedientes', risk: 'Bajo', action: 'MFA requerido' },
  { id: 15, ip: '167.94.138.62', origin: 'Internet Scanner', event: 'Fingerprinting', endpoint: '/api/health', risk: 'Medio', action: 'WAF challenge' }
];

const kpis = computed(() => [
  { label: 'CPU actual', value: `${cpuSeries.value.at(-1)}%`, icon: 'fas fa-microchip' },
  { label: 'RAM actual', value: `${ramSeries.value.at(-1)}%`, icon: 'fas fa-memory' },
  { label: 'Conexiones activas', value: activeConnections.reduce((total, item) => total + item.count, 0), icon: 'fas fa-plug' },
  { label: 'IPs críticas', value: suspiciousIps.filter((item) => item.risk === 'Crítico').length, icon: 'fas fa-shield-halved' }
]);

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { labels: { color: '#bfdbfe' } },
      tooltip: { backgroundColor: '#0f172a', borderColor: '#3b82f6', borderWidth: 1 }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.12)' } },
      y: { min: 0, max: 100, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.12)' } }
    }
  };
}

function makeChart(canvas, label, data, color) {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor: color,
        backgroundColor: `${color}22`,
        fill: true,
        tension: 0.38,
        pointRadius: 3,
        pointHoverRadius: 6
      }]
    },
    options: chartOptions()
  });
}

onMounted(() => {
  cpuChart = makeChart(cpuCanvas.value, 'CPU %', cpuSeries.value, '#60a5fa');
  ramChart = makeChart(ramCanvas.value, 'RAM %', ramSeries.value, '#22d3ee');
});

onBeforeUnmount(() => {
  cpuChart?.destroy();
  ramChart?.destroy();
});
</script>

<style scoped>
.monitor-page {
  min-height: calc(100vh - 5rem);
  position: relative;
  overflow: hidden;
  padding: clamp(1rem, 2vw, 2rem);
  color: #e2e8f0;
  background: radial-gradient(circle at 10% 20%, #0b1120, #030712);
  font-family: Inter, system-ui, sans-serif;
}

.monitor-bg {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at 78% 16%, rgba(59, 130, 246, 0.2), transparent 34rem),
    radial-gradient(circle at 15% 82%, rgba(20, 184, 166, 0.14), transparent 28rem);
  animation: pulse 8s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes pulse {
  from { opacity: 0.65; transform: scale(1); }
  to { opacity: 1; transform: scale(1.04); }
}

.monitor-shell {
  position: relative;
  z-index: 1;
  max-width: 1280px;
  margin: 0 auto;
}

.hero,
.glass-card,
.chart-card,
.panel {
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 1.35rem;
  background: rgba(15, 25, 45, 0.58);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(18px);
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
  padding: 1.5rem;
}

.eyebrow {
  display: inline-flex;
  gap: 0.45rem;
  align-items: center;
  margin: 0 0 0.7rem;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.14);
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
}

h1 {
  max-width: 860px;
  margin: 0;
  color: #fff;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1;
}

.hero span,
.chart-card span,
.panel header span,
.connection-list small,
.db-health span {
  color: #94a3b8;
}

.live-chip,
.status-pill,
.risk {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.34rem 0.7rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 900;
}

.live-chip {
  color: #a7f3d0;
  background: rgba(16, 185, 129, 0.13);
}

.live-chip span {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.12);
}

.kpi-grid,
.chart-grid,
.ops-grid {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.kpi-grid {
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
}

.chart-grid,
.ops-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.glass-card,
.chart-card,
.panel {
  padding: 1.1rem;
}

.glass-card i {
  width: 2.7rem;
  height: 2.7rem;
  display: grid;
  place-items: center;
  margin-bottom: 0.8rem;
  border-radius: 0.9rem;
  color: #bfdbfe;
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.95), rgba(59, 130, 246, 0.85));
}

.glass-card strong {
  display: block;
  color: #fff;
  font-size: 1.8rem;
}

.chart-card header,
.panel header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.chart-card strong,
.panel strong {
  display: block;
  color: #fff;
}

.chart-card canvas {
  width: 100%;
  height: 320px;
}

.online {
  color: #a7f3d0;
  background: rgba(16, 185, 129, 0.14);
}

.warning,
.medio {
  color: #fde68a;
  background: rgba(245, 158, 11, 0.14);
}

.alto {
  color: #fed7aa;
  background: rgba(249, 115, 22, 0.15);
}

.crítico {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.15);
}

.bajo {
  color: #bfdbfe;
  background: rgba(59, 130, 246, 0.14);
}

.db-health,
.connection-list {
  display: grid;
  gap: 0.75rem;
}

.db-health {
  grid-template-columns: repeat(2, 1fr);
}

.db-health div,
.connection-list div {
  padding: 0.85rem;
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.06);
}

.connection-list div {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.2rem 0.8rem;
}

.connection-list small {
  grid-column: 1 / -1;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 920px;
  border-collapse: collapse;
}

th,
td {
  padding: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
}

th {
  color: #93c5fd;
  font-size: 0.72rem;
  text-transform: uppercase;
}

td {
  color: #dbeafe;
}

@media (max-width: 980px) {
  .chart-grid,
  .ops-grid {
    grid-template-columns: 1fr;
  }

  .db-health {
    grid-template-columns: 1fr;
  }
}
</style>
