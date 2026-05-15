const axios = require('axios');

const baseUrl = () => process.env.HACIENDA_API_URL || `http://localhost:${process.env.PORT || 3000}/api/mock-hacienda`;

exports.firmarDocumento = (payload) => axios.post(`${baseUrl()}/firmar-documento`, payload).then((r) => r.data);
exports.registrarDte = (payload) => axios.post(`${baseUrl()}/registro-dte`, payload).then((r) => r.data);
exports.consultarContribuyente = (nit) => axios.get(`${baseUrl()}/consulta-contribuyente/${nit}`).then((r) => r.data);
