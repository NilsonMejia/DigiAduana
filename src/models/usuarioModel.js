const db = require('../config/db');

class UsuarioModel {
    static async obtenerTodos() {
        return await db('Usuarios')
            .join('Roles', 'Usuarios.id_rol_fk', '=', 'Roles.id_rol')
            .select(
                'Usuarios.id_usuario', 
                'Usuarios.nombres', 
                'Usuarios.apellidos', 
                'Usuarios.correo', 
                'Usuarios.estado',
                'Roles.nombre_rol'
            );
    }

    static async obtenerPorId(id) {
        return await db('Usuarios').where({ id_usuario: id }).first();
    }

    static async obtenerPorCorreo(correo) {
        return await db('Usuarios').where({ correo: correo }).first();
    }

    static async crear(datosUsuario) {
        /* datosUsuario debe ser: 
           { nombres, apellidos, correo, password, id_rol_fk, estado } 
           Nota: El password DEBE venir ya encriptado desde el controlador.
        */
        const [id] = await db('Usuarios').insert(datosUsuario);
        return id;
    }

    static async actualizar(id, datosActualizados) {
        return await db('Usuarios').where({ id_usuario: id }).update(datosActualizados);
    }
}

module.exports = UsuarioModel;