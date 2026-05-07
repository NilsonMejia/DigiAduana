const db = require('../config/db');

class ReciboPagoClienteModel {
    static async obtenerPorCuenta(idCuenta) {
        return await db('Recibos_Pago_Cliente').where({ id_cuenta_cobrar_fk: idCuenta });
    }

    static async crear(datosRecibo) {
        /* datosRecibo: { 
            id_cuenta_cobrar_fk, monto_pagado, metodo_pago, 
            referencia_pago, fecha_pago 
        } */
        const [id] = await db('Recibos_Pago_Cliente').insert(datosRecibo);
        return id;
    }
}

module.exports = ReciboPagoClienteModel;