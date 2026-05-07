const db = require('../config/db');

class CargaModel {
    static async obtenerPorExpediente(idExpediente) {
        return await db('Cargas').where({ id_expediente_fk: idExpediente });
    }

    static async crear(datosCarga) {
        /* datosCarga: { 
            id_expediente_fk, numero_contenedor, tipo_carga, 
            peso_bruto, peso_neto, unidad_medida_peso, volumen 
        } */
        const [id] = await db('Cargas').insert(datosCarga);
        return id;
    }
}

module.exports = CargaModel;