const db = require('../config/db');

class ArancelSacModel {
    static async obtenerTodos() {
        return await db('Aranceles_SAC');
    }

    static async obtenerPorCodigo(codigoSac) {
        return await db('Aranceles_SAC').where({ codigo_sac: codigoSac }).first();
    }

    static async crear(datosArancel) {
        /* datosArancel: { codigo_sac, descripcion, porcentaje_dai, requiere_permiso } */
        const [id] = await db('Aranceles_SAC').insert(datosArancel);
        return id;
    }
}

module.exports = ArancelSacModel;