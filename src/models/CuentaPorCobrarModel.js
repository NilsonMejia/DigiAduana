const db = require('../config/db');

class CuentaPorCobrarModel {
    static async obtenerPorCliente(idCliente) {
        return await db('Cuentas_Por_Cobrar').where({ id_cliente_fk: idCliente });
    }

    static async crear(datosCuenta) {
        /* datosCuenta: { 
            id_cliente_fk, id_expediente_fk, monto_total, 
            saldo_pendiente, estado_cuenta, fecha_emision, fecha_vencimiento 
        } */
        const [id] = await db('Cuentas_Por_Cobrar').insert(datosCuenta);
        return id;
    }
}

module.exports = CuentaPorCobrarModel;