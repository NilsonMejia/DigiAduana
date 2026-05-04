DROP DATABASE IF EXISTS DigiAduana;
CREATE DATABASE DigiAduana;
USE DigiAduana;


-- =========================================
-- CREACIÓN DE TABLAS CATÁLOGO
-- =========================================

-- 1. Tabla de Países
CREATE TABLE Paises (
    id_pais INT PRIMARY KEY AUTO_INCREMENT,
    nombre_pais VARCHAR(100) NOT NULL,
    codigo_iso VARCHAR(5) -- Ej: 'SV', 'USA', 'GT'
);

-- 2. Tabla de Monedas
CREATE TABLE Monedas (
    id_moneda INT PRIMARY KEY AUTO_INCREMENT,
    nombre_moneda VARCHAR(50) NOT NULL,
    simbolo VARCHAR(5) -- Ej: '$', '€'
);

-- 3. Tabla de Unidades de Medida
CREATE TABLE UnidadesMedida (
    id_unidad INT PRIMARY KEY AUTO_INCREMENT,
    nombre_unidad VARCHAR(50) NOT NULL, -- Ej: Kilogramos, Libras, Metros Cúbicos
    abreviatura VARCHAR(10) -- Ej: 'kg', 'lb', 'm3'
);

-- 4. Tabla de Tipos de Carga
CREATE TABLE TiposCarga (
    id_tipo_carga INT PRIMARY KEY AUTO_INCREMENT,
    descripcion_carga VARCHAR(100) NOT NULL -- Ej: Peligrosa, Perecedera, Frágil, General
);

-- 5. Tabla de Incoterms (Términos de Comercio Internacional)
CREATE TABLE Incoterms (
    id_incoterm INT PRIMARY KEY AUTO_INCREMENT,
    codigo_incoterm VARCHAR(3) NOT NULL, -- Ej: 'FOB', 'CIF', 'EXW'
    descripcion VARCHAR(255)
);

-- =========================================
-- CREACIÓN DE TABLAS PRINCIPALES
-- =========================================

-- 1. Tabla de Puertos
CREATE TABLE Puertos (
    id_puerto INT PRIMARY KEY AUTO_INCREMENT,
    nombre_puerto VARCHAR(100) NOT NULL,
    id_pais_fk INT NOT NULL,
    codigo_puerto VARCHAR(10), -- Ej: 'SVMSL' para Puerto de Acajutla
    FOREIGN KEY (id_pais_fk) REFERENCES Paises(id_pais)
);

-- 2. Tabla de Clientes (Importadores/Exportadores)
CREATE TABLE Clientes (
    id_cliente INT PRIMARY KEY AUTO_INCREMENT,
    nombre_cliente VARCHAR(150) NOT NULL,
    nit_nrc VARCHAR(20),
    direccion TEXT,
    telefono VARCHAR(20),
    correo_contacto VARCHAR(100),
    id_pais_fk INT NOT NULL,
    FOREIGN KEY (id_pais_fk) REFERENCES Paises(id_pais)
);

-- 3. Tabla de Navieras (Empresas dueñas de los barcos)
CREATE TABLE Navieras (
    id_naviera INT PRIMARY KEY AUTO_INCREMENT,
    nombre_naviera VARCHAR(100) NOT NULL,
    codigo_scac VARCHAR(10), 
    contacto_agencia VARCHAR(100)
);

-- 4. Tabla de Transportistas (Terrestres)
CREATE TABLE Transportistas (
    id_transportista INT PRIMARY KEY AUTO_INCREMENT,
    nombre_transportista VARCHAR(150) NOT NULL,
    placa_cabezal VARCHAR(20),
    licencia_conductor VARCHAR(20),
    telefono_conductor VARCHAR(20)
);

-- 5. Tabla de Contenedores
CREATE TABLE Contenedores (
    id_contenedor INT PRIMARY KEY AUTO_INCREMENT,
    numero_contenedor VARCHAR(20) NOT NULL UNIQUE, 
    id_tipo_carga_fk INT NOT NULL,
    capacidad_maxima DECIMAL(10,2),
    id_unidad_medida_fk INT NOT NULL,
    estado_contenedor VARCHAR(50), 
    FOREIGN KEY (id_tipo_carga_fk) REFERENCES TiposCarga(id_tipo_carga),
    FOREIGN KEY (id_unidad_medida_fk) REFERENCES UnidadesMedida(id_unidad)
);

-- 6. Tabla de Embarques (Header/Encabezado)
CREATE TABLE Embarques (
    id_embarque INT PRIMARY KEY AUTO_INCREMENT,
    codigo_rastreo VARCHAR(50) UNIQUE NOT NULL,
    id_cliente_fk INT NOT NULL,
    id_naviera_fk INT NOT NULL,
    id_puerto_origen_fk INT NOT NULL,
    id_puerto_destino_fk INT NOT NULL,
    id_incoterm_fk INT NOT NULL,
    fecha_salida_estimada DATE,
    fecha_llegada_estimada DATE,
    estado_embarque VARCHAR(50), 
    FOREIGN KEY (id_cliente_fk) REFERENCES Clientes(id_cliente),
    FOREIGN KEY (id_naviera_fk) REFERENCES Navieras(id_naviera),
    FOREIGN KEY (id_puerto_origen_fk) REFERENCES Puertos(id_puerto),
    FOREIGN KEY (id_puerto_destino_fk) REFERENCES Puertos(id_puerto),
    FOREIGN KEY (id_incoterm_fk) REFERENCES Incoterms(id_incoterm)
);

-- 7. Tabla Intermedia: Embarque_Contenedores
CREATE TABLE Embarque_Contenedores (
    id_embarque_fk INT NOT NULL,
    id_contenedor_fk INT NOT NULL,
    sello_seguridad VARCHAR(50), 
    PRIMARY KEY (id_embarque_fk, id_contenedor_fk),
    FOREIGN KEY (id_embarque_fk) REFERENCES Embarques(id_embarque),
    FOREIGN KEY (id_contenedor_fk) REFERENCES Contenedores(id_contenedor)
);

-- 8. Tabla de Manifiestos de Carga
CREATE TABLE Manifiestos (
    id_manifiesto INT PRIMARY KEY AUTO_INCREMENT,
    numero_manifiesto VARCHAR(50) UNIQUE NOT NULL,
    id_embarque_fk INT NOT NULL,
    id_transportista_fk INT NOT NULL,
    fecha_emision DATETIME DEFAULT CURRENT_TIMESTAMP,
    aduana_despacho VARCHAR(100), 
    FOREIGN KEY (id_embarque_fk) REFERENCES Embarques(id_embarque),
    FOREIGN KEY (id_transportista_fk) REFERENCES Transportistas(id_transportista)
);

-- 9. Tabla de Facturas Comerciales
CREATE TABLE Facturas (
    id_factura INT PRIMARY KEY AUTO_INCREMENT,
    numero_factura VARCHAR(50) NOT NULL,
    id_embarque_fk INT NOT NULL,
    fecha_factura DATE NOT NULL,
    id_moneda_fk INT NOT NULL,
    monto_total DECIMAL(18,2) NOT NULL,
    terminos_pago VARCHAR(100),
    FOREIGN KEY (id_embarque_fk) REFERENCES Embarques(id_embarque),
    FOREIGN KEY (id_moneda_fk) REFERENCES Monedas(id_moneda)
);

-- 10. Tabla de Declaraciones de Aduana (Duca/DTI)
CREATE TABLE DeclaracionesAduana (
    id_declaracion INT PRIMARY KEY AUTO_INCREMENT,
    numero_declaracion VARCHAR(50) UNIQUE NOT NULL,
    id_embarque_fk INT NOT NULL,
    tipo_regimen VARCHAR(50), 
    total_impuestos DECIMAL(18,2),
    estado_levante VARCHAR(50), 
    fecha_aceptacion DATETIME,
    FOREIGN KEY (id_embarque_fk) REFERENCES Embarques(id_embarque)
);

-- 11. Detalle de Mercancía (Items)
CREATE TABLE DetalleMercancia (
    id_detalle INT PRIMARY KEY AUTO_INCREMENT,
    id_embarque_fk INT NOT NULL,
    descripcion_producto TEXT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    id_unidad_medida_fk INT NOT NULL,
    peso_neto DECIMAL(10,2),
    valor_unitario DECIMAL(18,2),
    FOREIGN KEY (id_embarque_fk) REFERENCES Embarques(id_embarque),
    FOREIGN KEY (id_unidad_medida_fk) REFERENCES UnidadesMedida(id_unidad)
);

-- =========================================
-- CREACIÓN DE TABLAS DE SEGURIDAD (NUEVAS)
-- =========================================

-- 12. Tabla de Roles
CREATE TABLE Roles (
    id_rol INT PRIMARY KEY AUTO_INCREMENT,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

-- 13. Tabla de Usuarios
CREATE TABLE Usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre_usuario VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Aquí se guardará la contraseña encriptada con bcrypt
    id_rol_fk INT NOT NULL,
    id_cliente_fk INT NULL, -- Se llena SOLO si el usuario es un Cliente
    estado_activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol_fk) REFERENCES Roles(id_rol),
    FOREIGN KEY (id_cliente_fk) REFERENCES Clientes(id_cliente)
);

-- =========================================
-- POBLAMIENTO DE DATOS (INSERTS MASIVOS)
-- =========================================

-- 1. Países (20 registros reales)
INSERT INTO Paises (nombre_pais, codigo_iso) VALUES 
('El Salvador', 'SV'), ('Guatemala', 'GT'), ('Honduras', 'HN'), ('Nicaragua', 'NI'), 
('Costa Rica', 'CR'), ('Panamá', 'PA'), ('Estados Unidos', 'US'), ('México', 'MX'), 
('China', 'CN'), ('Japón', 'JP'), ('Alemania', 'DE'), ('España', 'ES'), 
('Italia', 'IT'), ('Francia', 'FR'), ('Reino Unido', 'GB'), ('Brasil', 'BR'), 
('Argentina', 'AR'), ('Colombia', 'CO'), ('Chile', 'CL'), ('Perú', 'PE');

-- 2. Monedas (20 registros reales)
INSERT INTO Monedas (nombre_moneda, simbolo) VALUES 
('Dólar Estadounidense', '$'), ('Euro', '€'), ('Quetzal', 'Q'), ('Lempira', 'L'), 
('Córdoba', 'C$'), ('Colón Costarricense', '₡'), ('Balboa', 'B/.'), ('Peso Mexicano', '$'), 
('Yuan Chino', '¥'), ('Yen Japonés', '¥'), ('Libra Esterlina', '£'), ('Real Brasileño', 'R$'), 
('Peso Argentino', '$'), ('Peso Colombiano', '$'), ('Peso Chileno', '$'), ('Sol Peruano', 'S/'), 
('Dólar Canadiense', 'C$'), ('Dólar Australiano', 'A$'), ('Franco Suizo', 'CHF'), ('Rupia India', '₹');

-- 3. Unidades de Medida (20 registros)
INSERT INTO UnidadesMedida (nombre_unidad, abreviatura) VALUES 
('Kilogramos', 'kg'), ('Libras', 'lb'), ('Metros Cúbicos', 'm3'), ('Toneladas Métricas', 'TM'), 
('Gramos', 'g'), ('Onzas', 'oz'), ('Litros', 'L'), ('Galones', 'gal'), 
('Metros', 'm'), ('Centímetros', 'cm'), ('Milímetros', 'mm'), ('Pies', 'ft'), 
('Pulgadas', 'in'), ('Unidades', 'und'), ('Cajas', 'cja'), ('Pallets', 'pal'), 
('Bultos', 'blt'), ('Barriles', 'bbl'), ('Quintales', 'qq'), ('Sacos', 'sac');

-- 4. Tipos de Carga (20 registros)
INSERT INTO TiposCarga (descripcion_carga) VALUES 
('Carga General'), ('Carga Peligrosa (IMO)'), ('Carga Frágil'), ('Carga Perecedera'), 
('Animales Vivos'), ('Granel Sólido'), ('Granel Líquido'), ('Carga Refrigerada'), 
('Sobredimensionada'), ('Carga Rodante (Ro-Ro)'), ('Valores'), ('Correo y Mensajería'), 
('Restos Humanos'), ('Armas y Municiones'), ('Productos Químicos'), ('Textiles y Prendas'), 
('Electrónicos y Tecnología'), ('Maquinaria Pesada'), ('Repuestos Automotrices'), ('Medicamentos y Farmacia');

-- 5. Incoterms (11 registros - Son los únicos válidos a nivel mundial según la Cámara de Comercio Internacional)
INSERT INTO Incoterms (codigo_incoterm, descripcion) VALUES 
('EXW', 'En Fábrica'), ('FCA', 'Franco Transportista'), ('CPT', 'Transporte Pagado Hasta'), 
('CIP', 'Transporte y Seguro Pagados Hasta'), ('DAP', 'Entregado en un Punto'), 
('DPU', 'Entregado y Descargado en Lugar Acordado'), ('DDP', 'Entregado con Derechos Pagados'), 
('FAS', 'Franco al Costado del Buque'), ('FOB', 'Franco a Bordo'), 
('CFR', 'Costo y Flete'), ('CIF', 'Costo, Seguro y Flete');

-- 6. Puertos (20 registros reales mapeados a sus países)
INSERT INTO Puertos (nombre_puerto, id_pais_fk, codigo_puerto) VALUES 
('Puerto de Acajutla', 1, 'SVMSL'), ('Puerto de La Unión', 1, 'SVLUN'), 
('Puerto Quetzal', 2, 'GTPRQ'), ('Santo Tomás de Castilla', 2, 'GTSTC'), 
('Puerto Cortés', 3, 'HNPTZ'), ('San Lorenzo', 3, 'HNSLO'), 
('Puerto Corinto', 4, 'NICIO'), ('Puerto Limón', 5, 'CRLIO'), 
('Puerto Caldera', 5, 'CRCAL'), ('Puerto de Balboa', 6, 'PABLB'), 
('Puerto de Manzanillo', 8, 'MXZLO'), ('Puerto de Veracruz', 8, 'MXVER'), 
('Puerto de Los Ángeles', 7, 'USLAX'), ('Puerto de Long Beach', 7, 'USLGB'), 
('Puerto de Miami', 7, 'USMIA'), ('Puerto de Shanghái', 9, 'CNSHA'), 
('Puerto de Ningbo', 9, 'CNNGB'), ('Puerto de Tokio', 10, 'JPTYO'), 
('Puerto de Hamburgo', 11, 'DEHAM'), ('Puerto de Valencia', 12, 'ESVLC');

-- 7. Clientes (20 registros)
INSERT INTO Clientes (nombre_cliente, nit_nrc, direccion, telefono, correo_contacto, id_pais_fk) VALUES 
('Tecnología Orellana S.A.', '0614-150298-102-1', 'Santa Ana, Centro', '2440-1111', 'compras@tecorellana.sv', 1),
('Logística Rosales C.V.', '0614-200599-105-2', 'San Salvador', '2222-3333', 'import@logrosales.sv', 1),
('Importaciones y Exportaciones Mejía', '0101-101005-101-3', 'Atiquizaya, Ahuachapán', '2444-0000', 'gerencia@importmejia.sv', 1),
('Industrias Textiles Ahuachapanecas', '0101-050580-101-4', 'Ahuachapán', '2413-5555', 'textiles@ahuachapan.sv', 1),
('Farmacias Atiquizaya', '0101-121290-101-5', 'Atiquizaya, Ahuachapán', '2444-1234', 'salud@farmaatiquizaya.sv', 1),
('Distribuidora San Salvador', '0614-010185-101-6', 'San Salvador', '2555-6666', 'distribuidora@ss.sv', 1),
('Agroindustrias de Occidente', '0210-030395-101-7', 'Chalchuapa', '2400-7777', 'agro@occidente.sv', 1),
('Global Tech Corp', 'US-987654321', 'Silicon Valley, CA', '+1-555-0192', 'sales@globaltech.com', 7),
('Shanghai Electronics', 'CN-112233445', 'Pudong, Shanghai', '+86-21-5555', 'export@shanghaielec.cn', 9),
('Bavaria Auto Parts', 'DE-445566778', 'Munich, Germany', '+49-89-1234', 'parts@bavariaauto.de', 11),
('Guatemala Coffee Export', 'GT-11122233', 'Ciudad de Guatemala', '+502-2222', 'coffee@gtexport.gt', 2),
('Honduras Banana Co.', 'HN-99887766', 'San Pedro Sula', '+504-3333', 'bananas@hnbc.hn', 3),
('Costa Rica Medical Devices', 'CR-55443322', 'San José', '+506-4444', 'med@crmed.cr', 5),
('Mexico Maquiladoras S.A.', 'MX-AABBCC112', 'Monterrey', '+52-81-5555', 'maquila@mxsa.mx', 8),
('Tokyo Robotics', 'JP-99988877', 'Akihabara, Tokyo', '+81-3-6666', 'info@tokyorobo.jp', 10),
('Panama Logistics Hub', 'PA-12312312', 'Ciudad de Panamá', '+507-7777', 'hub@panamalog.pa', 6),
('Nicaragua Agro Export', 'NI-45645645', 'Managua', '+505-8888', 'agro@niagro.ni', 4),
('Spain Wine Distillers', 'ES-X1234567', 'La Rioja', '+34-91-9999', 'vino@spainwine.es', 12),
('Brazil Soy Traders', 'BR-77788899', 'Sao Paulo', '+55-11-0000', 'soy@brtraders.br', 16),
('Peru Silver Mines', 'PE-11223344', 'Lima', '+51-1-1111', 'silver@pemines.pe', 20);

-- 8. Navieras (20 registros)
INSERT INTO Navieras (nombre_naviera, codigo_scac, contacto_agencia) VALUES 
('Maersk Line', 'MAEU', 'agencia.sv@maersk.com'), ('Mediterranean Shipping Co. (MSC)', 'MSCU', 'info@msc.com'), 
('CMA CGM', 'CMDU', 'elsalvador@cma-cgm.com'), ('Hapag-Lloyd', 'HLCU', 'contact@hapag-lloyd.com'), 
('COSCO Shipping', 'COSU', 'sales@cosco.com'), ('Evergreen Marine', 'EGLV', 'info@evergreen.com'), 
('Ocean Network Express (ONE)', 'ONEY', 'sv.sales@one-line.com'), ('Yang Ming Marine', 'YMLU', 'contact@yangming.com'), 
('ZIM Integrated Shipping', 'ZIMU', 'info@zim.com'), ('Hyundai Merchant Marine (HMM)', 'HDMU', 'sales@hmm21.com'), 
('Wan Hai Lines', 'WHLU', 'info@wanhai.com'), ('Pacific International Lines (PIL)', 'PILU', 'contact@pilship.com'), 
('Seaboard Marine', 'SMLU', 'agencia@seaboardmarine.com'), ('Crowley Maritime', 'CMDU', 'info@crowley.com'), 
('King Ocean Services', 'KOSU', 'sales@kingocean.com'), ('Hamburg Süd', 'SUDU', 'info@hamburgsud.com'), 
('OOCL', 'OOLU', 'contact@oocl.com'), ('APL', 'APLU', 'info@apl.com'), 
('NYK Line', 'NYKS', 'sales@nyk.com'), ('MOL', 'MOLU', 'info@mol.com');

-- 9. Transportistas (20 registros)
INSERT INTO Transportistas (nombre_transportista, placa_cabezal, licencia_conductor, telefono_conductor) VALUES 
('Transportes Pesados SV', 'C-10101', '0101-101080-101-1', '7777-0001'), ('Logística Terrestre C.A.', 'C-20202', '0202-202080-202-2', '7777-0002'), 
('Fletes El Rápido', 'C-30303', '0303-303080-303-3', '7777-0003'), ('Carga Segura S.A.', 'C-40404', '0404-404080-404-4', '7777-0004'), 
('Transportes del Norte', 'C-50505', '0505-505080-505-5', '7777-0005'), ('Rutas de Occidente', 'C-60606', '0606-606080-606-6', '7777-0006'), 
('Cabezales Unidos', 'C-70707', '0707-707080-707-7', '7777-0007'), ('Transporte Internacional Sur', 'C-80808', '0808-808080-808-8', '7777-0008'), 
('Furgones de El Salvador', 'C-90909', '0909-909080-909-9', '7777-0009'), ('Movimiento Express', 'C-11111', '1010-101080-101-0', '7777-0010'), 
('Carga Total GT', 'C-22222', '1111-111180-111-1', '7777-0011'), ('Transportes Regionales', 'C-33333', '1212-121280-121-2', '7777-0012'), 
('Logística Maya', 'C-44444', '1313-131380-131-3', '7777-0013'), ('Fletes del Pacífico', 'C-55555', '1414-141480-141-4', '7777-0014'), 
('Caminos Seguros C.A.', 'C-66666', '1515-151580-151-5', '7777-0015'), ('Transporte Rápido y Furioso', 'C-77777', '1616-161680-161-6', '7777-0016'), 
('Heavy Load Logistics', 'C-88888', '1717-171780-171-7', '7777-0017'), ('Rutas Panamericanas', 'C-99999', '1818-181880-181-8', '7777-0018'), 
('Transportes El Volcán', 'C-12345', '1919-191980-191-9', '7777-0019'), ('Furgones Acajutla', 'C-54321', '2020-202080-202-0', '7777-0020');

-- 10. Contenedores (20 registros - Asumiendo UnidadesMedida 1=kg)
INSERT INTO Contenedores (numero_contenedor, id_tipo_carga_fk, capacidad_maxima, id_unidad_medida_fk, estado_contenedor) VALUES 
('MSKU1000001', 1, 28000.00, 1, 'Lleno'), ('MSKU1000002', 2, 26000.00, 1, 'Lleno'), 
('MSKU1000003', 3, 25000.00, 1, 'Vacío'), ('MSKU1000004', 4, 27000.00, 1, 'En Tránsito'), 
('HLXU2000001', 1, 28000.00, 1, 'Lleno'), ('HLXU2000002', 8, 26500.00, 1, 'En Reparación'), 
('HLXU2000003', 9, 30000.00, 1, 'Lleno'), ('HLXU2000004', 1, 28000.00, 1, 'Vacío'), 
('CMAU3000001', 15, 25000.00, 1, 'En Tránsito'), ('CMAU3000002', 17, 28000.00, 1, 'Lleno'), 
('CMAU3000003', 18, 29000.00, 1, 'Lleno'), ('CMAU3000004', 1, 28000.00, 1, 'Vacío'), 
('TGHU4000001', 2, 26000.00, 1, 'En Tránsito'), ('TGHU4000002', 4, 27000.00, 1, 'Lleno'), 
('TGHU4000003', 1, 28000.00, 1, 'Lleno'), ('TGHU4000004', 3, 25000.00, 1, 'Vacío'), 
('SUDU5000001', 16, 28000.00, 1, 'En Tránsito'), ('SUDU5000002', 19, 28000.00, 1, 'Lleno'), 
('SUDU5000003', 20, 26000.00, 1, 'Lleno'), ('SUDU5000004', 1, 28000.00, 1, 'Vacío');

-- 11. Embarques (20 registros)
INSERT INTO Embarques (codigo_rastreo, id_cliente_fk, id_naviera_fk, id_puerto_origen_fk, id_puerto_destino_fk, id_incoterm_fk, fecha_salida_estimada, fecha_llegada_estimada, estado_embarque) VALUES 
('TRK-2026-0001', 3, 1, 16, 1, 9, '2026-05-01', '2026-05-25', 'En Tránsito'), ('TRK-2026-0002', 1, 2, 13, 1, 11, '2026-05-05', '2026-05-15', 'En Puerto Origen'), 
('TRK-2026-0003', 2, 3, 19, 1, 1, '2026-04-20', '2026-05-18', 'En Tránsito'), ('TRK-2026-0004', 4, 4, 18, 1, 9, '2026-05-10', '2026-06-05', 'Programado'), 
('TRK-2026-0005', 5, 5, 14, 1, 11, '2026-05-02', '2026-05-12', 'En Tránsito'), ('TRK-2026-0006', 6, 6, 11, 1, 1, '2026-04-28', '2026-05-08', 'Arribado'), 
('TRK-2026-0007', 7, 7, 20, 1, 9, '2026-05-15', '2026-06-10', 'Programado'), ('TRK-2026-0008', 8, 8, 1, 13, 11, '2026-05-03', '2026-05-13', 'En Tránsito'), 
('TRK-2026-0009', 9, 9, 17, 1, 1, '2026-04-15', '2026-05-10', 'Arribado'), ('TRK-2026-0010', 10, 10, 19, 1, 9, '2026-05-20', '2026-06-15', 'Programado'), 
('TRK-2026-0011', 11, 11, 3, 15, 11, '2026-05-04', '2026-05-09', 'En Tránsito'), ('TRK-2026-0012', 12, 12, 5, 14, 1, '2026-04-25', '2026-05-05', 'Arribado'), 
('TRK-2026-0013', 13, 13, 8, 1, 9, '2026-05-12', '2026-05-20', 'Programado'), ('TRK-2026-0014', 14, 14, 12, 1, 11, '2026-05-06', '2026-05-14', 'En Tránsito'), 
('TRK-2026-0015', 15, 15, 18, 1, 1, '2026-04-10', '2026-05-06', 'Arribado'), ('TRK-2026-0016', 16, 16, 10, 1, 9, '2026-05-25', '2026-06-02', 'Programado'), 
('TRK-2026-0017', 17, 17, 7, 15, 11, '2026-05-07', '2026-05-16', 'En Tránsito'), ('TRK-2026-0018', 18, 18, 20, 1, 1, '2026-04-22', '2026-05-22', 'En Tránsito'), 
('TRK-2026-0019', 19, 19, 16, 1, 9, '2026-05-28', '2026-06-25', 'Programado'), ('TRK-2026-0020', 20, 20, 1, 16, 11, '2026-05-08', '2026-06-08', 'En Tránsito');

-- 12. Embarque_Contenedores (20 registros, relación 1 a 1 para simplificar)
INSERT INTO Embarque_Contenedores (id_embarque_fk, id_contenedor_fk, sello_seguridad) VALUES 
(1, 1, 'SELLO-001'), (2, 2, 'SELLO-002'), (3, 3, 'SELLO-003'), (4, 4, 'SELLO-004'), 
(5, 5, 'SELLO-005'), (6, 6, 'SELLO-006'), (7, 7, 'SELLO-007'), (8, 8, 'SELLO-008'), 
(9, 9, 'SELLO-009'), (10, 10, 'SELLO-010'), (11, 11, 'SELLO-011'), (12, 12, 'SELLO-012'), 
(13, 13, 'SELLO-013'), (14, 14, 'SELLO-014'), (15, 15, 'SELLO-015'), (16, 16, 'SELLO-016'), 
(17, 17, 'SELLO-017'), (18, 18, 'SELLO-018'), (19, 19, 'SELLO-019'), (20, 20, 'SELLO-020');

-- 13. Manifiestos (20 registros)
INSERT INTO Manifiestos (numero_manifiesto, id_embarque_fk, id_transportista_fk, aduana_despacho) VALUES 
('MAN-26-001', 1, 1, 'Aduana Marítima Acajutla'), ('MAN-26-002', 2, 2, 'Aduana Marítima Acajutla'), 
('MAN-26-003', 3, 3, 'Aduana Marítima Acajutla'), ('MAN-26-004', 4, 4, 'Aduana Marítima Acajutla'), 
('MAN-26-005', 5, 5, 'Aduana Marítima Acajutla'), ('MAN-26-006', 6, 6, 'Aduana Marítima Acajutla'), 
('MAN-26-007', 7, 7, 'Aduana Marítima Acajutla'), ('MAN-26-008', 8, 8, 'Aduana Marítima Acajutla'), 
('MAN-26-009', 9, 9, 'Aduana Marítima Acajutla'), ('MAN-26-010', 10, 10, 'Aduana Marítima Acajutla'), 
('MAN-26-011', 11, 11, 'Aduana Terrestre San Bartolo'), ('MAN-26-012', 12, 12, 'Aduana Terrestre San Bartolo'), 
('MAN-26-013', 13, 13, 'Aduana Terrestre San Bartolo'), ('MAN-26-014', 14, 14, 'Aduana Terrestre San Bartolo'), 
('MAN-26-015', 15, 15, 'Aduana Terrestre San Bartolo'), ('MAN-26-016', 16, 16, 'Aduana Terrestre San Bartolo'), 
('MAN-26-017', 17, 17, 'Aduana Terrestre San Bartolo'), ('MAN-26-018', 18, 18, 'Aduana Terrestre San Bartolo'), 
('MAN-26-019', 19, 19, 'Aduana Terrestre San Bartolo'), ('MAN-26-020', 20, 20, 'Aduana Terrestre San Bartolo');

-- 14. Facturas (20 registros - Asumiendo Monedas 1=USD)
INSERT INTO Facturas (numero_factura, id_embarque_fk, fecha_factura, id_moneda_fk, monto_total, terminos_pago) VALUES 
('INV-1001', 1, '2026-04-25', 1, 45000.00, '30 Días Neto'), ('INV-1002', 2, '2026-04-30', 1, 12500.50, 'Contado'), 
('INV-1003', 3, '2026-04-15', 1, 89000.00, '60 Días Neto'), ('INV-1004', 4, '2026-05-01', 1, 34200.00, 'Anticipo 50%'), 
('INV-1005', 5, '2026-04-28', 1, 15600.75, 'Contado'), ('INV-1006', 6, '2026-04-20', 1, 112000.00, '30 Días Neto'), 
('INV-1007', 7, '2026-05-05', 1, 55000.00, 'Contado'), ('INV-1008', 8, '2026-04-29', 1, 23400.00, '30 Días Neto'), 
('INV-1009', 9, '2026-04-10', 1, 78000.00, '60 Días Neto'), ('INV-1010', 10, '2026-05-10', 1, 41000.00, 'Anticipo 50%'), 
('INV-1011', 11, '2026-04-26', 1, 19500.00, 'Contado'), ('INV-1012', 12, '2026-04-18', 1, 67000.00, '30 Días Neto'), 
('INV-1013', 13, '2026-05-02', 1, 28900.00, 'Contado'), ('INV-1014', 14, '2026-04-27', 1, 51000.00, '30 Días Neto'), 
('INV-1015', 15, '2026-04-05', 1, 95000.00, '60 Días Neto'), ('INV-1016', 16, '2026-05-15', 1, 32000.00, 'Anticipo 50%'), 
('INV-1017', 17, '2026-04-28', 1, 14000.00, 'Contado'), ('INV-1018', 18, '2026-04-12', 1, 83000.00, '30 Días Neto'), 
('INV-1019', 19, '2026-05-18', 1, 47000.00, 'Contado'), ('INV-1020', 20, '2026-04-30', 1, 21000.00, '30 Días Neto');

-- 15. Declaraciones de Aduana (20 registros)
INSERT INTO DeclaracionesAduana (numero_declaracion, id_embarque_fk, tipo_regimen, total_impuestos, estado_levante, fecha_aceptacion) VALUES 
('DTI-26-0001', 1, 'Importación Definitiva', 6750.00, 'Verde', '2026-05-25 10:00:00'), ('DTI-26-0002', 2, 'Importación Definitiva', 1875.00, 'Rojo', NULL), 
('DTI-26-0003', 3, 'Importación Definitiva', 13350.00, 'Verde', '2026-05-18 11:30:00'), ('DTI-26-0004', 4, 'Tránsito Internacional', 0.00, 'Amarillo', NULL), 
('DTI-26-0005', 5, 'Importación Definitiva', 2340.00, 'Verde', '2026-05-12 09:15:00'), ('DTI-26-0006', 6, 'Importación Definitiva', 16800.00, 'Verde', '2026-05-08 14:20:00'), 
('DTI-26-0007', 7, 'Exportación Definitiva', 0.00, 'Verde', NULL), ('DTI-26-0008', 8, 'Importación Definitiva', 3510.00, 'Rojo', NULL), 
('DTI-26-0009', 9, 'Importación Definitiva', 11700.00, 'Verde', '2026-05-10 16:45:00'), ('DTI-26-0010', 10, 'Importación Definitiva', 6150.00, 'Amarillo', NULL), 
('DTI-26-0011', 11, 'Tránsito Internacional', 0.00, 'Verde', '2026-05-09 08:30:00'), ('DTI-26-0012', 12, 'Importación Definitiva', 10050.00, 'Verde', '2026-05-05 13:10:00'), 
('DTI-26-0013', 13, 'Exportación Definitiva', 0.00, 'Verde', NULL), ('DTI-26-0014', 14, 'Importación Definitiva', 7650.00, 'Rojo', NULL), 
('DTI-26-0015', 15, 'Importación Definitiva', 14250.00, 'Verde', '2026-05-06 10:50:00'), ('DTI-26-0016', 16, 'Importación Definitiva', 4800.00, 'Amarillo', NULL), 
('DTI-26-0017', 17, 'Tránsito Internacional', 0.00, 'Verde', '2026-05-16 09:40:00'), ('DTI-26-0018', 18, 'Importación Definitiva', 12450.00, 'Verde', '2026-05-22 15:25:00'), 
('DTI-26-0019', 19, 'Exportación Definitiva', 0.00, 'Verde', NULL), ('DTI-26-0020', 20, 'Importación Definitiva', 3150.00, 'Rojo', NULL);

-- 16. Detalle de Mercancía (CORREGIDO)
INSERT INTO DetalleMercancia (id_embarque_fk, descripcion_producto, cantidad, id_unidad_medida_fk, peso_neto, valor_unitario) VALUES 
(1, 'Laptops Dell Latitude', 500.00, 14, 1200.00, 900.00), 
(2, 'Repuestos Toyota Corolla', 150.00, 15, 800.00, 83.33), 
(3, 'Maquinaria Industrial Textil', 10.00, 14, 18500.00, 8900.00), 
(4, 'Químicos Agrícolas', 1000.00, 7, 1000.00, 34.20), 
(5, 'Smartphones Samsung S24', 1000.00, 14, 250.00, 15.60), 
(6, 'Vehículos Sedán Honda', 8.00, 14, 12000.00, 14000.00), 
(7, 'Café Tostado Exportación', 500.00, 20, 25000.00, 110.00), 
(8, 'Ropa de Algodón', 200.00, 17, 4000.00, 117.00), 
(9, 'Paneles Solares 500W', 300.00, 14, 6000.00, 260.00), 
(10, 'Herramientas Eléctricas', 400.00, 15, 3200.00, 102.50), 
(11, 'Llantas para Camión', 100.00, 14, 5000.00, 195.00), 
(12, 'Material Médico Descartable', 800.00, 15, 1600.00, 83.75), 
(13, 'Azúcar Refinada', 1000.00, 19, 24000.00, 28.90), -- <--- PESO CORREGIDO (24,000 kg sí caben en el contenedor)
(14, 'Muebles de Oficina', 150.00, 14, 4500.00, 340.00), 
(15, 'Televisores OLED 65"', 200.00, 14, 3000.00, 475.00), 
(16, 'Juguetes Plásticos', 500.00, 15, 2500.00, 64.00), 
(17, 'Calzado Deportivo', 600.00, 15, 3600.00, 23.33), 
(18, 'Servidores Rack HP', 20.00, 14, 800.00, 4150.00), 
(19, 'Cacao en Grano', 400.00, 20, 20000.00, 117.50), 
(20, 'Bicicletas de Montaña', 100.00, 14, 1500.00, 210.00);

-- 17. Roles (3 registros requeridos por la lógica del sistema)
INSERT INTO Roles (nombre_rol, descripcion) VALUES 
('Admin', 'Control total sobre el sistema, usuarios y reportes.'), 
('Cliente', 'Acceso limitado para ver el estado de sus propios embarques y DTEs.'), 
('Freight Forwarder', 'Gestión logística, actualización de manifiestos y estados de contenedor.');

-- 18. Usuarios (20 registros con contraseñas simuladas encriptadas)
-- Notas de los insert: 
-- Rol 1 = Admin, Rol 2 = Cliente, Rol 3 = Freight Forwarder.
-- El hash "$2b$10$dummyhash..." simula una encriptación bcrypt real para la contraseña 'password123'
INSERT INTO Usuarios (nombre_usuario, correo, password_hash, id_rol_fk, id_cliente_fk) VALUES 
('Nilson Nathan Mejía Ascencio', 'nilson.mejia@digiaduana.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 1, NULL), 
('Kevin Misael Rosales Gonzales', 'kevin.rosales@tecorellana.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 2, 1), 
('Marlon Orellana', 'marlon.orellana@forwarder.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 3, NULL), 
('Henry Administrador', 'henry.admin@digiaduana.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 1, NULL), 
('América Sistemas', 'america@digiaduana.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 1, NULL), 
('Usuario Logística', 'logistica@logrosales.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 2, 2), 
('Gerente Importaciones Atiquizaya', 'gerencia@importmejia.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 2, 3), 
('Director Textiles', 'director@ahuachapan.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 2, 4), 
('Farmacias Admin', 'salud@farmaatiquizaya.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 2, 5), 
('Carlos Distribuidor', 'carlos@ss.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 2, 6), 
('Ana Agro', 'ana@occidente.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 2, 7), 
('John Smith (Global)', 'jsmith@globaltech.com', '$2b$10$dummyhashsimulado1234567890abcdef', 2, 8), 
('Wei Chen', 'wchen@shanghaielec.cn', '$2b$10$dummyhashsimulado1234567890abcdef', 2, 9), 
('Hans Müller', 'hans@bavariaauto.de', '$2b$10$dummyhashsimulado1234567890abcdef', 2, 10), 
('Agente Aduanal 1', 'agente1@forwarder.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 3, NULL), 
('Agente Aduanal 2', 'agente2@forwarder.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 3, NULL), 
('Agente Aduanal 3', 'agente3@forwarder.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 3, NULL), 
('Auditor Interno', 'auditoria@digiaduana.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 1, NULL), 
('Soporte IT', 'soporte@digiaduana.sv', '$2b$10$dummyhashsimulado1234567890abcdef', 1, NULL), 
('Mario Cliente', 'mario.cliente@niagro.ni', '$2b$10$dummyhashsimulado1234567890abcdef', 2, 17);
-- =========================================
-- CREACIÓN DE TRIGGERS
-- =========================================

-- Cambiamos el delimitador para poder escribir lógica dentro de los triggers
DELIMITER //

-- Trigger 1: Liberación Automática
CREATE TRIGGER trg_LiberacionAutomatica
AFTER INSERT ON DeclaracionesAduana
FOR EACH ROW
BEGIN
    IF NEW.estado_levante = 'Verde' THEN
        UPDATE Embarques 
        SET estado_embarque = 'Liberado para Retiro'
        WHERE id_embarque = NEW.id_embarque_fk;
    END IF;
END //

-- Trigger 2: Validar Capacidad del Contenedor (Al Insertar)
CREATE TRIGGER trg_ValidarCapacidadContenedor_Insert
BEFORE INSERT ON DetalleMercancia
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM Embarque_Contenedores ec 
        JOIN Contenedores c ON ec.id_contenedor_fk = c.id_contenedor
        WHERE ec.id_embarque_fk = NEW.id_embarque_fk
        AND NEW.peso_neto > c.capacidad_maxima
    ) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Error: El peso de la mercancía excede la capacidad del contenedor asignado.';
    END IF;
END //

-- Trigger 3: Validar Capacidad del Contenedor (Al Actualizar)
CREATE TRIGGER trg_ValidarCapacidadContenedor_Update
BEFORE UPDATE ON DetalleMercancia
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM Embarque_Contenedores ec 
        JOIN Contenedores c ON ec.id_contenedor_fk = c.id_contenedor
        WHERE ec.id_embarque_fk = NEW.id_embarque_fk
        AND NEW.peso_neto > c.capacidad_maxima
    ) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Error: El peso de la mercancía excede la capacidad del contenedor asignado.';
    END IF;
END //

-- Trigger 4: Auditoría de Embarque
CREATE TRIGGER trg_AuditoriaEmbarque
AFTER UPDATE ON Embarques
FOR EACH ROW
BEGIN
    -- Nota: MySQL no permite usar PRINT dentro de triggers.
    -- Aquí deberías insertar un registro en una tabla de bitácora/logs en el futuro.
    -- Ejemplo: INSERT INTO LogsEmbarque (id_embarque, fecha) VALUES (NEW.id_embarque, NOW());
END //

-- Restauramos el delimitador estándar
DELIMITER ;