const express = require('express');
const router = express.Router();
const crypto = require('crypto');


router.post('/transmitir-manifiesto', (req, res) => {
    const { naviera, puerto_destino, numero_viaje } = req.body;
    console.log(`[NAVIERAS-MOCK] Recibiendo Manifiesto Anticipado para el viaje ${numero_viaje} hacia ${puerto_destino}...`);

    setTimeout(() => {
        res.status(200).json({
            estado: "MANIFIESTO_ACEPTADO",
            codigo_transmision: `MFT-${crypto.randomUUID().substring(0,8).toUpperCase()}`,
            fecha_recepcion: new Date().toISOString(),
            mensaje: `El manifiesto fue recibido exitosamente por la Aduana de ${puerto_destino} previo al atraque.`,
            reduccion_errores: "Validación sintáctica completada sin errores."
        });
    }, 2500);
});


router.post('/desconsolidar-bl', (req, res) => {
    const { master_bl, cantidad_house_bls } = req.body;
    console.log(`[NAVIERAS-MOCK] Desconsolidando Master BL: ${master_bl} en ${cantidad_house_bls} fracciones...`);

    setTimeout(() => {
        
        const houseBLsGenerados = Array.from({ length: cantidad_house_bls }, (_, i) => ({
            house_bl: `${master_bl}-H00${i + 1}`,
            estado: "DESCONSOLIDADO_ACTIVO"
        }));

        res.status(200).json({
            estado: "DESCONSOLIDACIÓN_COMPLETA",
            master_bl_original: master_bl,
            house_bls: houseBLsGenerados,
            mensaje: "Desagrupaje digital realizado con éxito. Los House BLs ya están disponibles en el sistema aduanero."
        });
    }, 3000);
});

router.get('/tracking/:numero_contenedor', (req, res) => {
    const { numero_contenedor } = req.params;
    console.log(`[NAVIERAS-MOCK] Consultando trazabilidad del contenedor: ${numero_contenedor}...`);

    const estados_logisticos = [
        'En Alta Mar (Océano Pacífico)', 
        'Arribado a Puerto de Acajutla', 
        'Arribado a Puerto de La Unión',
        'Descargado en Patio', 
        'En Tránsito Terrestre'
    ];
    const estado_aleatorio = estados_logisticos[Math.floor(Math.random() * estados_logisticos.length)];

    setTimeout(() => {
        res.status(200).json({
            contenedor: numero_contenedor,
            estado_trazabilidad: estado_aleatorio,
            ultima_ubicacion_gps: "N: 13.5833, W: -89.8333", // Coordenadas de Acajutla
            fecha_actualizacion: new Date().toISOString(),
            temperatura_interna: "18.5 °C", 
            mensaje: "Trazabilidad en tiempo real recuperada exitosamente."
        });
    }, 1500);
});

router.post('/validar-precinto', (req, res) => {
    const { numero_contenedor, codigo_precinto } = req.body;
    console.log(`[NAVIERAS-MOCK] Validando precinto de seguridad ${codigo_precinto} para el contenedor ${numero_contenedor}...`);

    setTimeout(() => {
        res.status(200).json({
            contenedor: numero_contenedor,
            precinto: codigo_precinto,
            estado_seguridad: "PRECINTO_INTACTO",
            certificacion: "ISO 17712",
            mensaje: "El código único del precinto coincide con los registros de origen. Carga asegurada."
        });
    }, 1000);
});

module.exports = router;