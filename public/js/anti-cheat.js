/**
 * public/js/anti-cheat.js
 * Sistema agresivo de detección de abandono y anti-capturas
 */

document.addEventListener("DOMContentLoaded", () => {
    let warnings = 0;
    const MAX_WARNINGS = 2;

    const warningOverlay = document.createElement("div");
    warningOverlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(220, 38, 38, 0.98); color: white;
        display: none; flex-direction: column; justify-content: center; align-items: center;
        z-index: 2147483647; text-align: center; font-family: "Inter", sans-serif; padding: 2rem;
    `;
    warningOverlay.innerHTML = `
        <h1 style="font-size: 3rem; margin-bottom: 1rem;">⚠️ ADVERTENCIA ⚠️</h1>
        <p style="font-size: 1.5rem; max-width: 600px; margin-bottom: 2rem;" id="warningMsg">
            Se ha detectado una acción no permitida.
        </p>
        <button id="btnAcknowledgeWarning" style="padding: 1rem 2rem; font-size: 1.2rem; background: #991b1b; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
            ENTENDIDO, VOLVER AL EXAMEN
        </button>
    `;
    document.body.appendChild(warningOverlay);

    const btnAck = document.getElementById("btnAcknowledgeWarning");
    btnAck.addEventListener("click", () => {
        warningOverlay.style.display = "none";
    });

    function triggerWarning(reason) {
        if (warningOverlay.style.display === "flex") return; // Ya está mostrando una
        
        warnings++;
        if (warnings > MAX_WARNINGS) {
            warningOverlay.innerHTML = `
                <h1 style="font-size: 3rem; margin-bottom: 1rem;">❌ EXAMEN CANCELADO ❌</h1>
                <p style="font-size: 1.5rem; max-width: 600px; margin-bottom: 2rem;">
                    Has excedido el límite de advertencias (${MAX_WARNINGS}). Por seguridad, la evaluación se ha cerrado.
                </p>
                <a href="/student" style="padding: 1rem 2rem; font-size: 1.2rem; background: #991b1b; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; text-decoration: none;">
                    VOLVER AL INICIO
                </a>
            `;
            warningOverlay.style.display = "flex";
            if (window.timerInterval) clearInterval(window.timerInterval);
        } else {
            document.getElementById("warningMsg").textContent = `${reason}. Advertencia ${warnings} de ${MAX_WARNINGS}.`;
            warningOverlay.style.display = "flex";
        }
    }

    // 1. Detectar pérdida de visibilidad de la pestaña
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            triggerWarning("Se ha detectado que cambiaste de pestaña o minimizaste el navegador");
        }
    });

    // 2. Detectar pérdida de foco en la ventana (cambio a otra app, herramienta de recortes, etc)
    window.addEventListener("blur", () => {
        triggerWarning("Se ha detectado que cambiaste de ventana o abriste otra aplicación");
    });

    // 3. Bloquear atajos de teclado y PrintScreen
    document.addEventListener("keydown", (e) => {
        // Bloquear PrintScreen, F12 (DevTools)
        if (e.key === "PrintScreen" || e.keyCode === 44 || e.keyCode === 123) {
            e.preventDefault();
            triggerWarning("Las herramientas de captura de pantalla o desarrollo no están permitidas");
            return false;
        }
        
        // Bloquear combinaciones con Ctrl / Cmd (Mac) / Shift+Win+S
        if (e.ctrlKey || e.metaKey) {
            const k = e.key ? e.key.toLowerCase() : String.fromCharCode(e.which).toLowerCase();
            if (["p", "s", "c", "x", "v", "u"].includes(k)) {
                e.preventDefault();
                triggerWarning("El uso de atajos de teclado (Copiar/Pegar/Imprimir) está bloqueado");
                return false;
            }
        }
    });

    // 4. Bloquear el evento de copia directamente
    document.addEventListener("copy", (e) => {
        e.preventDefault();
        triggerWarning("No está permitido copiar el contenido del examen");
        return false;
    });

    // 5. Bloquear click derecho
    document.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        triggerWarning("El clic derecho está desactivado por seguridad");
        return false;
    });

    // 6. Impedir selección de texto por CSS en todo el body (excepto inputs si los hubiera)
    const style = document.createElement("style");
    style.innerHTML = `
        body, .question-text, .question-prompt, .option-text, .reading-passage {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
        }
        @media print { 
            body { display: none !important; } 
        }
    `;
    document.head.appendChild(style);
});
