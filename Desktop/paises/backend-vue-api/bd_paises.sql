DROP DATABASE bd_paises;
CREATE DATABASE bd_paises;
USE bd_paises;

-- 1. Crear la tabla 
CREATE TABLE IF NOT EXISTS paises (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    capital VARCHAR(100) NOT NULL,
    poblacion BIGINT NOT NULL,
    continente VARCHAR(50) NOT NULL,
    bandera_codigo VARCHAR(10) NOT NULL
);
SELECT * FROM paises;
-- 2. Insertar 20 registros con datos de población, continente y código de bandera
INSERT INTO paises (nombre, capital, poblacion, continente, bandera_codigo) VALUES
('Venezuela (Bolivarian Republic of)', 'Caracas', 28435943, 'Americas', 've'),
('Uruguay', 'Montevideo', 3473727, 'Americas', 'uy'),
('El Salvador', 'San Salvador', 6336392, 'Americas', 'sv'),
('United States of America', 'Washington D.C.', 331449281, 'Americas', 'us'),
('Japón', 'Tokio', 125836021, 'Asia', 'jp'),
('Alemania', 'Berlín', 83240525, 'Europe', 'de'),
('Egipto', 'El Cairo', 102334404, 'Africa', 'eg'),
('Australia', 'Canberra', 25687041, 'Oceania', 'au'),
('Brasil', 'Brasilia', 212559417, 'Americas', 'br'),
('China', 'Pekín', 1439323776, 'Asia', 'cn'),
('España', 'Madrid', 47351567, 'Europe', 'es'),
('Nigeria', 'Abuya', 206139589, 'Africa', 'ng'),
('Francia', 'París', 65273511, 'Europe', 'fr'),
('India', 'Nueva Delhi', 1380004385, 'Asia', 'in'),
('Canadá', 'Ottawa', 37742154, 'Americas', 'ca'),
('Sudáfrica', 'Pretoria', 59308690, 'Africa', 'za'),
('Rusia', 'Moscú', 145912025, 'Europe', 'ru'),
('Argentina', 'Buenos Aires', 45195774, 'Americas', 'ar'),
('Corea del Sur', 'Seúl', 51269185, 'Asia', 'kr'),
('Nueva Zelanda', 'Wellington', 4822233, 'Oceania', 'nz');