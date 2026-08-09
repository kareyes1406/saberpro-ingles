/* public/js/grammar.js */
document.addEventListener('DOMContentLoaded', () => {
    const circuitRows = document.querySelectorAll('.circuit-row');
    const submitBtn = document.getElementById('submitBtn');
    let startTime = Date.now();
    const answers = {};

    circuitRows.forEach(row => {
        const questionId = row.dataset.questionId;
        const socket = row.querySelector('.socket');
        const chips = row.querySelectorAll('.chip-btn');

        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                // Remove selected class from all chips in this row
                chips.forEach(c => c.classList.remove('selected'));
                // Add to clicked chip
                chip.classList.add('selected');
                
                // Update socket
                socket.textContent = chip.textContent;
                socket.classList.remove('empty');
                socket.classList.add('filled');
                
                // Store answer
                answers[questionId] = chip.dataset.optionId;
                
                // Mascota: feedback al seleccionar pieza
                if (typeof triggerMascota === 'function') {
                    triggerMascota('exito', '¡Pieza ensamblada! ⚡');
                }
                
                checkCompletion();
            });
        });

        // Click on socket to clear it
        socket.addEventListener('click', () => {
            socket.innerHTML = '<span class="placeholder">...</span>';
            socket.classList.add('empty');
            socket.classList.remove('filled');
            chips.forEach(c => c.classList.remove('selected'));
            delete answers[questionId];
            checkCompletion();
        });
    });

    function checkCompletion() {
        const answeredCount = Object.keys(answers).length;
        submitBtn.disabled = answeredCount < totalQuestions;
    }

    submitBtn.addEventListener('click', async () => {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Procesando Energía...';
        
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);

        try {
            const response = await fetch('/game/grammar/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activityId, answers, timeSpent })
            });

            const result = await response.json();

            if (result.success) {
                animateCircuits(result);
            } else {
                alert('Error al validar respuestas: ' + (result.error || 'Error desconocido'));
                submitBtn.disabled = false;
                submitBtn.textContent = 'Energizar Circuitos';
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Energizar Circuitos';
        }
    });

    function animateCircuits(result) {
        // Animate each row based on results
        result.results.forEach(res => {
            const row = document.querySelector(`.circuit-row[data-question-id="${res.questionId}"]`);
            if (row) {
                if (res.isCorrect) {
                    row.classList.add('success');
                } else {
                    row.classList.add('error');
                }
            }
        });

        // Wait for animations to play before showing modal
        setTimeout(() => {
            showResults(result);
        }, 1500); // 1.5s delay to admire the circuit lighting
    }

    function showResults(result) {
        showGameResultModal({
            passed: result.passed,
            title: result.passed ? '¡Sistemas en Línea!' : 'Falla del Sistema',
            xp: result.xpEarned,
            coins: result.coinsEarned,
            score: result.score,
            correct: result.correctCount,
            total: result.totalQ,
            message: result.passed 
                ? (result.alreadyCompleted 
                    ? 'Actividad completada previamente, no otorga recompensas extra.' 
                    : `Has ensamblado correctamente ${result.correctCount} de ${result.totalQ} circuitos.`)
                : `Cortocircuito. Solo ${result.correctCount} de ${result.totalQ} correctos. Necesitas un 60%.`
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
        if (typeof triggerMascota === 'function') triggerMascota('exito', '¡Circuitos activados! ⚡');
    } else {
        if (typeof triggerMascota === 'function') triggerMascota('error', 'Cortocircuito detectado 🛠️');
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
