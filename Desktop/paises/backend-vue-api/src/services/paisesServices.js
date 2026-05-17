import db from '../db.js';

export const getPaises = async () => {
  const [rows] = await db.query('SELECT * FROM paises');
  return rows;
};

export const postCrearpais = async (nombre, capital, poblacion, continente, bandera_codigo) => {
  const [result] = await db.query(
    'INSERT INTO paises (nombre, capital, poblacion, continente, bandera_codigo) VALUES (?, ?, ?, ?, ?)',
    [nombre, capital, poblacion, continente, bandera_codigo]
  );

  return {
    id: result.insertId,
    nombre,
    capital,
    poblacion,
    continente,
    bandera_codigo,
  };
};

export const eliminarpais = async (id) => {
  const [result] = await db.query('DELETE FROM paises WHERE id = ?', [id]);

  if (result.affectedRows === 0) {
    return { message: 'Pais no encontrado' };
  }

  return { message: 'Pais eliminado correctamente' };
};

export const putActualizarpais = async ([nombre, capital, poblacion, continente, bandera_codigo, id]) => {
  const [result] = await db.query(
    'UPDATE paises SET nombre = ?, capital = ?, poblacion = ?, continente = ?, bandera_codigo = ? WHERE id = ?',
    [nombre, capital, poblacion, continente, bandera_codigo, id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return {
    id,
    nombre,
    capital,
    poblacion,
    continente,
    bandera_codigo,
  };
};
