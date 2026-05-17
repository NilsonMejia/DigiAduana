require('dotenv').config();

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const users = [
  ['Administrador DigiAduana', 'admin@digiaduana.local', 'admin123', 1, null],
  ['Valeria Menendez', 'forwarder@digiaduana.local', 'forwarder123', 3, null],
  ['Mario Escobar', 'supervisor@digiaduana.local', 'supervisor123', 2, null],
  ['Ana Morales', 'cliente@digiaduana.local', 'cliente123', 4, 1],
  ['Diego Guardado', 'soporte@digiaduana.local', 'soporte123', 5, null]
];

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  for (const [nombre, correo, password, rolId, clienteId] of users) {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO usuarios
       (nombre, correo, password_hash, rol_id, cliente_id, estado, email_verificado)
       VALUES (?, ?, ?, ?, ?, 'ACTIVO', 1)
       ON DUPLICATE KEY UPDATE
         nombre = VALUES(nombre),
         password_hash = VALUES(password_hash),
         rol_id = VALUES(rol_id),
         cliente_id = VALUES(cliente_id),
         estado = 'ACTIVO',
         email_verificado = 1`,
      [nombre, correo, hash, rolId, clienteId]
    );
  }

  const [rows] = await db.query(
    `SELECT u.correo, r.nombre AS rol, u.estado, u.email_verificado
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.correo LIKE '%@digiaduana.local'
     ORDER BY u.id`
  );
  console.table(rows);
  await db.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
