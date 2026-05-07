const db = require('../config/db');

class DocumentoAdjuntoModel {
    static async obtenerPorExpediente(idExpediente) {
        return await db('Documentos_Adjuntos').where({ id_expediente_fk: idExpediente });
    }

    static async crear(datosDocumento) {
        /* datosDocumento: { 
            id_expediente_fk, tipo_documento, nombre_archivo, 
            url_archivo, fecha_subida, id_usuario_sube_fk 
        } */
        const [id] = await db('Documentos_Adjuntos').insert(datosDocumento);
        return id;
    }
}

module.exports = DocumentoAdjuntoModel;