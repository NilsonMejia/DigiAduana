import * as paisesModels from '../models/paisesModels.js';

const getPaises = async (req, res) => {
    try {
        const paises = await paisesModels.getAllPaises();
        res.json(paises);
    } catch (error) {
        console.error('Error en getPaises:', error);
        res.status(500).json({ error: 'Error al obtener países' });
    }
};

const getPais = async (req, res) => {
    try {
        const pais = await paisesModels.getPaisById(req.params.id);
        if (!pais) {
            return res.status(404).json({ error: 'País no encontrado' });
        }
        res.json(pais);
    } catch (error) {
        console.error('Error en getPais:', error);
        res.status(500).json({ error: 'Error al obtener país' });
    }
};

const buscarPais = async (req, res) => {
    try {
        const { nombre } = req.query;
        if (!nombre) {
            return res.status(400).json({ error: 'Se requiere el parámetro nombre' });
        }
        const paises = await paisesModels.getPaisByNombre(nombre);
        res.json(paises);
    } catch (error) {
        console.error('Error en buscarPais:', error);
        res.status(500).json({ error: 'Error en la búsqueda' });
    }
};

const getPaisesByContinente = async (req, res) => {
    try {
        const { continente } = req.params;
        const paises = await paisesModels.getPaisesByContinente(continente);
        res.json(paises);
    } catch (error) {
        console.error('Error en getPaisesByContinente:', error);
        res.status(500).json({ error: 'Error al filtrar por continente' });
    }
};

const createPais = async (req, res) => {
    try {
        const { nombre, capital, poblacion, continente, bandera_codigo } = req.body;
        
        if (!nombre || !capital || !poblacion || !continente || !bandera_codigo) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }
        
        const nuevoPais = await paisesModels.createPais({ nombre, capital, poblacion, continente, bandera_codigo });
        res.status(201).json(nuevoPais);
    } catch (error) {
        console.error('Error en createPais:', error);
        res.status(500).json({ error: 'Error al crear país' });
    }
};

const updatePais = async (req, res) => {
    try {
        const { nombre, capital, poblacion, continente, bandera_codigo } = req.body;
        const paisActualizado = await paisesModels.updatePais(req.params.id, { 
            nombre, capital, poblacion, continente, bandera_codigo 
        });
        
        if (!paisActualizado) {
            return res.status(404).json({ error: 'País no encontrado' });
        }
        
        res.json(paisActualizado);
    } catch (error) {
        console.error('Error en updatePais:', error);
        res.status(500).json({ error: 'Error al actualizar país' });
    }
};

const deletePais = async (req, res) => {
    try {
        const eliminado = await paisesModels.deletePais(req.params.id);
        
        if (!eliminado) {
            return res.status(404).json({ error: 'País no encontrado' });
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Error en deletePais:', error);
        res.status(500).json({ error: 'Error al eliminar país' });
    }
};

const getEstadisticas = async (req, res) => {
    try {
        const estadisticas = await paisesModels.getEstadisticas();
        res.json(estadisticas);
    } catch (error) {
        console.error('Error en getEstadisticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};

export {
    getPaises,
    getPais,
    buscarPais,
    getPaisesByContinente,
    createPais,
    updatePais,
    deletePais,
    getEstadisticas
};