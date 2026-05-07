const db = require('../config/db');

class ClienteModel {
    static async obtenerTodos() {
        return await db('Clientes')
            .join('Paises', 'Clientes.id_pais_fk', '=', 'Paises.id_pais')
            .select(
                'Clientes.id_cliente', 
                'Clientes.nombre_cliente', 
                'Clientes.nit_nrc', 
                'Clientes.correo_contacto',
                'Paises.nombre_pais as pais_origen'
            );
    }

    static async obtenerPorId(id) {
        return await db('Clientes').where({ id_cliente: id }).first();
    }

    
    static async crear(datosCliente) {
        /* datosCliente debe ser: 
           { nombre_cliente, nit_nrc, direccion, telefono, correo_contacto, id_pais_fk } 
        */
        const [id] = await db('Clientes').insert(datosCliente);
        return id;
    }

    
    static async actualizar(id, datosActualizados) {
        return await db('Clientes').where({ id_cliente: id }).update(datosActualizados);
    }
}

module.exports = ClienteModel;