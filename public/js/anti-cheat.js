/**
 * public/js/anti-cheat.js
 * Sistema de detección de abandono y anti-capturas
 */

document.addEventListener("DOMContentLoaded", () => {
    let warnings = 0;
    const MAX_WARNINGS = 2;

    const warningOverlay = document.createElement("div");
    warningOverlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(220, 38, 38, 0.95); color: white;
        display: none; flex-direction: column; justify-content: center; align-items: center;
        z-index: 9999; text-align: center; font-family: "Inter", sans-serif; padding: 2rem;
    `;
    warningOverlay.innerHTML = `
        <h1 style="font-size: 3rem; margin-bottom: 1rem;">⚠️ ADVERTENCIA ⚠️</h1>
        <p style="font-size: 1.5rem; max-width: 600px; margin-bottom: 2rem;" id="warningMsg">
            Se ha detectado que cambiaste de ventana o intentaste usar atajos prohibidos.
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

    window.addEventListener("blur", () => {
        triggerWarning("Se ha detectado que abandonaste la pestaña del examen");
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "PrintScreen" || e.keyCode === 44) {
            e.preventDefault();
            navigator.clipboard.writeText("");
            triggerWarning("Se ha detectado un intento de captura de pantalla");
        }
        if (e.ctrlKey || e.metaKey) {
            const k = String.fromCharCode(e.which).toLowerCase();
            if (k === "p" || k === "s" || k === "c") {
                e.preventDefault();
                triggerWarning("El uso de atajos de teclado no está permitido");
            }
        }
    });

    const style = document.createElement("style");
    style.innerHTML = "@media print { body { display: none !important; } }";
    document.head.appendChild(style);
});
