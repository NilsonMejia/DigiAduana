const db = require('../config/db');

class DteModel {
    static async obtenerPorExpediente(idExpediente) {
        return await db('Dte').where({ id_expediente_fk: idExpediente });
    }

    static async crear(datosDte) {
        /* datosDte: { 
            id_expediente_fk, codigo_generacion, sello_recepcion, 
            numero_control, monto_total, estado_dte, fecha_emision 
        } */
        const [id] = await db('Dte').insert(datosDte);
        return id;
    }
}

module.exports = DteModel;