const db = require('../config/db');

class PagoTerceroModel {
    static async obtenerPorExpediente(idExpediente) {
        return await db('Pagos_Terceros').where({ id_expediente_fk: idExpediente });
    }

    static async crear(datosPago) {
        /* datosPago: { 
            id_expediente_fk, id_proveedor_fk, concepto_pago, 
            monto, numero_comprobante, fecha_pago 
        } */
        const [id] = await db('Pagos_Terceros').insert(datosPago);
        return id;
    }
}

module.exports = PagoTerceroModel;