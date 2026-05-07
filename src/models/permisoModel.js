const db = require('../config/db');

class PermisoModel {
    static async obtenerTodos() {
        return await db('Permisos').select('id_permiso', 'nombre_permiso', 'descripcion');
    }

    static async obtenerPorId(id) {
        return await db('Permisos').where({ id_permiso: id }).first();
    }

    static async crear(datosPermiso) {
        /* datosPermiso debe ser: { nombre_permiso, descripcion } */
        const [id] = await db('Permisos').insert(datosPermiso);
        return id;
    }
}

module.exports = PermisoModel;