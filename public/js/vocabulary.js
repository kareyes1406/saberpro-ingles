document.addEventListener('DOMContentLoaded', () => {
    const chips = document.querySelectorAll('.word-chip');
    const matchedCountEl = document.getElementById('matchedCount');
    const coinCountEl = document.getElementById('coinCount');
    const progressFill = document.getElementById('progressFill');
    const submitBtn = document.getElementById('submitVocab');
    
    let selectedEnglish = null;
    let selectedSpanish = null;
    let matchedPairs = 0;
    let coins = 0;
    
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            if (chip.classList.contains('matched')) return;
            
            const side = chip.dataset.side;
            
            // Deselect logic
            if (side === 'english') {
                if (selectedEnglish === chip) {
                    chip.classList.remove('selected');
                    selectedEnglish = null;
                    return;
                }
                if (selectedEnglish) selectedEnglish.classList.remove('selected');
                selectedEnglish = chip;
                chip.classList.add('selected');
            } else {
                if (selectedSpanish === chip) {
                    chip.classList.remove('selected');
                    selectedSpanish = null;
                    return;
                }
                if (selectedSpanish) selectedSpanish.classList.remove('selected');
                selectedSpanish = chip;
                chip.classList.add('selected');
            }
            
            // Check match
            if (selectedEnglish && selectedSpanish) {
                checkMatch(selectedEnglish, selectedSpanish);
            }
        });
    });
    
    function checkMatch(engChip, spanChip) {
        if (engChip.dataset.pairId === spanChip.dataset.pairId) {
            // Match — éxito
            engChip.classList.remove('selected');
            spanChip.classList.remove('selected');
            engChip.classList.add('matched');
            spanChip.classList.add('matched');
            
            matchedPairs++;
            coins += 10;
            matchedCountEl.textContent = matchedPairs;
            coinCountEl.textContent = coins;
            
            // Update progress
            const total = typeof TOTAL_PAIRS !== 'undefined' ? TOTAL_PAIRS : 10;
            const percentage = (matchedPairs / total) * 100;
            progressFill.style.width = percentage + '%';
            
            // Mascota: éxito
            if (typeof triggerMascota === 'function') {
                triggerMascota('exito', `+10 🪙 ¡Bien hecho!`);
            }
            
            selectedEnglish = null;
            selectedSpanish = null;
            
            if (matchedPairs === total) {
                submitBtn.disabled = false;
                submitBtn.style.display = 'inline-block';
            }
        } else {
            // Error
            engChip.classList.add('error');
            spanChip.classList.add('error');
            
            // Mascota: error
            if (typeof triggerMascota === 'function') {
                triggerMascota('error', 'Cuidado, revisa bien 🤔');
            }
            
            setTimeout(() => {
                engChip.classList.remove('error', 'selected');
                spanChip.classList.remove('error', 'selected');
                selectedEnglish = null;
                selectedSpanish = null;
            }, 500);
        }
    }
    
    submitBtn.addEventListener('click', async () => {
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Procesando...';
        
        try {
            const res = await fetch('/game/vocabulary/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activityId: ACTIVITY_ID,
                    coinsEarned: coins,
                    matchedPairs: matchedPairs
                })
            });
            const data = await res.json();
            
            if (data.success || res.ok) {
                showGameResultModal({
                    passed: true,
                    title: '¡Nivel Completado!',
                    xp: data.xpEarned || 100,
                    coins: coins,
                    score: 100,
                    correct: matchedPairs,
                    total: TOTAL_PAIRS,
                    message: data.alreadyCompleted 
                        ? 'Ya habías completado esta actividad. No se otorgan recompensas extra.'
                        : '¡Has emparejado todas las palabras correctamente!'
                });
            } else {
                throw new Error(data.error || 'Error al enviar resultados');
            }
        } catch (err) {
            console.error('Error submitting vocab:', err);
            showGameResultModal({
                passed: false,
                title: 'Error de Conexión',
                xp: 0, coins: 0, score: 0, correct: 0, total: typeof TOTAL_PAIRS !== 'undefined' ? TOTAL_PAIRS : 10,
                message: 'No pudimos registrar tu puntaje. Revisa tu conexión e intenta de nuevo.'
            });
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
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
    
    // Crear el modal dinámicamente
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
    
    // Trigger confetti on victory
    if (opts.passed) {
        launchConfetti();
        if (typeof triggerMascota === 'function') {
            triggerMascota('exito', '¡Eres un crack! 🎉');
        }
    }
    
    // Activar con delay para la transición CSS
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
    });
}

/**
 * Lanza confetti visual
 */
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
