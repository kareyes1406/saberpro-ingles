/**
 * Configuración de Jest para el proyecto SaberPro Inglés
 */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true,
  setupFilesAfterEnv: ['./tests/setup.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/public/', '/views/'],
  testPathIgnorePatterns: ['/node_modules/'],
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './test-report',
        filename: 'reporte-tests.html',
        pageTitle: 'SaberPro Inglés - Reporte de Pruebas',
        expand: true
      }
    ]
  ]
};
