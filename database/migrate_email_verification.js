require('dotenv').config();

const mysql = require('mysql2/promise');

async function columnExists(db, columnName) {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'usuarios'
       AND COLUMN_NAME = ?`,
    [process.env.DB_NAME, columnName]
  );

  return rows.length > 0;
}

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  if (!(await columnExists(db, 'email_verificado'))) {
    await db.query('ALTER TABLE usuarios ADD COLUMN email_verificado TINYINT(1) DEFAULT 0 AFTER estado');
  }

  if (!(await columnExists(db, 'verification_token_hash'))) {
    await db.query(
      'ALTER TABLE usuarios ADD COLUMN verification_token_hash VARCHAR(255) NULL AFTER email_verificado'
    );
  }

  if (!(await columnExists(db, 'verification_expires'))) {
    await db.query(
      'ALTER TABLE usuarios ADD COLUMN verification_expires DATETIME NULL AFTER verification_token_hash'
    );
  }

  await db.query("UPDATE usuarios SET email_verificado = 1 WHERE correo LIKE '%@digiaduana.local' OR id = 1");

  const [columns] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'usuarios'
       AND COLUMN_NAME IN ('email_verificado', 'verification_token_hash', 'verification_expires')
     ORDER BY ORDINAL_POSITION`,
    [process.env.DB_NAME]
  );

  console.log(`Columnas listas: ${columns.map((column) => column.COLUMN_NAME).join(', ')}`);
  await db.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
