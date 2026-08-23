/* public/js/reading.js */
document.addEventListener('DOMContentLoaded', () => {
    const questionsDataElement = document.getElementById('questionsData');
    if (!questionsDataElement) return;

    const questionsData = JSON.parse(questionsDataElement.textContent);
    let currentIndex = 0;
    let correctCount = 0;
    const answers = {};
    const startTime = Date.now();

    function renderQuestion() {
        if (!questionsData || questionsData.length === 0) return;
        const q = questionsData[currentIndex];
        const area = document.getElementById('questionArea');
        document.getElementById('currentQ').textContent = currentIndex + 1;
        document.getElementById('progressBar').style.width = 
            ((currentIndex / totalQuestions) * 100) + '%';

        let html = '';
        
        html += `
            <h3 class="question-prompt">${q.QuestionText}</h3>
        `;

        html += '<div class="options-list">';
        const shuffledOpts = [...q.Options]; // Don't shuffle
        shuffledOpts.forEach((opt, idx) => {
            html += `
                <button class="option-btn" data-option-id="${opt.OptionID}" data-correct="${opt.IsCorrect}">
                    <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                    <span class="option-text">${opt.OptionText}</span>
                </button>
            `;
        });
        html += '</div>';
        
        // Add Explanation box (hidden by default)
        html += `
            <div class="explanation-box" id="explanationBox" style="display:none">
                <div class="explanation-icon">💡</div>
                <p class="explanation-text">${q.Explanation || 'Explanation will appear here.'}</p>
            </div>
        `;

        area.innerHTML = html;

        // Attach click handlers
        area.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => handleAnswer(btn, q));
        });
    }

    function handleAnswer(btn, question) {
        const allBtns = document.querySelectorAll('.option-btn');
        allBtns.forEach(b => b.disabled = true);

        const isCorrect = btn.dataset.correct === 'true';
        if (isCorrect) {
            btn.classList.add('correct');
            correctCount++;
            if (typeof triggerMascota === 'function') triggerMascota('exito', '¡Correcto! ✅');
        } else {
            btn.classList.add('wrong');
            allBtns.forEach(b => {
                if (b.dataset.correct === 'true') b.classList.add('correct');
            });
            if (typeof triggerMascota === 'function') triggerMascota('error', 'Incorrecto ❌');
        }

        answers[question.QuestionID] = parseInt(btn.dataset.optionId);

        // Show explanation
        const expBox = document.getElementById('explanationBox');
        if (expBox && question.Explanation) {
            expBox.style.display = 'flex';
        }

        let nextBtn = document.getElementById('nextQuestionBtn');if (!nextBtn) {nextBtn = document.createElement('button');nextBtn.id = 'nextQuestionBtn';nextBtn.className = 'btn-primary';nextBtn.style.marginTop = '1rem';nextBtn.style.display = 'block';nextBtn.textContent = 'Siguiente ➔';const expBox = document.getElementById('explanationBox');if (expBox) expBox.appendChild(nextBtn);}nextBtn.onclick = () => {const expBox = document.getElementById('explanationBox');if (expBox) expBox.style.display = 'none';currentIndex++;if (currentIndex >= totalQuestions) {submitResults();} else {renderQuestion();}}; // Wait 3 seconds
    }

    async function submitResults() {
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        
        try {
            const res = await fetch('/game/reading/submit', { // Adjust if endpoint name differs
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activityId,
                    answers: answers, // Adjust depending on what backend expects, it might expect arrangement or answers
                    correctCount: correctCount,
                    timeSpent: timeSpent
                })
            });
            const data = await res.json();
            
            showGameResultModal({
                passed: data.passed !== undefined ? data.passed : (data.success && data.passed),
                title: data.passed ? '🎉 ¡Excelente Trabajo!' : '📚 ¡Sigue practicando!',
                xp: data.xpEarned || 0,
                coins: data.coinsEarned || 0,
                score: data.score || Math.round((correctCount/totalQuestions)*100),
                correct: data.correctCount !== undefined ? data.correctCount : correctCount,
                total: data.totalQuestions || totalQuestions,
                message: data.passed 
                    ? (data.alreadyCompleted ? '¡Actividad completada previamente!' : '¡Has superado esta actividad!') 
                    : 'Necesitas al menos 60% para aprobar.'
            });
        } catch (err) {
            console.error('Submit error:', err);
            alert('Error enviando los resultados.');
        }
    }

    if (totalQuestions > 0) renderQuestion();
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
