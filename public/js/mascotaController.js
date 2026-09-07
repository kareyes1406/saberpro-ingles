/**
 * mascotaController.js
 * Máquina de Estados para UDECIA — Compañera de Entrenamiento
 * 
 * Estados (14 imágenes):
 *   - idle: idle.png (quieta)
 *   - saludar: saludar.png
 *   - exito/celebrar: celebrar1.png, celebrar2.png, celebrar3.png (aleatorio)
 *   - error/triste: triste1.png, triste2.png, triste3.png (aleatorio)
 *   - pensando: pensar1.png, pensar2.png, pensar3.png (aleatorio)
 *   - explicar: explicar1.png, explicar2.png (aleatorio)
 *   - chatear: chatear.png
 * 
 * Función global: triggerMascota(estado, mensaje)
 */

(function () {
    'use strict';

    const BASE_PATH = '/img/mascota/';
    const IDLE_TIMEOUT = 15000; // 15 segundos de inactividad
    const REACTION_DURATION = 3000; // 3 segundos de reacción

    // Emociones con múltiples variantes (selección aleatoria)
    const EMOTIONS = {
        exito:    ['celebrar1.png', 'celebrar2.png', 'celebrar3.png'],
        error:    ['triste1.png', 'triste2.png', 'triste3.png'],
        pensando: ['pensar1.png', 'pensar2.png', 'pensar3.png'],
        saludar:  ['saludar.png'],
        explicar: ['explicar1.png', 'explicar2.png'],
        chatear:  ['chatear.png']
    };

    let currentSkin = 'idle.png';
    let idleTimer = null;
    let reactionTimer = null;
    let isReacting = false;

    /**
     * Selecciona una imagen aleatoria de un array de variantes
     */
    function pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * Cambia la imagen de UDECIA
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
     * Regresa al estado idle
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
     * Cambia a UDECIA al estado indicado y muestra el mensaje en el tooltip
     * 
     * @param {string} estado - 'exito', 'error', 'pensando', 'saludar', 'explicar', 'chatear'
     * @param {string} mensaje - Texto a mostrar en el globo
     */
    window.triggerMascota = function (estado, mensaje) {
        // Cancelar reacciones previas
        if (reactionTimer) {
            clearTimeout(reactionTimer);
            reactionTimer = null;
        }

        const emotionFiles = EMOTIONS[estado];
        if (!emotionFiles) return;

        isReacting = true;

        // Seleccionar imagen aleatoria del estado
        const selectedFile = pickRandom(emotionFiles);
        setMascotaImage(selectedFile);

        // Mostrar tooltip
        if (mensaje) {
            showTooltip(mensaje);
        }

        // Añadir animación
        const container = document.getElementById('mascotaContainer');
        if (container) {
            container.classList.remove('bounce', 'shake');
            void container.offsetWidth; // forzar reflow
            if (estado === 'exito' || estado === 'saludar') {
                container.classList.add('bounce');
            } else if (estado === 'error') {
                container.classList.add('shake');
            }
        }

        // Los estados "pensando", "explicar" y "chatear" no regresan solos
        if (estado !== 'pensando' && estado !== 'explicar' && estado !== 'chatear') {
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

        // Si está pensando por inactividad, regresar al idle
        if (!isReacting) {
            const img = document.getElementById('mascotaImg');
            if (img && (img.src.includes('pensar1') || img.src.includes('pensar2') || img.src.includes('pensar3'))) {
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
                if (!isReacting || document.getElementById('mascotaImg')?.src.includes('pensar')) {
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
        // UDECIA siempre empieza en idle
        currentSkin = 'idle.png';
        setMascotaImage(currentSkin);

        // Eventos de actividad del usuario para resetear el timer de inactividad
        ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(event => {
            document.addEventListener(event, resetIdleTimer, { passive: true });
        });

        // Iniciar timer de inactividad
        resetIdleTimer();

        // Interceptar fetch
        interceptFetch();

        // Click en UDECIA para un saludo
        const container = document.getElementById('mascotaContainer');
        if (container) {
            container.addEventListener('click', () => {
                const saludos = [
                    '¡Hola! Soy UDECIA, ¡tú puedes! 💪',
                    '¡Sigue adelante, vas muy bien! 🚀',
                    '¡Gran trabajo! Estoy orgullosa de ti ⭐',
                    '¡No te rindas, cada paso cuenta! 🔥',
                    '¡Eres increíble! Juntas lo lograremos 🎉',
                    '¡A por todas, campeón/a! 🏆',
                    '¡Recuerda practicar todos los días! 📚',
                    '¡Tu racha va genial, no la pierdas! 🔥'
                ];
                const msg = saludos[Math.floor(Math.random() * saludos.length)];
                triggerMascota('exito', msg);
            });
        }

        // Verificar si el usuario la había minimizado
        if (localStorage.getItem('udecia_minimized') === 'true') {
            const c = document.getElementById('mascotaContainer');
            const r = document.getElementById('mascotaRestoreBtn');
            if (c) c.style.display = 'none';
            if (r) r.style.display = 'flex';
        } else {
            // Saludo inicial al cargar la página
            setTimeout(() => {
                triggerMascota('saludar', '¡Hola! Soy UDECIA, tu compañera 👋');
            }, 1000);
        }
    }

    /**
     * Función global para ocultar / mostrar a UDECIA de forma desplegable
     */
    window.toggleMascotaVisibility = function (e) {
        if (e) e.stopPropagation();
        const container = document.getElementById('mascotaContainer');
        const restoreBtn = document.getElementById('mascotaRestoreBtn');
        if (!container) return;

        const isCurrentlyHidden = (container.style.display === 'none');
        if (isCurrentlyHidden) {
            container.style.display = 'block';
            if (restoreBtn) restoreBtn.style.display = 'none';
            localStorage.setItem('udecia_minimized', 'false');
            triggerMascota('saludar', '¡Aquí estoy de nuevo! 👋');
        } else {
            container.style.display = 'none';
            if (restoreBtn) restoreBtn.style.display = 'flex';
            localStorage.setItem('udecia_minimized', 'true');
        }
    };

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
