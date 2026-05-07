const db = require('../config/db');

class RegimenAduaneroModel {
    static async obtenerTodos() {
        return await db('Regimenes_Aduaneros');
    }

    static async crear(datosRegimen) {
        /* datosRegimen: { codigo_regimen, descripcion, tipo_movimiento } */
        const [id] = await db('Regimenes_Aduaneros').insert(datosRegimen);
        return id;
    }
}

module.exports = RegimenAduaneroModel;