# Catálogo Integral de Pruebas y Reporte de Calidad
## Plataforma Web Gamificada Saber Pro — Módulo de Inglés
**Proyecto de Grado / Tesis de Ingeniería**

---

### Resumen Ejecutivo de Pruebas

| Métrica | Resultado |
| :--- | :--- |
| **Total Suites de Pruebas** | **15 suites** |
| **Total Pruebas Ejecutadas** | **151 pruebas** |
| **Pruebas Aprobadas (Passed)** | **151 (100% de éxito)** |
| **Pruebas Fallidas (Failed)** | **0** |
| **Tiempo de Ejecución Total** | **22.8 segundos** |
| **Base de Datos Verificada** | **Azure SQL Server (Producción)** |
| **Reporte Gráfico Interactivo HTML** | `test-report/reporte-tests.html` |

---

### 1. Pruebas de Integración con Base de Datos Real (Azure SQL Server en Producción)
*Ejecutadas en modo de solo lectura (READ-ONLY) protegiendo la integridad de los datos en producción.*

#### A. Verificación del Esquema de Base de Datos (`database-schema.test.js` — 24 pruebas)
1. Existencia de la tabla `Users` y estructura de columnas.
2. Existencia de la tabla `Roles` y roles del sistema.
3. Existencia de la tabla `Modules`.
4. Existencia de la tabla `ModuleWeeks` (4 semanas activas en el diseño curricular).
5. Existencia de la tabla `Activities` y parámetros de recompensa.
6. Existencia de la tabla `ActivityTypes` y mecánicas de juego.
7. Existencia de la tabla `Questions` (preguntas ICFES).
8. Existencia de la tabla `QuestionOptions` (opciones por pregunta).
9. Existencia de la tabla `UserProgress` (registro de intentos y notas).
10. Existencia de la tabla `UserGamification` (XP, nivel, rachas, monedas).
11. Existencia de la tabla `UserBadges` (insignias desbloqueadas).
12. Existencia de la tabla `Badges` (catálogo de insignias).
13. Existencia de la tabla `UserExams` (puntajes por competencia).
14. Existencia de la tabla `EvaluationResults` (resultados evaluativos).
15. Existencia de la tabla `AuditLogs` (trazabilidad y auditoría).
16. Existencia de la tabla `ShopItems` (tienda de potenciadores).
17. Existencia de la tabla `UserInventory` (inventario adquirido).
18. Existencia de la tabla `Messages` (mensajería interna profesor-estudiante).
19. Verificación de **exactamente 245 preguntas** en banco Saber Pro.
20. Verificación de las 4 semanas del plan de estudio.
21. Verificación de los 7 tipos de preguntas correspondientes al estándar ICFES (Part 1 a Part 7).
22. Verificación de que cada pregunta cuenta con al menos 3 opciones de respuesta.
23. Verificación de los 3 roles del sistema: `student`, `admin` y `professor`.
24. Verificación de índices en columnas críticas (`UserID`, `ActivityID`, `QuestionID`).

#### B. Integridad de Datos en Producción (`database-data.test.js` — 10 pruebas)
1. Todas las 245 preguntas tienen sus respectivas opciones asociadas.
2. Cada pregunta de tipo `part1_notice` tiene exactamente 3 opciones.
3. Cada pregunta de tipo `part6_critical` tiene exactamente 4 opciones.
4. Las lecturas de `part5` y `part6` tienen `ReadingPassage` no nulo.
5. Los textos cloze de `part4` y `part7` tienen `ReadingPassage` no nulo.
6. Cada set de opciones tiene exactamente 1 opción marcada como correcta (`IsCorrect = 1`).
7. Todas las semanas tienen actividades asignadas.
8. Los artículos de la tienda tienen precios positivos.
9. Las contraseñas de los usuarios están cifradas con algoritmo Bcrypt (`$2a$` / `$2b$`).
10. Comprobación de que no existen contraseñas en texto plano.

#### C. Seguridad en Capa de Datos (`database-security.test.js` — 6 pruebas)
1. Conexión SSL/TLS obligatoria (`encrypt: true`) hacia Azure SQL.
2. Comprobación exhaustiva contra contraseñas no hasheadas.
3. Validación del formato de hash Bcrypt con factor de coste de seguridad.
4. Protección de columnas sensibles: `PasswordHash` no expuesto en consultas abiertas.
5. Tabla `AuditLogs` activa para registro de eventos del sistema.
6. Existencia del Stored Procedure `sp_UpdateUserStreak` para cálculo atómico de rachas.

---

### 2. Pruebas Unitarias de Modelos y Controladores (Backend)

#### A. Modelo de Usuarios (`User.test.js` — 9 pruebas)
- Búsqueda por correo (`findByEmail`) retornando usuario o null.
- Búsqueda por identificador único (`findById`).
- Creación segura de usuario (`create`).
- Eliminación con borrado en cascada controlado (`hardDeleteUser`).
- Activación de cuenta (`activateUser`).
- Generación y expiración de PIN de 10 minutos (`saveVerificationPin`).
- Actualización de marca de tiempo de último acceso (`updateLastLogin`).
- Conteo de usuarios activos (`getActiveCount`).

#### B. Modelo de Módulos y Preguntas (`Module.test.js` — 5 pruebas)
- Obtención de semanas ordenadas (`getWeeks`).
- Obtención de actividades por semana (`getWeekActivities`).
- Selección aleatoria de preguntas por tipo y estudiante (`getRandomQuestionsByType`).
- Algoritmo de agrupación `_groupQuestions`: transforma registros planos de SQL en objetos estructurados con arreglos de opciones.
- Obtención de lecturas con preguntas asociadas (`getRandomTextWithQuestions`).

#### C. Controlador de Autenticación (`authController.test.js` — 9 pruebas)
- Renderizado de vista de login (`showLogin`).
- Validación de campos obligatorios en login (`processLogin`).
- Rechazo de contraseñas erróneas con `bcrypt.compare`.
- Bloqueo de usuarios con cuenta inactiva (pendiente de activación por PIN).
- Establecimiento seguro de sesión tras login exitoso con regeneración de ID (`session.regenerate`).
- Validación estricta de formato de contraseña en registro (8+ caracteres, mayúsculas, símbolos).
- Registro con hashing Bcrypt de 12 rondas de sal.
- Verificación exitosa de PIN criptográfico.
- Cierre de sesión completo (`logout`): destrucción de sesión y limpieza de cookie `sessionId`.

#### D. Controlador de Exámenes (`examController.test.js` — 4 pruebas)
- Redirección automática si el Pre-Test diagnóstico ya fue presentado.
- Carga de preguntas aleatorias para el examen diagnóstico y guardado de respuestas en sesión.
- Cálculo de notas por competencias: Vocabulario, Pragmática, Lectura y Gramática.
- Integración con el motor de IA para clasificar el nivel MCER y generar la ruta adaptativa.

#### E. Controlador de Estudiantes (`studentController.test.js` — 4 pruebas)
- Bloqueo del roadmap y redirección al Pre-Test si no ha sido completado.
- Restricción estricta al plan curricular de 4 semanas.
- Control de estados por actividad: Bloqueada, Disponible, Completada.
- Actualización de perfil con hashing Bcrypt de 12 rondas.

---

### 3. Pruebas de Inteligencia Artificial y Algoritmos Adaptativos

#### A. Servicio de Ruta Adaptativa (`adaptivePathService.test.js` — 25 pruebas)
- **Clasificación en niveles del Marco Común Europeo (MCER)**:
  - `0 - 25%`: Nivel **A1** (Principiante)
  - `26 - 45%`: Nivel **A2** (Básico / Elemental)
  - `46 - 65%`: Nivel **B1** (Intermedio)
  - `66 - 85%`: Nivel **B2** (Intermedio Alto)
  - `86 - 100%`: Nivel **C1** (Avanzado)
- **Filtrado Inteligente de Contenido**:
  - Un estudiante en **A1** solo recibe actividades de Parts 1 y 2 en la primera semana (no se le exigen lecturas críticas avanzadas).
  - Un estudiante en **B1** recibe directamente Parts 4, 5 y 6, excluyendo contenidos básicos de A1.
  - Los estudiantes avanzados (B2/C1) se enfrentan a textos críticos complejos y cloze avanzado (Parts 6 y 7).
- **Progresión Semanal**:
  - Inclusión gradual de contenidos del siguiente nivel: 0% en semana 1, 20% en semana 2, 40% en semana 3 y 50% en semana 4.
- Persistencia de la ruta en la base de datos y consulta de tipos de preguntas permitidas por semana.

#### B. Modelos de Machine Learning (`mlService.test.js` — 16 pruebas)
- **Regresión Lineal (Linear Regression)**:
  - Proyección de puntajes futuros con amortiguación y límites acotados entre 0 y 100.
  - Cálculo de coeficiente de determinación $R^2$ para medir la calidad del ajuste de tendencia.
  - Generación de serie temporal de 12 puntos de proyección.
- **Regresión Logística (Logistic Regression)**:
  - Predicción de probabilidad de aprobación Saber Pro (entre 1% y 99%).
  - Detección automática de factores de riesgo: promedio bajo, múltiples reintentos por actividad e inactividad reciente.
- **Clustering K-Means (K=3)**:
  - Agrupación automática de estudiantes en tres perfiles: *Alto Rendimiento*, *En Progreso* y *En Riesgo*.
  - Normalización min-max de variables (promedio, XP acumulada, semanas completadas).

---

### 4. Checklist de Seguridad (20 Puntos Implementados y Verificados)

| # | Punto de Seguridad | Implementación en SaberPro | Resultado |
| :-: | :--- | :--- | :-: |
| **1** | **API keys hidden** | Variables sensibles en `.env`, no en código duro | **PASSED** |
| **2** | **Git secrets protected** | Archivo `.env` en `.gitignore` | **PASSED** |
| **3** | **DB SSL encryption** | Conexión Azure SQL con `encrypt: true` | **PASSED** |
| **4** | **App-level RLS** | Consultas aisladas por `req.session.userId` | **PASSED** |
| **5** | **Sensitive data encrypted** | Hashes Bcrypt verificados en producción | **PASSED** |
| **6** | **Server auth enforced** | `requireAuth`, `requireAdmin`, `requireProfessor` | **PASSED** |
| **7** | **Audit logs capability** | Tabla `AuditLogs` activa en base de datos | **PASSED** |
| **8** | **Field manipulation blocked** | Bloqueo estricto de tipos de contenido no usados | **PASSED** |
| **9** | **Session cookies protected** | Cookie `sessionId` con `httpOnly`, `sameSite: strict` | **PASSED** |
| **10** | **Passwords hashed** | Bcrypt con factor de costo de 12 rondas de sal | **PASSED** |
| **11** | **Login attempts limited** | Rate limiting de 5 intentos por ventana de tiempo | **PASSED** |
| **12** | **Bot protection** | Middleware `express-rate-limit` contra fuerza bruta | **PASSED** |
| **13** | **DB query monitoring** | Detección y log automático de queries lentas (>500ms) | **PASSED** |
| **14** | **Input validation** | Parámetros fuertemente tipados contra SQL Injection | **PASSED** |
| **15** | **User content escaped** | Auto-escape EJS (`<%= %>`) contra ataques XSS | **PASSED** |
| **16** | **File upload restricted** | Bloqueo de peticiones `multipart` con código HTTP 415 | **PASSED** |
| **17** | **API response limiting** | Rate limiting extendido a endpoints de recuperación y PIN | **PASSED** |
| **18** | **Security headers** | Helmet activo con HSTS, CSP y X-Frame-Options DENY | **PASSED** |
| **19** | **HTTPS forced** | Redirección obligatoria a HTTPS en producción | **PASSED** |
| **20** | **Dependency scanning** | Script de auditoría `npm run audit` configurado | **PASSED** |

---

### Cómo Visualizar el Reporte Interactivo para el Director de Tesis

1. El reporte HTML se genera automáticamente en la ruta:
   `saberpro-ingles/test-report/reporte-tests.html`
2. Puedes abrirlo directamente con cualquier navegador (Chrome, Edge, Firefox) haciendo doble clic en el archivo.
3. La interfaz cuenta con gráficos interactivos, tiempos de respuesta, desglose por suites de pruebas y estado de aprobación de cada una de las 151 pruebas.
