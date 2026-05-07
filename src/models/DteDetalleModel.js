const db = require('../config/db');

class DteDetalleModel {
    static async obtenerPorDte(idDte) {
        return await db('Dte_Detalles').where({ id_dte_fk: idDte });
    }

    static async crear(datosDetalle) {
        /* datosDetalle: { 
            id_dte_fk, descripcion_item, cantidad, 
            precio_unitario, monto_descuento, subtotal 
        } */
        const [id] = await db('Dte_Detalles').insert(datosDetalle);
        return id;
    }
}

module.exports = DteDetalleModel;