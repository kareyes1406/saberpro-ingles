/**
 * Mocks de base de datos para pruebas unitarias
 * Simula el paquete mssql de Azure SQL Server
 */

// Simulación de los tipos de datos de mssql
const mockSqlTypes = {
  Int: 'Int',
  NVarChar: 'NVarChar',
  Decimal: 'Decimal',
  Bit: 'Bit',
  Float: 'Float',
  DateTime: 'DateTime',
  VarChar: 'VarChar',
  Text: 'Text'
};

/**
 * Crea una función mock para executeQuery que retorna las respuestas en secuencia
 * @param {Array} responses - Arreglo de respuestas (recordsets)
 * @returns {jest.Mock} Función mock
 */
const createMockExecuteQuery = (responses = []) => {
  const mockFn = jest.fn();
  
  if (responses.length === 0) {
    mockFn.mockResolvedValue([]);
  } else {
    responses.forEach(response => {
      mockFn.mockResolvedValueOnce(response);
    });
    // Respuesta por defecto si se llama más veces de las esperadas
    mockFn.mockResolvedValue([]);
  }
  
  return mockFn;
};

/**
 * Helper para crear una respuesta que simula un recordset de mssql
 * @param {Array} rows - Filas de la respuesta
 * @returns {Array} Array que representa el recordset
 */
const createMockRecordset = (rows = []) => {
  return rows;
};

module.exports = {
  mockSqlTypes,
  createMockExecuteQuery,
  createMockRecordset
};
