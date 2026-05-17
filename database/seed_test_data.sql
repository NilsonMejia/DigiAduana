USE digiaduana;

-- 1. Clientes de prueba
INSERT INTO clientes (id, nombre, tipo_persona, nit, nrc, giro, direccion, telefono, correo, contacto_principal, estado)
VALUES
(2, 'Textiles Pacifico S.A. de C.V.', 'JURIDICA', '0614-150322-102-4', '884211-3', 'Exportacion textil', 'Zona Franca San Marcos, San Salvador', '+503 2244-1100', 'operaciones@textilespacifico.test', 'Rosa Hernandez', 'ACTIVO'),
(3, 'Agroexportadora Lempa S.A.', 'JURIDICA', '0614-070118-103-5', '774100-1', 'Exportacion agroindustrial', 'Santa Ana, El Salvador', '+503 2440-9900', 'logistica@agrolempa.test', 'Carlos Rivas', 'ACTIVO');

-- 2. Usuarios operativos
INSERT IGNORE INTO usuarios (id, nombre, correo, password_hash, rol_id, cliente_id, estado, email_verificado)
VALUES
(2, 'Sofia Alvarado', 'supervisor@digiaduana.local', '$2b$10$QP6Hvb4EjmtRl6vVl6w/feNtRCJ8fThN.PBjiEggEzH4lRnpYaUCC', 2, NULL, 'ACTIVO', 1),
(3, 'Mario Escobar', 'forwarder@digiaduana.local', '$2b$10$QP6Hvb4EjmtRl6vVl6w/feNtRCJ8fThN.PBjiEggEzH4lRnpYaUCC', 3, NULL, 'ACTIVO', 1),
(4, 'Rosa Hernandez', 'cliente@textilespacifico.test', '$2b$10$QP6Hvb4EjmtRl6vVl6w/feNtRCJ8fThN.PBjiEggEzH4lRnpYaUCC', 4, 2, 'ACTIVO', 1);

-- 3. Expediente de importacion aprobado
INSERT INTO expedientes_aduanales (id, codigo, cliente_id, tipo_operacion, regimen, aduana_ingreso, aduana_salida, descripcion, responsable_id, estado, fecha_apertura)
VALUES
(2, 'EXP-2026-000002', 2, 'IMPORTACION', 'Importacion definitiva', 'Aduana Maritima Acajutla', 'San Salvador', 'Importacion de maquinaria para planta textil', 3, 'APROBADO', '2026-05-05 09:15:00');

-- 4. Expediente de exportacion en revision
INSERT INTO expedientes_aduanales (id, codigo, cliente_id, tipo_operacion, regimen, aduana_ingreso, aduana_salida, descripcion, responsable_id, estado, fecha_apertura)
VALUES
(3, 'EXP-2026-000003', 3, 'EXPORTACION', 'Exportacion definitiva', 'Santa Ana', 'Aduana Terrestre Anguiatu', 'Exportacion de cafe oro hacia Guatemala', 3, 'EN_REVISION', '2026-05-08 14:30:00');

-- 5. Carga del expediente 2
INSERT INTO cargas (expediente_id, numero_contenedor, tipo_carga, descripcion, peso_kg, volumen_m3, bultos, valor_cif, pais_origen, puerto_origen, puerto_destino, bl_master, bl_house, estado_logistico)
VALUES
(2, 'TEXU7654321', 'GENERAL', 'Maquinaria industrial para confeccion', 18200.00, 52.80, 18, 126500.00, 'Estados Unidos', 'Miami', 'Acajutla', 'MBL-MIA-2026-045', 'HBL-SAL-2026-045-A', 'ARRIBADO');

-- 6. Carga del expediente 3
INSERT INTO cargas (expediente_id, numero_contenedor, tipo_carga, descripcion, peso_kg, volumen_m3, bultos, valor_cif, pais_origen, puerto_origen, puerto_destino, bl_master, estado_logistico)
VALUES
(3, 'CAFU2468101', 'GENERAL', 'Cafe oro en sacos de 69 kg', 20700.00, 38.40, 300, 94800.00, 'El Salvador', 'San Salvador', 'Ciudad de Guatemala', 'MBL-SVGT-2026-018', 'EN_TRANSITO');

-- 7. Documento validado
INSERT INTO documentos (expediente_id, tipo_documento, nombre_original, ruta_archivo, mime_type, tamano_bytes, estado_validacion, observaciones, subido_por, validado_por, validado_en)
VALUES
(2, 'FACTURA_COMERCIAL', 'factura-maquinaria.pdf', 'uploads/factura-maquinaria.pdf', 'application/pdf', 384220, 'VALIDADO', 'Factura coincide con BL y lista de empaque.', 3, 2, '2026-05-06 11:20:00');

-- 8. Documento pendiente
INSERT INTO documentos (expediente_id, tipo_documento, nombre_original, ruta_archivo, mime_type, tamano_bytes, estado_validacion, subido_por)
VALUES
(3, 'CERTIFICADO_ORIGEN', 'certificado-origen-cafe.pdf', 'uploads/certificado-origen-cafe.pdf', 'application/pdf', 214508, 'PENDIENTE', 3);

-- 9. DTE validado
INSERT INTO dte (id, expediente_id, cliente_id, tipo_dte, numero_control, codigo_generacion, sello_recepcion, total_gravado, total_iva, total, estado, validado_en)
VALUES
(2, 2, 2, 'COMPROBANTE_CREDITO_FISCAL', 'DTE-03-00000002-000000000000002', UUID(), 'HAC-2026-4589012', 850.00, 110.50, 960.50, 'VALIDADO', '2026-05-06 16:10:00');

-- 10. Detalle del DTE validado
INSERT INTO detalle_dte (dte_id, descripcion, cantidad, precio_unitario, iva, total)
VALUES
(2, 'Servicios de gestion aduanal importacion', 1, 850.00, 110.50, 960.50);

-- 11. DTE emitido pendiente de Hacienda
INSERT INTO dte (id, expediente_id, cliente_id, tipo_dte, numero_control, codigo_generacion, total_gravado, total_iva, total, estado)
VALUES
(3, 3, 3, 'FACTURA', 'DTE-01-00000003-000000000000003', UUID(), 425.00, 55.25, 480.25, 'EMITIDO');

-- 12. Detalle del DTE emitido
INSERT INTO detalle_dte (dte_id, descripcion, cantidad, precio_unitario, iva, total)
VALUES
(3, 'Servicio documental de exportacion', 1, 425.00, 55.25, 480.25);

-- 13. Tracking de expediente aprobado
INSERT INTO historial_tracking (expediente_id, estado, comentario, usuario_id, creado_en)
VALUES
(2, 'APROBADO', 'Documentos validados y expediente aprobado por supervisor.', 2, '2026-05-06 12:05:00');

-- 14. Tracking de expediente en revision
INSERT INTO historial_tracking (expediente_id, estado, comentario, usuario_id, creado_en)
VALUES
(3, 'EN_REVISION', 'Pendiente validacion de certificado de origen.', 3, '2026-05-08 15:00:00');
