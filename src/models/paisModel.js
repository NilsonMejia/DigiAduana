const db = require('../config/db');

class PaisModel {
    
    static async obtenerTodos() {
        return await db('Paises').select('id_pais', 'nombre_pais', 'codigo_iso');
    }

    static async obtenerPorId(id) {
        return await db('Paises').where({ id_pais: id }).first();
    }

    
    static async crear(datosPais) {
        const [id] = await db('Paises').insert(datosPais);
        return id;
    }
}

module.exports = PaisModel;