document.addEventListener('DOMContentLoaded', () => {
    const questionsDataElement = document.getElementById('questionsData');
    if (!questionsDataElement) return;
    
    const questionsData = JSON.parse(questionsDataElement.textContent);
    const battleConfig = document.getElementById('battleConfig');
    const ACTIVITY_ID = battleConfig.dataset.activityId;
    
    let currentQuestionIndex = 0;
    let playerHpValue = 100;
    let bossHpValue = 100;
    let battleEnded = false;
    
    const userAnswers = {};
    const TOTAL_QUESTIONS = questionsData.length || 5;
    const bossDamagePerQuestion = 100 / TOTAL_QUESTIONS;
    
    const questionTextEl = document.getElementById('questionText');
    const answersGridEl = document.getElementById('answersGrid');
    const qCurrentEl = document.getElementById('qCurrent');
    const qTotalEl = document.getElementById('qTotal');
    
    const playerHpBar = document.getElementById('playerHP');
    const bossHpBar = document.getElementById('bossHP');
    const playerHpText = document.getElementById('playerHPText');
    const bossHpText = document.getElementById('bossHPText');
    
    const timerBar = document.getElementById('timerBar');
    const timerNum = document.getElementById('timerNum');
    
    let timerInterval;
    let timeLeft;
    const TIME_LIMIT = 30;
    
    qTotalEl.textContent = TOTAL_QUESTIONS;
    
    function loadQuestion() {
        if (battleEnded) return;
        
        if (currentQuestionIndex >= TOTAL_QUESTIONS) {
            finishBattle();
            return;
        }
        
        const q = questionsData[currentQuestionIndex];
        qCurrentEl.textContent = currentQuestionIndex + 1;
        questionTextEl.textContent = q.Text || q.text || q.QuestionText;
        
        answersGridEl.innerHTML = '';
        
        const options = q.Options || q.options || [];
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.textContent = opt.Text || opt.text || opt.OptionText;
            btn.onclick = () => submitAnswer(opt.OptionID || opt.id);
            answersGridEl.appendChild(btn);
        });
        
        startTimer();
    }
    
    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = TIME_LIMIT;
        timerNum.textContent = timeLeft;
        timerBar.style.width = '100%';
        timerBar.style.transition = 'none';
        
        setTimeout(() => {
            timerBar.style.transition = `width ${TIME_LIMIT}s linear`;
            timerBar.style.width = '0%';
        }, 50);
        
        timerInterval = setInterval(() => {
            timeLeft--;
            timerNum.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                handleTimeOut();
            }
        }, 1000);
    }
    
    async function submitAnswer(optionId) {
        if (battleEnded) return;
        
        clearInterval(timerInterval);
        disableButtons();
        
        try {
            const q = questionsData[currentQuestionIndex];
            const qId = q.QuestionID || q.id;
            
            userAnswers[qId] = optionId;
            
            const res = await fetch('/game/boss/check-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: qId,
                    optionId: optionId
                })
            });
            const data = await res.json();
            
            if (data.isCorrect) {
                bossHpValue -= bossDamagePerQuestion;
                updateHpBars();
                showAvatarAction('player');
                // Mascota: éxito al acertar
                if (typeof triggerMascota === 'function') {
                    triggerMascota('exito', '¡Golpe crítico! 💥');
                }
            } else {
                playerHpValue -= (100 / 5); // 5 failures = death
                updateHpBars();
                showAvatarAction('boss');
                // Mascota: error al fallar
                if (typeof triggerMascota === 'function') {
                    triggerMascota('error', '¡Te han golpeado! 😵');
                }
            }
            
            setTimeout(() => {
                if (battleEnded) return;
                
                if (playerHpValue <= 0 || currentQuestionIndex >= TOTAL_QUESTIONS - 1) {
                    finishBattle();
                } else {
                    currentQuestionIndex++;
                    loadQuestion();
                }
            }, 1000);
            
        } catch (err) {
            console.error('Error submitting answer:', err);
            enableButtons();
        }
    }
    
    function handleTimeOut() {
        if (battleEnded) return;
        
        disableButtons();
        playerHpValue -= (100 / 5);
        updateHpBars();
        showAvatarAction('boss');
        
        // Mascota: error por timeout
        if (typeof triggerMascota === 'function') {
            triggerMascota('error', '¡Se acabó el tiempo! ⏰');
        }
        
        setTimeout(() => {
            if (battleEnded) return;
            
            if (playerHpValue <= 0 || currentQuestionIndex >= TOTAL_QUESTIONS - 1) {
                finishBattle();
            } else {
                currentQuestionIndex++;
                loadQuestion();
            }
        }, 1000);
    }
    
    function updateHpBars() {
        playerHpValue = Math.max(0, playerHpValue);
        bossHpValue = Math.max(0, bossHpValue);
        
        playerHpBar.style.width = playerHpValue + '%';
        bossHpBar.style.width = bossHpValue + '%';
        
        playerHpText.textContent = Math.round(playerHpValue);
        bossHpText.textContent = Math.round(bossHpValue);
    }
    
    function showAvatarAction(who) {
        const avatar = document.querySelector(`.${who}-avatar`);
        if (avatar) {
            avatar.classList.add('attack-anim');
            setTimeout(() => avatar.classList.remove('attack-anim'), 400);
        }
    }
    
    function disableButtons() {
        const btns = document.querySelectorAll('.answer-btn');
        btns.forEach(btn => btn.disabled = true);
    }
    
    function enableButtons() {
        const btns = document.querySelectorAll('.answer-btn');
        btns.forEach(btn => btn.disabled = false);
    }
    
    async function finishBattle() {
        if (battleEnded) return;
        battleEnded = true;
        
        clearInterval(timerInterval);
        disableButtons();
        
        const finalBody = {
            activityId: ACTIVITY_ID,
            answers: userAnswers,
            timeSpent: TOTAL_QUESTIONS * TIME_LIMIT,
            playerHP: playerHpValue,
            bossHP: bossHpValue
        };
        
        try {
            const res = await fetch('/game/boss/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalBody)
            });
            const data = await res.json();
            
            if (data.passed) {
                // Ocultar modals viejos si existen
                const oldVictory = document.getElementById('victoryModal');
                if (oldVictory) oldVictory.style.display = 'none';
                
                showGameResultModal({
                    passed: true,
                    title: '🏆 ¡VICTORIA ÉPICA!',
                    xp: data.xpEarned || 0,
                    coins: data.coinsEarned || 0,
                    score: data.score,
                    correct: data.correctCount,
                    total: TOTAL_QUESTIONS,
                    message: data.alreadyCompleted 
                        ? '¡Jefe derrotado! (Ya completaste este corte antes)'
                        : '¡Has derrotado al Jefe del Corte! 75% o más alcanzado.'
                });
            } else {
                // Ocultar modals viejos
                const oldDefeat = document.getElementById('defeatModal');
                if (oldDefeat) oldDefeat.style.display = 'none';
                
                let reason = '';
                if (playerHpValue <= 0) {
                    reason = 'Perdiste toda tu vida en la batalla contra el jefe.';
                } else {
                    const reqCount = Math.ceil(TOTAL_QUESTIONS * 0.75);
                    reason = `Puntaje: ${data.score}% (${data.correctCount}/${TOTAL_QUESTIONS}). Necesitas al menos el 75% (${reqCount}/${TOTAL_QUESTIONS}) para aprobar.`;
                }
                
                showGameResultModal({
                    passed: false,
                    title: '💀 ¡DERROTA!',
                    xp: 0,
                    coins: 0,
                    score: data.score || 0,
                    correct: data.correctCount || 0,
                    total: TOTAL_QUESTIONS,
                    message: reason
                });
            }
        } catch (err) {
            console.error('Error submitting final boss battle:', err);
            showGameResultModal({
                passed: false,
                title: '💀 Error de Conexión',
                xp: 0, coins: 0, score: 0, correct: 0, total: TOTAL_QUESTIONS,
                message: 'Error al enviar los resultados. Serás redirigido al mapa.'
            });
        }
    }
    
    if (TOTAL_QUESTIONS > 0) {
        loadQuestion();
    }
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
            triggerMascota('exito', '¡Jefe destruido! 🔥');
        }
    } else {
        if (typeof triggerMascota === 'function') {
            triggerMascota('error', 'No te rindas, vuelve más fuerte 💪');
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
