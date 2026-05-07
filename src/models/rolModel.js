
const db = require('../config/db');

class RolModel {
    
    static async obtenerTodos() {
        return await db('Roles').select('id_rol', 'nombre_rol', 'descripcion');
    }

    
    static async obtenerPorId(id) {
        return await db('Roles').where({ id_rol: id }).first();
    }

    
    static async crear(datosRol) {
        /* datosRol debe ser: { nombre_rol, descripcion } */
        const [id] = await db('Roles').insert(datosRol);
        return id;
    }
}

module.exports = RolModel;