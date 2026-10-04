/**
 * services/chatbotService.js
 * Motor de Chatbot Inteligente UDECIA
 * 
 * Diseñado para alta concurrencia y tolerancia a fallos:
 * - 100% en memoria: Responde en < 1ms por solicitud.
 * - Cero dependencias externas: Compatible con proxies universitarios y firewalls estrictos.
 * - Clasificación de intenciones por NLP y expresiones regulares con normalización en español.
 * - Escalación automática a docentes / administradores con registro de alta prioridad.
 */

class ChatbotService {
    /**
     * Normaliza un texto eliminando acentos, signos de puntuación y convirtiendo a minúsculas
     */
    static normalizeText(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
            .replace(/[¿?¡!.,;:_()\-]/g, ' ') // Quitar signos
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Procesa el mensaje del estudiante y genera una respuesta contextual
     * @param {string} userMessage - Mensaje original del estudiante
     * @param {object} userContext - Información del usuario (nombre, semana, etc.)
     * @returns {object} { reply: string, escalated: boolean, intent: string }
     */
    static processMessage(userMessage, userContext = {}) {
        const raw = userMessage || '';
        const normalized = this.normalizeText(raw);
        const firstName = userContext.FirstName || userContext.name || '';

        // 1. Detección de ESCALACIÓN A HUMANO (Docente / Administrador / Soporte)
        const escalationPatterns = [
            /\b(hablar con|comunicar(me)? con|conectar con|contactar|atencion)\b.*\b(humano|persona|asesor|profesor|profe|docente|administrador|admin|soporte)\b/,
            /\b(quiero|necesito|puedo)\b.*\b(humano|docente|profesor|profe|asesor)\b/,
            /\b(humano|docente|profesor|asesor|persona real)\b/,
            /\b(no me ayuda|no me sirve|no entiendo nada|no soluciono|queja|reclamo)\b/,
            /\b(hablar con docente|soporte humano|ayuda humana)\b/
        ];

        for (const pattern of escalationPatterns) {
            if (pattern.test(normalized)) {
                return {
                    escalated: true,
                    intent: 'escalate_to_human',
                    reply: `👨‍🏫 **Solicitud transferida al equipo docente**\n\n` +
                           `Hola ${firstName ? firstName + ', ' : ''}he transferido tu caso con **Alta Prioridad** a los profesores y administradores de la plataforma.\n\n` +
                           `📌 **¿Cómo te responderán?**\n` +
                           `• Tu docente revisará este mensaje directamente en su panel y te responderá aquí en este chat.\n` +
                           `• Si es necesario, también te contactarán a tu correo institucional.\n\n` +
                           `✍️ *Por favor deja abajo cualquier detalle adicional (número de semana, captura o descripción del problema) para que puedan ayudarte más rápido.*`
                };
            }
        }

        // 2. Saludos de cortesía
        if (/^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hey|que tal|saludos)\b/.test(normalized)) {
            return {
                escalated: false,
                intent: 'greeting',
                reply: `¡Hola${firstName ? ' ' + firstName : ''}! 👋 Soy **UDECIA**, tu asistente virtual de inglés Saber Pro.\n\n` +
                       `Puedo ayudarte con dudas sobre:\n` +
                       `• 🔓 **Desbloqueo de semanas** y módulos\n` +
                       `• ⚔️ **Batalla contra el Jefe** (75% requerido)\n` +
                       `• 🪙 **Monedas, rachas y pistas**\n` +
                       `• 📝 **Pre-Test y Post-Test**\n` +
                       `• 👨‍🏫 **Conectar con tu profesor**\n\n` +
                       `¿En qué puedo orientarte hoy?`
            };
        }

        // 3. Agradecimiento y despedidas
        if (/\b(gracias|muchas gracias|mil gracias|te agradezco|listo gracias|ok gracias)\b/.test(normalized)) {
            return {
                escalated: false,
                intent: 'gratitude',
                reply: `¡Con mucho gusto${firstName ? ', ' + firstName : ''}! 🌟 Recuerda que la constancia diaria es la clave para un puntaje alto en Saber Pro. ¡Mucho éxito en tus módulos de hoy!`
            };
        }

        if (/\b(chao|adios|hasta luego|nos vemos|bye)\b/.test(normalized)) {
            return {
                escalated: false,
                intent: 'farewell',
                reply: `¡Hasta pronto${firstName ? ' ' + firstName : ''}! Sigue practicando tu inglés. ¡Tu racha te espera mañana! 🔥`
            };
        }

        // 4. DESBLOQUEO DE SEMANAS (Semana 1 a 2, etc.)
        if (
            /\b(desbloquear|bloquead[oa]|candado|cerrad[oa]|no me deja entrar|no habilita|no me habilita|no puedo entrar|no pasa|pasar a la|abrir|siguiente semana|semana 2|semana 3|semana 4)\b/.test(normalized) ||
            /\bcomo paso de semana\b/.test(normalized)
        ) {
            return {
                escalated: false,
                intent: 'unlock_week',
                reply: `🔓 **¿Cómo desbloquear la siguiente semana?**\n\n` +
                       `Para que el sistema habilite automáticamente la siguiente semana debes completar 2 pasos indispensables:\n\n` +
                       `1️⃣ **Completar los 20 submódulos** de la semana en curso (todos los círculos del 1 al 20 en la ruta deben estar en verde/completados).\n` +
                       `2️⃣ **Derrotar al Jefe de Semana** (el portal de batalla al final del camino) obteniendo un puntaje igual o superior al **75%**.\n\n` +
                       `💡 *Nota:* Si ya completaste los 20 módulos pero el Jefe sigue cerrado o la siguiente semana bloqueada, ingresa a la batalla del Jefe y asegúrate de superar el 75%. ¡Al lograrlo, la siguiente semana se abrirá de inmediato!`
            };
        }

        // 5. JEFE DE SEMANA / BOSS BATTLE
        if (
            /\b(jefe|boss|batalla|portal|derrotar|vencer al jefe|puntaje del jefe|75)\b/.test(normalized)
        ) {
            return {
                escalated: false,
                intent: 'boss_battle',
                reply: `⚔️ **Batalla contra el Jefe de Semana**\n\n` +
                       `La batalla del Jefe evalúa de forma integral las 4 competencias trabajadas durante la semana:\n\n` +
                       `• **Requisito de victoria:** Debes alcanzar al menos el **75% de aciertos** para vencer al Jefe.\n` +
                       `• **Reintentos ilimitados:** Si no alcanzas el 75% en el primer intento, no te desanimes; puedes repetirlo las veces necesarias sin penalización.\n` +
                       `• **Recompensa:** Al vencerlo ganas XP adicional, monedas de oro y desbloqueas la siguiente semana de estudio.`
            };
        }

        // 6. MONEDAS Y TIENDA
        if (
            /\b(moneda|monedas|oro|coins|tienda|comprar|gastar monedas|para que sirven las monedas|ganar monedas)\b/.test(normalized)
        ) {
            return {
                escalated: false,
                intent: 'coins_system',
                reply: `🪙 **Monedas SaberPro**\n\n` +
                       `Ganas monedas cada vez que completas módulos, mantienes tu racha activa y vences a los Jefes:\n\n` +
                       `• 💡 **Comprar Pistas:** En las actividades de práctica puedes canjear monedas para descartar opciones incorrectas o ver ayudas gramaticales.\n` +
                       `• 🛡️ **Protector de Racha:** Te protege si un día no puedes ingresar a la plataforma por motivos de fuerza mayor.\n` +
                       `• 🏆 **Posición en el Ranking:** Refleja tu esfuerzo continuo en la tabla de clasificación.`
            };
        }

        // 7. PISTAS / HINTS
        if (
            /\b(pista|pistas|hint|hints|ayuda en pregunta|descartar opcion)\b/.test(normalized)
        ) {
            return {
                escalated: false,
                intent: 'hints',
                reply: `💡 **Uso de Pistas en las Preguntas**\n\n` +
                       `Cuando estés resolviendo un ejercicio difícil, busca el botón **'💡 Pista'** en la parte inferior:\n\n` +
                       `• Te costará una pequeña cantidad de monedas.\n` +
                       `• El sistema eliminará opciones distractores o te dará una clave sobre conectores, tiempos verbales o palabras clave del texto.\n` +
                       `• ¡Úsalas estratégicamente para asegurar tu racha de respuestas correctas!`
            };
        }

        // 8. RACHA / STREAK
        if (
            /\b(racha|dias seguidos|streak|fuego|llamas|perdi mi racha|recuperar racha)\b/.test(normalized)
        ) {
            return {
                escalated: false,
                intent: 'streak',
                reply: `🔥 **Tu Racha de Estudio Diario**\n\n` +
                       `La racha mide la consistencia de tu aprendizaje:\n\n` +
                       `• Sumas **+1 día de racha** con solo completar al menos una actividad al día.\n` +
                       `• Si dejas pasar un día completo sin entrar a la plataforma, el contador vuelve a cero.\n` +
                       `• La regularidad diaria activa la memoria a largo plazo indispensable para el vocabulario en inglés.`
            };
        }

        // 9. PRE-TEST Y POST-TEST (EVALUACIONES)
        if (
            /\b(pretest|pre test|posttest|post test|evaluacion|examen|prueba inicial|prueba final|primer examen|ultimo examen|diagnostico)\b/.test(normalized)
        ) {
            return {
                escalated: false,
                intent: 'exams',
                reply: `📝 **Evaluaciones: Pre-Test y Post-Test**\n\n` +
                       `• 🎯 **Pre-Test (Diagnóstico Inicial):** Es la primera prueba que realizas al registrarte. Mide tu nivel base antes de comenzar la plataforma.\n` +
                       `• 🎓 **Post-Test (Prueba Final):** Se habilita al completar todas las semanas de la ruta. Permite medir científicamente cuánto mejoraste tus habilidades en Vocabulario, Lectura, Avisos y Gramática.\n` +
                       `• 📊 **Visibilidad:** Tus profesores y administradores pueden ver ambos puntajes y tu evolución en su tablero analítico de la investigación.`
            };
        }

        // 10. NIVELES MCER (A1, A2, B1, B2, C1)
        if (
            /\b(mcer|nivel mcer|a1|a2|b1|b2|c1|nivel de ingles|marco comun)\b/.test(normalized)
        ) {
            return {
                escalated: false,
                intent: 'mcer_levels',
                reply: `🎯 **Niveles del Marco Común Europeo (MCER)**\n\n` +
                       `Tus puntajes se homologan con la escala oficial del ICFES Saber Pro:\n\n` +
                       `• **A1 (0 - 45%):** Principiante - Reconocimiento de palabras básicas y avisos cotidianos.\n` +
                       `• **A2 (46 - 65%):** Básico - Frases sencillas e información personal o social habitual.\n` +
                       `• **B1 (66 - 80%):** Intermedio - Comprensión de textos estándar y conversaciones formales (Nivel esperado universitario).\n` +
                       `• **B2 / C1 (81% - 100%):** Avanzado - Fluidez alta, estructuras complejas y comprensión crítica.\n\n` +
                       `Puedes consultar tu nivel actual en tu perfil de estudiante.`
            };
        }

        // 11. RADAR DE COMPETENCIAS / PREDICCIÓN IA
        if (
            /\b(radar|grafica|competencia|competencias|prediccion|inteligencia artificial|modelo ia|reporte ia|saber pro puntos)\b/.test(normalized)
        ) {
            return {
                escalated: false,
                intent: 'ai_radar',
                reply: `📊 **Reporte y Predicción con Inteligencia Artificial**\n\n` +
                       `En tu perfil encuentras un sistema de analítica predictiva basado en Machine Learning:\n\n` +
                       `• 📈 **Radar de 4 Competencias:** Desglosa tu dominio en Vocabulario, Lectura, Pragmática (avisos) y Gramática.\n` +
                       `• 🔮 **Proyección Saber Pro:** Calcula tu puntaje estimado en la prueba oficial del ICFES (escala de 0 a 300 puntos).\n` +
                       `• 🤖 **Recomendaciones automáticas:** Sugiere los módulos prioritarios en los que debes reforzar para maximizar tu puntaje.`
            };
        }

        // 12. PROBLEMAS TÉCNICOS / BUGS
        if (
            /\b(error|bug|falla|no carga|se queda pegado|se congelo|pantalla negra|pantalla blanca|no funciona|se cerro)\b/.test(normalized)
        ) {
            return {
                escalated: false,
                intent: 'technical_issue',
                reply: `🛠️ **Sugerencias para problemas técnicos**\n\n` +
                       `Si una actividad o vista no responde correctamente:\n\n` +
                       `1. Presiona \`Ctrl + F5\` en tu teclado para forzar la actualización limpia de la página.\n` +
                       `2. Verifica que tu conexión a internet esté estable.\n` +
                       `3. Te recomendamos usar Google Chrome o Microsoft Edge en su versión más reciente.\n\n` +
                       `Si el error continúa, responde escribiendo **'Hablar con soporte'** para que un administrador técnico revise tu caso inmediatamente.`
            };
        }

        // 13. FALLBACK INTELIGENTE CON OPCIÓN DE ESCALACIÓN
        return {
            escalated: false,
            intent: 'fallback',
            reply: `🤖 No estoy seguro de entender del todo tu pregunta, pero puedo ayudarte con lo siguiente:\n\n` +
                   `• 🔓 **¿Cómo desbloquear semanas y módulos?**\n` +
                   `• ⚔️ **¿Cómo derrotar al Jefe de Semana? (75%)**\n` +
                   `• 🪙 **¿Para qué sirven las monedas y pistas?**\n` +
                   `• 📝 **Información sobre el Pre-Test y Post-Test**\n\n` +
                   `Si necesitas asistencia humana sobre notas o situaciones particulares, escribe **'Hablar con docente'** o haz clic en esa opción y transferiré tu mensaje a tu profesor.`
        };
    }
}

module.exports = ChatbotService;
