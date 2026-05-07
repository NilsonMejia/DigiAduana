const db = require('../config/db');

class IncotermModel {
    static async obtenerTodos() {
        return await db('Incoterms');
    }

    static async obtenerPorId(id) {
        return await db('Incoterms').where({ id_incoterm: id }).first();
    }

    static async crear(datosIncoterm) {
        /* datosIncoterm: { codigo_incoterm, descripcion } */
        const [id] = await db('Incoterms').insert(datosIncoterm);
        return id;
    }
}

module.exports = IncotermModel;