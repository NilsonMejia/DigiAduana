const db = require('../config/db');

class BitacoraSistemaModel {
    static async obtenerTodos() {
        return await db('Bitacora_Sistema').orderBy('fecha_accion', 'desc');
    }

    static async crear(datosBitacora) {
        /* datosBitacora: { id_usuario_fk, accion, modulo, detalles, ip_origen } */
        const [id] = await db('Bitacora_Sistema').insert(datosBitacora);
        return id;
    }
}

module.exports = BitacoraSistemaModel;