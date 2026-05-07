const db = require('../config/db');

class WebhookTrackingModel {
    static async obtenerTodos() {
        return await db('Webhooks_Tracking');
    }

    static async crear(datosWebhook) {
        /* datosWebhook: { 
            id_proveedor_logistico_fk, url_webhook, eventos_suscritos, estado 
        } */
        const [id] = await db('Webhooks_Tracking').insert(datosWebhook);
        return id;
    }
}

module.exports = WebhookTrackingModel;