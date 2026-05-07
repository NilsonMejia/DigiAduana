const db = require('../config/db');

class ExpedienteAduanalModel {
    static async obtenerTodos() {
        return await db('Expedientes_Aduanales')
            .join('Clientes', 'Expedientes_Aduanales.id_cliente_fk', '=', 'Clientes.id_cliente')
            .select(
                'Expedientes_Aduanales.id_expediente',
                'Expedientes_Aduanales.numero_referencia',
                'Expedientes_Aduanales.tipo_operacion',
                'Expedientes_Aduanales.estado',
                'Clientes.nombre_cliente'
            );
    }

    static async obtenerPorId(id) {
        return await db('Expedientes_Aduanales').where({ id_expediente: id }).first();
    }

    static async crear(datosExpediente) {
        /* datosExpediente: { 
            numero_referencia, id_cliente_fk, id_aduana_fk, id_regimen_fk, 
            tipo_operacion, estado, id_usuario_asignado_fk 
        } */
        const [id] = await db('Expedientes_Aduanales').insert(datosExpediente);
        return id;
    }

    static async actualizarEstado(id, nuevoEstado) {
        return await db('Expedientes_Aduanales')
            .where({ id_expediente: id })
            .update({ estado: nuevoEstado });
    }
}

module.exports = ExpedienteAduanalModel;