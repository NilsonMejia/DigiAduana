import db from '../db.js';  

const getAllPaises = async () => {
    const [rows] = await db.query('SELECT * FROM paises');
    return rows;
};

const getPaisById = async (id) => {
    const [rows] = await db.query('SELECT * FROM paises WHERE id = ?', [id]);
    return rows[0];
};

const getPaisByNombre = async (nombre) => {
    const [rows] = await db.query('SELECT * FROM paises WHERE nombre LIKE ?', [`%${nombre}%`]);
    return rows;
};

const getPaisesByContinente = async (continente) => {
    const [rows] = await db.query('SELECT * FROM paises WHERE continente = ?', [continente]);
    return rows;
};

const createPais = async (pais) => {
    const { nombre, capital, poblacion, continente, bandera_codigo } = pais;
    const [result] = await db.query(
        'INSERT INTO paises (nombre, capital, poblacion, continente, bandera_codigo) VALUES (?, ?, ?, ?, ?)',
        [nombre, capital, poblacion, continente, bandera_codigo]
    );
    return getPaisById(result.insertId);
};

const updatePais = async (id, pais) => {
    const { nombre, capital, poblacion, continente, bandera_codigo } = pais;
    await db.query(
        'UPDATE paises SET nombre = ?, capital = ?, poblacion = ?, continente = ?, bandera_codigo = ? WHERE id = ?',
        [nombre, capital, poblacion, continente, bandera_codigo, id]
    );
    return getPaisById(id);
};

const deletePais = async (id) => {
    const [result] = await db.query('DELETE FROM paises WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

const getEstadisticas = async () => {
    const [rows] = await db.query(
        'SELECT continente, SUM(poblacion) as poblacion_total, COUNT(*) as cantidad_paises FROM paises GROUP BY continente'
    );
    return rows;
};

export {
    getAllPaises,
    getPaisById,
    getPaisByNombre,
    getPaisesByContinente,
    createPais,
    updatePais,
    deletePais,
    getEstadisticas
};