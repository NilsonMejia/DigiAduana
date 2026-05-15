require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'cambie-este-secreto-en-produccion',
  expiresIn: process.env.JWT_EXPIRES_IN || '8h'
};
