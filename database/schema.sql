DROP DATABASE IF EXISTS digiaduana;
CREATE DATABASE digiaduana CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE digiaduana;

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE roles_permisos (
  rol_id INT NOT NULL,
  permiso_id INT NOT NULL,
  PRIMARY KEY (rol_id, permiso_id),
  CONSTRAINT fk_roles_permisos_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_roles_permisos_permiso FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(180) NOT NULL,
  tipo_persona ENUM('NATURAL','JURIDICA') DEFAULT 'JURIDICA',
  nit VARCHAR(20) NOT NULL UNIQUE,
  nrc VARCHAR(20),
  giro VARCHAR(180),
  direccion TEXT,
  telefono VARCHAR(30),
  correo VARCHAR(120),
  contacto_principal VARCHAR(120),
  estado ENUM('ACTIVO','INACTIVO') DEFAULT 'ACTIVO',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol_id INT NOT NULL,
  cliente_id INT NULL,
  estado ENUM('ACTIVO','INACTIVO','BLOQUEADO') DEFAULT 'ACTIVO',
  ultimo_acceso DATETIME NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_roles FOREIGN KEY (rol_id) REFERENCES roles(id),
  CONSTRAINT fk_usuarios_clientes FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE expedientes_aduanales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(40) NOT NULL UNIQUE,
  cliente_id INT NOT NULL,
  tipo_operacion ENUM('IMPORTACION','EXPORTACION','TRANSITO','REEXPORTACION') NOT NULL,
  regimen VARCHAR(80) NOT NULL,
  aduana_ingreso VARCHAR(120),
  aduana_salida VARCHAR(120),
  descripcion TEXT,
  responsable_id INT NULL,
  estado ENUM('BORRADOR','EN_REVISION','OBSERVADO','APROBADO','RECHAZADO','FINALIZADO') DEFAULT 'BORRADOR',
  fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre DATETIME NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_expedientes_clientes FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  CONSTRAINT fk_expedientes_responsable FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_expediente_estado (estado),
  INDEX idx_expediente_codigo (codigo)
) ENGINE=InnoDB;

CREATE TABLE cargas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expediente_id INT NOT NULL,
  numero_contenedor VARCHAR(30),
  tipo_carga ENUM('GENERAL','PELIGROSA','PERECEDERA','REFRIGERADA','FRAGIL','SOBREDIMENSIONADA') DEFAULT 'GENERAL',
  descripcion TEXT NOT NULL,
  peso_kg DECIMAL(12,2) DEFAULT 0,
  volumen_m3 DECIMAL(12,2) DEFAULT 0,
  bultos INT DEFAULT 0,
  valor_cif DECIMAL(14,2) DEFAULT 0,
  pais_origen VARCHAR(80),
  puerto_origen VARCHAR(120),
  puerto_destino VARCHAR(120),
  bl_master VARCHAR(80),
  bl_house VARCHAR(80),
  estado_logistico VARCHAR(80) DEFAULT 'REGISTRADA',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cargas_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes_aduanales(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE documentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expediente_id INT NOT NULL,
  tipo_documento ENUM('FACTURA_COMERCIAL','LISTA_EMPAQUE','BL','DUCA','PERMISO','CERTIFICADO_ORIGEN','DTE','OTRO') NOT NULL,
  nombre_original VARCHAR(255) NOT NULL,
  ruta_archivo VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) DEFAULT 'application/pdf',
  tamano_bytes BIGINT DEFAULT 0,
  estado_validacion ENUM('PENDIENTE','VALIDADO','RECHAZADO') DEFAULT 'PENDIENTE',
  observaciones TEXT,
  subido_por INT NULL,
  validado_por INT NULL,
  validado_en DATETIME NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_documentos_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes_aduanales(id) ON DELETE CASCADE,
  CONSTRAINT fk_documentos_subido_por FOREIGN KEY (subido_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_documentos_validado_por FOREIGN KEY (validado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE dte (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expediente_id INT NOT NULL,
  cliente_id INT NOT NULL,
  tipo_dte ENUM('FACTURA','COMPROBANTE_CREDITO_FISCAL','NOTA_CREDITO','NOTA_DEBITO','SUJETO_EXCLUIDO') NOT NULL,
  numero_control VARCHAR(80) NOT NULL UNIQUE,
  codigo_generacion VARCHAR(80) NOT NULL UNIQUE,
  sello_recepcion VARCHAR(120),
  total_gravado DECIMAL(14,2) DEFAULT 0,
  total_iva DECIMAL(14,2) DEFAULT 0,
  total DECIMAL(14,2) DEFAULT 0,
  estado ENUM('EMITIDO','VALIDADO','RECHAZADO','INVALIDADO','CONTINGENCIA') DEFAULT 'EMITIDO',
  respuesta_hacienda JSON NULL,
  observaciones TEXT,
  validado_en DATETIME NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dte_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes_aduanales(id),
  CONSTRAINT fk_dte_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)
) ENGINE=InnoDB;

CREATE TABLE detalle_dte (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dte_id INT NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  cantidad DECIMAL(12,2) NOT NULL,
  precio_unitario DECIMAL(14,2) NOT NULL,
  iva DECIMAL(14,2) DEFAULT 0,
  total DECIMAL(14,2) NOT NULL,
  CONSTRAINT fk_detalle_dte FOREIGN KEY (dte_id) REFERENCES dte(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE historial_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expediente_id INT NOT NULL,
  estado VARCHAR(80) NOT NULL,
  comentario TEXT,
  usuario_id INT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tracking_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes_aduanales(id) ON DELETE CASCADE,
  CONSTRAINT fk_tracking_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE bitacora_sistema (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  accion VARCHAR(80) NOT NULL,
  entidad VARCHAR(80) NOT NULL,
  entidad_id VARCHAR(80),
  detalle TEXT,
  ip_origen VARCHAR(80),
  user_agent VARCHAR(255),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bitacora_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO roles (id, nombre, descripcion) VALUES
(1, 'ADMINISTRADOR', 'Gestiona usuarios, roles, configuracion y auditoria'),
(2, 'SUPERVISOR', 'Supervisa operaciones, valida documentos y aprueba expedientes'),
(3, 'FREIGHT_FORWARDER', 'Registra expedientes, cargas, documentos y seguimiento operativo'),
(4, 'CLIENTE', 'Consulta el estado de sus expedientes y documentos'),
(5, 'SOPORTE_TECNICO', 'Consulta bitacoras y brinda soporte operativo');

INSERT INTO permisos (codigo, descripcion) VALUES
('usuarios.gestionar', 'Crear, actualizar y desactivar usuarios'),
('expedientes.crear', 'Crear expedientes aduanales'),
('expedientes.aprobar', 'Aprobar u observar expedientes'),
('documentos.subir', 'Subir documentos PDF'),
('documentos.validar', 'Validar o rechazar documentos'),
('dte.emitir', 'Emitir DTE'),
('dte.validar', 'Validar DTE contra Ministerio de Hacienda'),
('reportes.ver', 'Consultar reportes operativos'),
('tracking.ver', 'Consultar seguimiento de expedientes');

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos;

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT 2, id FROM permisos WHERE codigo IN ('expedientes.crear','expedientes.aprobar','documentos.subir','documentos.validar','dte.emitir','dte.validar','reportes.ver','tracking.ver');

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT 3, id FROM permisos WHERE codigo IN ('expedientes.crear','documentos.subir','dte.emitir','tracking.ver','reportes.ver');

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT 4, id FROM permisos WHERE codigo IN ('tracking.ver');

INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT 5, id FROM permisos WHERE codigo IN ('reportes.ver','tracking.ver');

INSERT INTO clientes (id, nombre, tipo_persona, nit, nrc, giro, direccion, telefono, correo, contacto_principal) VALUES
(1, 'Importadora Cuscatlan S.A. de C.V.', 'JURIDICA', '0614-010190-101-3', '123456-7', 'Importacion y distribucion', 'San Salvador, El Salvador', '+503 2200-0000', 'logistica@cuscatlan.test', 'Ana Martinez');

-- Usuario administrador inicial. Credenciales: admin@digiaduana.local / password
INSERT INTO usuarios (id, nombre, correo, password_hash, rol_id, estado) VALUES
(1, 'Administrador DigiAduana', 'admin@digiaduana.local', '$2b$10$QP6Hvb4EjmtRl6vVl6w/feNtRCJ8fThN.PBjiEggEzH4lRnpYaUCC', 1, 'ACTIVO');

INSERT INTO expedientes_aduanales
(id, codigo, cliente_id, tipo_operacion, regimen, aduana_ingreso, aduana_salida, descripcion, responsable_id, estado)
VALUES
(1, 'EXP-2026-000001', 1, 'IMPORTACION', 'Importacion definitiva', 'Aduana Maritima Acajutla', 'San Salvador', 'Carga general para distribucion local', 1, 'EN_REVISION');

INSERT INTO cargas
(expediente_id, numero_contenedor, tipo_carga, descripcion, peso_kg, volumen_m3, bultos, valor_cif, pais_origen, puerto_origen, puerto_destino, bl_master, estado_logistico)
VALUES
(1, 'MSCU1234567', 'GENERAL', 'Repuestos y accesorios industriales', 12650.50, 44.20, 320, 78500.00, 'China', 'Shanghai', 'Acajutla', 'MBL-SHA-2026-001', 'EN_TRANSITO');

INSERT INTO historial_tracking (expediente_id, estado, comentario, usuario_id) VALUES
(1, 'BORRADOR', 'Expediente creado', 1),
(1, 'EN_REVISION', 'Documentacion enviada a revision', 1);
