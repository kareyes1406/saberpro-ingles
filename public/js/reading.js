document.addEventListener('DOMContentLoaded', () => {
    const blocks = document.querySelectorAll('.text-block');
    const dropZones = document.querySelectorAll('.drop-zone');
    const sourceArea = document.getElementById('blocksSource');
    const previewText = document.getElementById('previewText');
    const submitBtn = document.getElementById('submitReading');
    
    let draggedBlock = null;
    let startTime = Date.now();
    
    blocks.forEach(block => {
        block.addEventListener('dragstart', function(e) {
            draggedBlock = this;
            setTimeout(() => this.style.opacity = '0.5', 0);
        });
        
        block.addEventListener('dragend', function() {
            setTimeout(() => {
                this.style.opacity = '1';
                draggedBlock = null;
                updatePreview();
            }, 0);
        });
    });
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', e => {
            zone.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            if (draggedBlock) {
                // If zone already has a block, swap them
                if (zone.children.length > 0) {
                    const existingBlock = zone.children[0];
                    if (draggedBlock.parentElement.classList.contains('drop-zone')) {
                        draggedBlock.parentElement.appendChild(existingBlock);
                    } else {
                        sourceArea.appendChild(existingBlock);
                    }
                }
                zone.appendChild(draggedBlock);
            }
        });
    });
    
    if (sourceArea) {
        sourceArea.addEventListener('dragover', e => e.preventDefault());
        sourceArea.addEventListener('drop', e => {
            e.preventDefault();
            if (draggedBlock) {
                sourceArea.appendChild(draggedBlock);
            }
        });
    }
    
    function updatePreview() {
        const parts = [];
        dropZones.forEach(zone => {
            if (zone.children.length > 0) {
                parts.push(zone.children[0].textContent.trim());
            } else {
                parts.push('_____');
            }
        });
        previewText.textContent = parts.join(' ');
    }
    
    submitBtn.addEventListener('click', async () => {
        const arrangement = [];
        let placedCount = 0;
        
        dropZones.forEach(zone => {
            if (zone.children.length > 0) {
                placedCount++;
                arrangement.push(zone.children[0].dataset.blockId);
            }
        });
        
        if (placedCount < dropZones.length) {
            if (typeof triggerMascota === 'function') {
                triggerMascota('error', '¡Faltan bloques por colocar! 📝');
            }
            return;
        }
        
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        
        try {
            const res = await fetch('/game/reading/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activityId: ACTIVITY_ID,
                    arrangement: arrangement,
                    timeSpent: timeSpent
                })
            });
            const data = await res.json();
            if (data.success || res.ok) {
                if (data.passed) {
                    showGameResultModal({
                        passed: true,
                        title: '¡Lectura Ensamblada!',
                        xp: data.xpEarned || 0,
                        coins: data.coinsEarned || 0,
                        score: data.score,
                        correct: data.correctCount,
                        total: data.totalBlocks,
                        message: data.alreadyCompleted 
                            ? 'Ya habías completado esta actividad. No se otorgan recompensas extra.'
                            : '¡Excelente comprensión lectora!'
                    });
                } else {
                    showGameResultModal({
                        passed: false,
                        title: 'Inténtalo de Nuevo',
                        xp: 0,
                        coins: 0,
                        score: data.score,
                        correct: data.correctCount,
                        total: data.totalBlocks,
                        message: `Necesitas al menos el 60% para aprobar. ¡Reorganiza los bloques!`
                    });
                    
                    // Highlight incorrect blocks
                    dropZones.forEach(zone => {
                        if (zone.children.length > 0) {
                            const block = zone.children[0];
                            const correctPos = parseInt(block.dataset.correctPos, 10);
                            const pos = parseInt(zone.dataset.position, 10);
                            if (pos !== correctPos) {
                                block.classList.add('error');
                                setTimeout(() => block.classList.remove('error'), 1500);
                            }
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Error submitting reading:', err);
        }
    });
});

/**
 * Muestra el modal de resultado estándar con meme de Nanobanana
 */
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
                <div class="result-stat-item xp">
                    <span class="stat-icon">⭐</span>
                    <span class="stat-value">${opts.passed ? '+' : ''}${opts.xp}</span>
                    <span class="stat-label">XP</span>
                </div>
                <div class="result-stat-item coins">
                    <span class="stat-icon">🪙</span>
                    <span class="stat-value">${opts.passed ? '+' : ''}${opts.coins}</span>
                    <span class="stat-label">Monedas</span>
                </div>
                <div class="result-stat-item score">
                    <span class="stat-icon">📊</span>
                    <span class="stat-value">${opts.score}%</span>
                    <span class="stat-label">Puntaje</span>
                </div>
                <div class="result-stat-item correct">
                    <span class="stat-icon">✅</span>
                    <span class="stat-value">${opts.correct}/${opts.total}</span>
                    <span class="stat-label">Correctas</span>
                </div>
            </div>
            <p class="result-message">${opts.message || ''}</p>
            <a href="/student" class="result-btn ${opts.passed ? '' : 'defeat-btn'}">Volver al Mapa</a>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    if (opts.passed) {
        launchConfetti();
        if (typeof triggerMascota === 'function') {
            triggerMascota('exito', '¡Lectura magistral! 📖');
        }
    } else {
        if (typeof triggerMascota === 'function') {
            triggerMascota('error', 'No te rindas, intenta de nuevo 💪');
        }
    }
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
    });
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
