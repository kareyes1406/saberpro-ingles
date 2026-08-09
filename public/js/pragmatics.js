/* public/js/pragmatics.js */
document.addEventListener('DOMContentLoaded', () => {
    const draggables = document.querySelectorAll('.draggable-sign');
    const dropZones = document.querySelectorAll('.drop-zone');
    const signsContainer = document.getElementById('signsContainer');
    const submitBtn = document.getElementById('submitBtn');
    let startTime = Date.now();

    // Drag events
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            checkCompletion();
        });
    });

    // Dropzone events for map zones
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.closest('.map-zone').classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.closest('.map-zone').classList.remove('drag-over');
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.closest('.map-zone').classList.remove('drag-over');
            
            const draggable = document.querySelector('.dragging');
            if (draggable) {
                // If zone already has a sign, move it back to container
                const existingSign = zone.querySelector('.draggable-sign');
                if (existingSign) {
                    signsContainer.appendChild(existingSign);
                }
                
                // Hide placeholder
                const placeholder = zone.querySelector('.drop-placeholder');
                if (placeholder) placeholder.style.display = 'none';
                
                zone.appendChild(draggable);
                
                // Mascota: feedback de colocación
                if (typeof triggerMascota === 'function') {
                    triggerMascota('exito', '¡Aviso colocado! 📍');
                }
            }
        });
    });

    // Dropzone events for original container (to return signs)
    signsContainer.addEventListener('dragover', e => {
        e.preventDefault();
    });

    signsContainer.addEventListener('drop', e => {
        e.preventDefault();
        const draggable = document.querySelector('.dragging');
        if (draggable) {
            signsContainer.appendChild(draggable);
        }
        
        // Restore placeholders in empty map zones
        dropZones.forEach(zone => {
            if (!zone.querySelector('.draggable-sign')) {
                const placeholder = zone.querySelector('.drop-placeholder');
                if (placeholder) placeholder.style.display = 'block';
            }
        });
    });

    function checkCompletion() {
        const placedSigns = document.querySelectorAll('.drop-zone .draggable-sign');
        submitBtn.disabled = placedSigns.length < totalQuestions;
    }

    submitBtn.addEventListener('click', async () => {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Validando...';
        
        const matches = {};
        dropZones.forEach(zone => {
            const questionId = zone.dataset.questionId;
            const sign = zone.querySelector('.draggable-sign');
            if (sign) {
                matches[questionId] = sign.dataset.optionId;
            }
        });

        const timeSpent = Math.floor((Date.now() - startTime) / 1000);

        try {
            const response = await fetch('/game/pragmatics/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activityId, matches, timeSpent })
            });

            const result = await response.json();

            if (result.success) {
                showResults(result);
            } else {
                alert('Error al validar respuestas: ' + (result.error || 'Error desconocido'));
                submitBtn.disabled = false;
                submitBtn.textContent = 'Validar Ubicaciones';
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Validar Ubicaciones';
        }
    });

    function showResults(result) {
        showGameResultModal({
            passed: result.passed,
            title: result.passed ? '¡Excelente Trabajo!' : 'Inténtalo de Nuevo',
            xp: result.xpEarned,
            coins: result.coinsEarned,
            score: result.score,
            correct: result.correctCount,
            total: result.totalQ,
            message: result.passed 
                ? (result.alreadyCompleted 
                    ? 'Actividad completada previamente, no otorga recompensas extra.' 
                    : `Has ubicado correctamente ${result.correctCount} de ${result.totalQ} avisos.`)
                : `Solo ${result.correctCount} de ${result.totalQ} correctas. Necesitas un 60% para aprobar.`
        });
    }
});

function showGameResultModal(opts) {
    const victoryMemes = ['/images/memes/victory1.jpg', '/images/memes/victory2.jpg', '/images/memes/victory3.jpg'];
    const defeatMemes = ['/images/memes/defeat1.jpg'];
    const memeList = opts.passed ? victoryMemes : defeatMemes;
    const meme = memeList[Math.floor(Math.random() * memeList.length)];
    
    const overlay = document.createElement('div');
    overlay.className = 'game-result-modal';
    overlay.innerHTML = `
        <div class="game-result-card">
            <img src="${meme}" alt="Meme" class="result-meme-img">
            <h2 class="result-title ${opts.passed ? 'victory' : 'defeat'}">${opts.title}</h2>
            <div class="result-stats-grid">
                <div class="result-stat-item xp"><span class="stat-icon">⭐</span><span class="stat-value">${opts.passed ? '+' : ''}${opts.xp}</span><span class="stat-label">XP</span></div>
                <div class="result-stat-item coins"><span class="stat-icon">🪙</span><span class="stat-value">${opts.passed ? '+' : ''}${opts.coins}</span><span class="stat-label">Monedas</span></div>
                <div class="result-stat-item score"><span class="stat-icon">📊</span><span class="stat-value">${opts.score}%</span><span class="stat-label">Puntaje</span></div>
                <div class="result-stat-item correct"><span class="stat-icon">✅</span><span class="stat-value">${opts.correct}/${opts.total}</span><span class="stat-label">Correctas</span></div>
            </div>
            <p class="result-message">${opts.message || ''}</p>
            <a href="/student" class="result-btn ${opts.passed ? '' : 'defeat-btn'}">Volver al Mapa</a>
        </div>
    `;
    document.body.appendChild(overlay);
    if (opts.passed) {
        launchConfetti();
        if (typeof triggerMascota === 'function') triggerMascota('exito', '¡Ciudad organizada! 🗺️');
    } else {
        if (typeof triggerMascota === 'function') triggerMascota('error', 'Revisa las ubicaciones 🤔');
    }
    requestAnimationFrame(() => { requestAnimationFrame(() => { overlay.classList.add('active'); }); });
}

function launchConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    const colors = ['#f59e0b', '#7c3aed', '#06b6d4', '#10b981', '#ef4444', '#ec4899'];
    for (let i = 0; i < 60; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 2 + 's';
        piece.style.animationDuration = (2 + Math.random() * 2) + 's';
        piece.style.width = (6 + Math.random() * 8) + 'px';
        piece.style.height = (6 + Math.random() * 8) + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 5000);
}
