const db = require('../config/db');

class DetalleCargaModel {
    static async obtenerPorCarga(idCarga) {
        return await db('Detalles_Carga').where({ id_carga_fk: idCarga });
    }

    static async crear(datosDetalle) {
        /* datosDetalle: { 
            id_carga_fk, id_arancel_fk, descripcion_mercancia, 
            cantidad, valor_fob, valor_cif 
        } */
        const [id] = await db('Detalles_Carga').insert(datosDetalle);
        return id;
    }
}

module.exports = DetalleCargaModel;