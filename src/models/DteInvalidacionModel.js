const db = require('../config/db');

class DteInvalidacionModel {
    static async crear(datosInvalidacion) {
        /* datosInvalidacion: { 
            id_dte_fk, motivo_invalidacion, sello_recepcion_invalidacion, 
            estado_invalidacion, fecha_solicitud 
        } */
        const [id] = await db('Dte_Invalidacion').insert(datosInvalidacion);
        return id;
    }
}

module.exports = DteInvalidacionModel;