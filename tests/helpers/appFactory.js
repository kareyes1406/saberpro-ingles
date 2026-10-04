/**
 * Fábrica de la aplicación Express para pruebas de integración
 */
const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const request = require('supertest');

/**
 * Crea una aplicación Express mínima configurada para pruebas
 * @returns {Object} Aplicación Express
 */
const createApp = () => {
  const app = express();

  // Middleware de seguridad
  app.use(helmet({
    contentSecurityPolicy: false // Desactivado para simplificar pruebas
  }));

  // Límite de peticiones
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // Límite de 100 peticiones
  });
  app.use(limiter);

  // Analizadores de cuerpo (Body parsers)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Configuración de la sesión en memoria para pruebas
  app.use(session({
    secret: process.env.SESSION_SECRET || 'secreto_de_prueba_seguro_123',
    resave: false,
    saveUninitialized: false,
    store: new session.MemoryStore(),
    cookie: {
      secure: false, // false para pruebas locales sin HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
  }));

  // Configuración de vistas
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../../views'));

  // Aquí se deben importar y montar las rutas reales de la aplicación
  try {
    // Si tienes un archivo que exporta un enrutador principal en /routes/index.js
    // const routes = require('../../routes');
    // app.use('/', routes);
  } catch (error) {
    console.warn('Advertencia: Rutas no montadas en la aplicación de prueba.');
  }

  // Middleware de manejo de errores
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
      error: {
        message: err.message
      }
    });
  });

  return app;
};

/**
 * Crea un agente de supertest autenticado
 * @param {Object} user - Datos del usuario para simular autenticación
 * @returns {Promise<Object>} Objeto con el agente y la app
 */
const createAuthenticatedAgent = async (user = { id: 1, email: 'test@test.com', rol: 'estudiante' }) => {
  const app = createApp();
  
  // Agregar una ruta temporal solo para pruebas para iniciar sesión simulada
  app.post('/test-login', (req, res) => {
    req.session.userId = user.id;
    req.session.user = user;
    res.status(200).json({ success: true });
  });
  
  const agent = request.agent(app);
  await agent.post('/test-login').send();
  
  return { agent, app };
};

module.exports = {
  createApp,
  createAuthenticatedAgent
};
