const db = require('../config/db');

class ProveedorLogisticoModel {
    static async obtenerTodos() {
        return await db('Proveedores_Logisticos');
    }

    static async obtenerPorTipo(tipo) {
        return await db('Proveedores_Logisticos').where({ tipo_proveedor: tipo });
    }

    static async crear(datosProveedor) {
        /* datosProveedor: { nombre_proveedor, tipo_proveedor, contacto, telefono } */
        const [id] = await db('Proveedores_Logisticos').insert(datosProveedor);
        return id;
    }
}

module.exports = ProveedorLogisticoModel;