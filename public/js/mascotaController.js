/**
 * mascotaController.js
 * Máquina de Estados para la Mascota Interactiva (Husky)
 * 
 * Estados:
 *   - idle: Skin base según el módulo actual
 *   - exito: feliz.png (3 segundos, luego regresa a skin base)
 *   - error: triste.png (3 segundos, luego regresa a skin base)
 *   - pensando: pensando.png (inactividad > 15s o fetch en curso)
 * 
 * Función global: triggerMascota(estado, mensaje)
 */

(function () {
    'use strict';

    const BASE_PATH = '/img/mascota/';
    const IDLE_TIMEOUT = 15000; // 15 segundos de inactividad
    const REACTION_DURATION = 3000; // 3 segundos de reacción

    // Mapeo de rutas a skins
    const SKIN_MAP = {
        'vocabulary': 'skin-vocabulario.png',
        'reading': 'skin-lectura.png',
        'pragmatics': 'skin-pragmatica.png',
        'grammar': 'skin-gramatica.png',
        'boss': 'skin-jefe.png'
    };

    // Emociones
    const EMOTIONS = {
        exito: 'feliz.png',
        error: 'triste.png',
        pensando: 'pensando.png'
    };

    let currentSkin = 'idle.png';
    let idleTimer = null;
    let reactionTimer = null;
    let isReacting = false;

    /**
     * Detecta el skin base según la URL actual
     */
    function detectSkin() {
        const path = window.location.pathname;
        for (const [key, skin] of Object.entries(SKIN_MAP)) {
            if (path.includes(key)) {
                return skin;
            }
        }
        return 'idle.png';
    }

    /**
     * Cambia la imagen de la mascota
     */
    function setMascotaImage(filename) {
        const img = document.getElementById('mascotaImg');
        if (img) {
            img.src = BASE_PATH + filename;
        }
    }

    /**
     * Muestra el tooltip con un mensaje
     */
    function showTooltip(message) {
        const tooltip = document.getElementById('mascotaTooltip');
        if (!tooltip) return;
        tooltip.textContent = message;
        tooltip.classList.add('visible');
    }

    /**
     * Oculta el tooltip
     */
    function hideTooltip() {
        const tooltip = document.getElementById('mascotaTooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }

    /**
     * Regresa al skin base del módulo actual
     */
    function returnToBaseSkin() {
        isReacting = false;
        
        if (reactionTimer) {
            clearTimeout(reactionTimer);
            reactionTimer = null;
        }

        setMascotaImage(currentSkin);
        hideTooltip();
    }

    /**
     * Función global: triggerMascota(estado, mensaje)
     * Cambia la mascota al estado indicado y muestra el mensaje en el tooltip
     * 
     * @param {string} estado - 'exito', 'error', 'pensando'
     * @param {string} mensaje - Texto a mostrar en el globo
     */
    window.triggerMascota = function (estado, mensaje) {
        // Cancelar reacciones previas
        if (reactionTimer) {
            clearTimeout(reactionTimer);
            reactionTimer = null;
        }

        const emotionFile = EMOTIONS[estado];
        if (!emotionFile) return;

        isReacting = true;

        // Cambiar imagen
        setMascotaImage(emotionFile);

        // Mostrar tooltip
        if (mensaje) {
            showTooltip(mensaje);
        }

        // Añadir animación de bounce
        const container = document.getElementById('mascotaContainer');
        if (container) {
            container.classList.remove('bounce', 'shake');
            void container.offsetWidth; // forzar reflow
            if (estado === 'exito') {
                container.classList.add('bounce');
            } else if (estado === 'error') {
                container.classList.add('shake');
            }
        }

        // Estado "pensando" no regresa solo, se queda hasta que otro evento lo cambie
        if (estado !== 'pensando') {
            reactionTimer = setTimeout(() => {
                returnToBaseSkin();
            }, REACTION_DURATION);
        }
    };

    /**
     * Resetea el temporizador de inactividad
     */
    function resetIdleTimer() {
        if (idleTimer) {
            clearTimeout(idleTimer);
        }

        // Si está pensando por inactividad, regresar al skin base
        if (!isReacting) {
            const img = document.getElementById('mascotaImg');
            if (img && img.src.includes('pensando.png')) {
                returnToBaseSkin();
            }
        }

        idleTimer = setTimeout(() => {
            if (!isReacting) {
                triggerMascota('pensando', '¿Necesitas una pista? 🤔');
            }
        }, IDLE_TIMEOUT);
    }

    /**
     * Interceptar fetch para mostrar "pensando" durante peticiones AJAX
     */
    function interceptFetch() {
        const originalFetch = window.fetch;
        window.fetch = function (...args) {
            if (!isReacting) {
                triggerMascota('pensando', 'Procesando...');
            }
            return originalFetch.apply(this, args).then(response => {
                // Regresar a skin base cuando termina la petición
                if (!isReacting || document.getElementById('mascotaImg')?.src.includes('pensando.png')) {
                    returnToBaseSkin();
                }
                return response;
            }).catch(err => {
                returnToBaseSkin();
                throw err;
            });
        };
    }

    /**
     * Inicialización
     */
    function init() {
        // Detectar skin base
        currentSkin = detectSkin();
        setMascotaImage(currentSkin);

        // Eventos de actividad del usuario para resetear el timer de inactividad
        ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(event => {
            document.addEventListener(event, resetIdleTimer, { passive: true });
        });

        // Iniciar timer de inactividad
        resetIdleTimer();

        // Interceptar fetch
        interceptFetch();

        // Click en la mascota para un saludo aleatorio
        const container = document.getElementById('mascotaContainer');
        if (container) {
            container.addEventListener('click', () => {
                const saludos = [
                    '¡Tú puedes! 💪',
                    '¡Sigue adelante! 🚀',
                    '¡Gran trabajo! ⭐',
                    '¡No te rindas! 🔥',
                    '¡Eres increíble! 🎉',
                    '¡A por todas! 🏆'
                ];
                const msg = saludos[Math.floor(Math.random() * saludos.length)];
                triggerMascota('exito', msg);
            });
        }
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
