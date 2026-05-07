
const db = require('../config/db');

class DteContingenciaModel {
    static async crear(datosContingencia) {
        /* datosContingencia: { 
            fecha_inicio, fecha_fin, motivo_contingencia, 
            sello_recepcion_lote, estado_contingencia 
        } */
        const [id] = await db('Dte_Contingencia').insert(datosContingencia);
        return id;
    }
}

module.exports = DteContingenciaModel;