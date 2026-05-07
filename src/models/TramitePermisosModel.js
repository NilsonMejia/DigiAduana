const db = require('../config/db');

class TramitePermisosModel {
    static async obtenerPorExpediente(idExpediente) {
        return await db('Tramites_Permisos').where({ id_expediente_fk: idExpediente });
    }

    static async crear(datosPermiso) {
        /* datosPermiso: { 
            id_expediente_fk, institucion_emisora, numero_permiso, 
            fecha_emision, fecha_vencimiento, estado_permiso 
        } */
        const [id] = await db('Tramites_Permisos').insert(datosPermiso);
        return id;
    }
}

module.exports = TramitePermisosModel;