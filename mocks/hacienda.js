const express = require('express');
const router = express.Router();
const crypto = require('crypto'); 

router.post('/firmar-documento', (req, res) => {
    console.log("[HACIENDA-MOCK] Aplicando firma electrónica certificada...");
    
    setTimeout(() => {
        
        const firmaFalsa = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
        res.status(200).json({
            estado: "FIRMADO",
            firma_electronica: firmaFalsa,
            mensaje: "Documento firmado exitosamente con el certificado del contribuyente."
        });
    }, 1000);
});

router.post('/registro-dte', (req, res) => {
    console.log("[HACIENDA-MOCK] Validando DTE individual...");
    
    setTimeout(() => {
        const selloRecepcion = `HAC-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000000)}`;
        res.status(200).json({
            estado: "PROCESADO",
            codigo_generacion: crypto.randomUUID().toUpperCase(),
            sello_recepcion: selloRecepcion,
            fecha_procesamiento: new Date().toISOString(),
            mensaje: "DTE validado y registrado exitosamente en el Ministerio de Hacienda."
        });
    }, 2000); 
});


router.post('/dte-especial', (req, res) => {
    const { tipo_dte } = req.body; 
    console.log(`[HACIENDA-MOCK] Procesando DTE Especial tipo: ${tipo_dte}`);

    setTimeout(() => {
        res.status(200).json({
            estado: "PROCESADO_ESPECIAL",
            sello_recepcion: `HAC-ESP-${Math.floor(Math.random() * 9000000)}`,
            mensaje: `El documento especial tipo ${tipo_dte} fue validado correctamente.`
        });
    }, 1500);
});


router.post('/transmision-masiva', (req, res) => {
    const dtes = req.body.dtes || [];
    console.log(`[HACIENDA-MOCK] Recibiendo lote masivo de ${dtes.length} documentos...`);

    
    setTimeout(() => {
        res.status(200).json({
            estado: "LOTE_RECIBIDO",
            id_lote: `LOTE-${crypto.randomUUID().substring(0,8).toUpperCase()}`,
            total_procesados: dtes.length,
            exitosos: dtes.length,
            fallidos: 0,
            mensaje: "Transmisión masiva completada y validada en los servidores."
        });
    }, 3500); 
});


router.get('/consulta-contribuyente/:nit', (req, res) => {
    const { nit } = req.params;
    console.log(`[HACIENDA-MOCK] Consultando estado tributario del NIT: ${nit}`);

    setTimeout(() => {
        res.status(200).json({
            nit_consultado: nit,
            estado_tributario: "ACTIVO",
            solvencia: true,
            actividades_economicas: [
                { codigo: "52290", descripcion: "Otras actividades de apoyo al transporte" },
                { codigo: "46900", descripcion: "Venta al por mayor no especializada" }
            ],
            mensaje: "Contribuyente solvente y autorizado para operaciones de comercio exterior."
        });
    }, 1000);
});

module.exports = router;