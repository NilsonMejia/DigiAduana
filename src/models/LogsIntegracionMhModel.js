
const db = require('../config/db');

class LogsIntegracionMhModel {
    static async crear(datosLog) {
        /* datosLog: { 
            id_dte_fk, endpoint_llamado, payload_enviado, 
            respuesta_mh, estado_http, fecha_intento 
        } */
        const [id] = await db('Logs_Integracion_Mh').insert(datosLog);
        return id;
    }
}

module.exports = LogsIntegracionMhModel;