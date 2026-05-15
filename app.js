const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const expedienteRoutes = require('./routes/expedienteRoutes');
const documentoRoutes = require('./routes/documentoRoutes');
const seguimientoRoutes = require('./routes/seguimientoRoutes');
const dteRoutes = require('./routes/dteRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const mockHacienda = require('./mocks/hacienda');
const mockNavieras = require('./mocks/navieras');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const vueDistPath = path.join(__dirname, 'frontend-vue-dist');
app.use(express.static(vueDistPath));

app.use('/api/auth', authRoutes);
app.use('/api/expedientes', expedienteRoutes);
app.use('/api/documentos', documentoRoutes);
app.use('/api/seguimiento', seguimientoRoutes);
app.use('/api/dte', dteRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/mock-hacienda', mockHacienda);
app.use('/api/mock-navieras', mockNavieras);

app.get('/api/health', (req, res) => {
  res.json({
    sistema: 'DigiAduana',
    estado: 'OK',
    fecha: new Date().toISOString()
  });
});

app.get(/^\/(?!api|uploads).*/, (req, res, next) => {
  res.sendFile(path.join(vueDistPath, 'index.html'), (error) => {
    if (error) next();
  });
});

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Recurso no encontrado' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    mensaje: err.message || 'Error interno del servidor'
  });
});

module.exports = app;
