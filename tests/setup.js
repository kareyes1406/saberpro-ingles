/**
 * Configuración global para las pruebas de Jest
 */
require('dotenv').config();

// Establecer entorno de pruebas
process.env.NODE_ENV = 'test';

const { closePool } = require('../config/database');

// Aumentar el tiempo de espera por defecto si es necesario adicionalmente
jest.setTimeout(30000);

// Cerrar la conexión del pool de base de datos después de todas las pruebas
afterAll(async () => {
  try {
    if (typeof closePool === 'function') {
      await closePool();
    }
  } catch (error) {
    // Silencioso en caso de pruebas mockeadas
  }
});
