const axios = require('axios');

const baseUrl = () => process.env.NAVIERAS_API_URL || `http://localhost:${process.env.PORT || 3000}/api/mock-navieras`;

exports.transmitirManifiesto = (payload) => axios.post(`${baseUrl()}/transmitir-manifiesto`, payload).then((r) => r.data);
exports.desconsolidarBl = (payload) => axios.post(`${baseUrl()}/desconsolidar-bl`, payload).then((r) => r.data);
exports.trackingContenedor = (contenedor) => axios.get(`${baseUrl()}/tracking/${contenedor}`).then((r) => r.data);
exports.validarPrecinto = (payload) => axios.post(`${baseUrl()}/validar-precinto`, payload).then((r) => r.data);
