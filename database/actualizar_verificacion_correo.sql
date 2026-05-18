USE digiaduana;

-- Ejecuta este archivo completo una sola vez.
-- Es seguro volverlo a ejecutar: solo agrega columnas si no existen.

SET @db_name = DATABASE();

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE usuarios ADD COLUMN email_verified_at DATETIME NULL AFTER email_verificado',
    'SELECT ''email_verified_at ya existe'' AS mensaje'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'email_verified_at'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE usuarios ADD COLUMN verification_token VARCHAR(255) NULL AFTER email_verified_at',
    'SELECT ''verification_token ya existe'' AS mensaje'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'verification_token'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE usuarios ADD COLUMN token_expires_at DATETIME NULL AFTER verification_token',
    'SELECT ''token_expires_at ya existe'' AS mensaje'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'token_expires_at'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE usuarios ADD COLUMN verification_token_hash VARCHAR(255) NULL AFTER token_expires_at',
    'SELECT ''verification_token_hash ya existe'' AS mensaje'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'verification_token_hash'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE usuarios ADD COLUMN verification_expires DATETIME NULL AFTER verification_token_hash',
    'SELECT ''verification_expires ya existe'' AS mensaje'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'verification_expires'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE usuarios
SET email_verified_at = COALESCE(email_verified_at, NOW()),
    email_verificado = 1
WHERE email_verificado = 1
  AND email_verified_at IS NULL;

SELECT
  'Verificacion por correo lista' AS resultado,
  COUNT(*) AS usuarios_totales
FROM usuarios;
