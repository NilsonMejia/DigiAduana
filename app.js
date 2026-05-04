const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const mockHacienda = require('./src/mocks/hacienda');
const mockNavieras = require('./src/mocks/navieras');

const app = express();

app.use(helmet({
    contentSecurityPolicy: false 
})); 

app.use(helmet({ contentSecurityPolicy: false })); 
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static('public'));

app.use('/api/mock-hacienda', mockHacienda);
app.use('/api/mock-navieras', mockNavieras);

app.get('/', (req, res) => {
    res.send('Servidor Backend de DigiAduana en línea.');
});


app.get('/api', (req, res) => {
    res.status(200).json({ 
        mensaje: '¡Servidor de DigiAduana funcionando correctamente!',
        estado: 'OK'
    });
});

module.exports = app;