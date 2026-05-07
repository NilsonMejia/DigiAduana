const db = require('../config/db');

class SucursalClienteModel {
    static async obtenerPorCliente(idCliente) {
        return await db('Sucursales_Cliente').where({ id_cliente_fk: idCliente });
    }

    static async crear(datosSucursal) {
        /* datosSucursal: { id_cliente_fk, nombre_sucursal, codigo_establecimiento_mh } */
        const [id] = await db('Sucursales_Cliente').insert(datosSucursal);
        return id;
    }
}

module.exports = SucursalClienteModel;