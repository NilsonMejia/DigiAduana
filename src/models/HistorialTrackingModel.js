const db = require('../config/db');

class HistorialTrackingModel {
    static async obtenerPorExpediente(idExpediente) {
        return await db('Historial_Tracking')
            .where({ id_expediente_fk: idExpediente })
            .orderBy('fecha_evento', 'desc');
    }

    static async crear(datosTracking) {
        /* datosTracking: { 
            id_expediente_fk, estado_tracking, ubicacion, 
            descripcion_evento, fecha_evento 
        } */
        const [id] = await db('Historial_Tracking').insert(datosTracking);
        return id;
    }
}

module.exports = HistorialTrackingModel;