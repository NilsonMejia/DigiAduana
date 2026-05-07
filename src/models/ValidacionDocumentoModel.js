const db = require('../config/db');

class ValidacionDocumentoModel {
    static async obtenerPorDocumento(idDocumento) {
        return await db('Validaciones_Documentos').where({ id_documento_fk: idDocumento });
    }

    static async crear(datosValidacion) {
        /* datosValidacion: { 
            id_documento_fk, estado_validacion, observaciones, 
            id_usuario_valida_fk, fecha_validacion 
        } */
        const [id] = await db('Validaciones_Documentos').insert(datosValidacion);
        return id;
    }
}

module.exports = ValidacionDocumentoModel;