/* public/js/grammar.js */
document.addEventListener('DOMContentLoaded', () => {
    const questionsDataElement = document.getElementById('questionsData');
    if (!questionsDataElement) return;

    const questionsData = JSON.parse(questionsDataElement.textContent);
    if (!questionsData || questionsData.length === 0) return;

    const clozeContainer = document.getElementById('clozeContainer');
    const submitBtn = document.getElementById('submitBtn');
    const startTime = Date.now();

    let attempts = 0;

    // Render passage with inline selects
    function renderCloze() {
        let html = '';
        if (passageTitle) {
            html += `<h2 style="margin-bottom: 1rem; color: var(--accent-blue); text-align: center;">${passageTitle}</h2>`;
        }

        let formattedPassage = passageText.replace(/\n/g, '<br>');

        // Replace blanks like (106) ________ with inline selects
        let qIndex = 0;
        formattedPassage = formattedPassage.replace(/\(\d+\)\s*_*/g, (match) => {
            const q = questionsData[qIndex];
            if (!q) return match; // fallback if more blanks than questions
            
            let selectHtml = `<select class="cloze-inline-select" data-qid="${q.QuestionID}" id="select-${q.QuestionID}">`;
            selectHtml += `<option value="" disabled selected>---</option>`;
            q.Options.forEach(opt => {
                selectHtml += `<option value="${opt.OptionID}">${opt.OptionText}</option>`;
            });
            selectHtml += `</select>`;
            
            qIndex++;
            return selectHtml;
        });

        html += `<div class="cloze-passage-content" style="font-size: 1.2rem; line-height: 2; padding: 2rem; background: var(--bg-card); border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); color: var(--text-primary);">
            ${formattedPassage}
        </div>`;

        clozeContainer.innerHTML = html;
        submitBtn.style.display = 'inline-block';
    }

    renderCloze();

    submitBtn.addEventListener('click', async () => {
        const selects = document.querySelectorAll('.cloze-inline-select');
        const answers = {};
        let allAnswered = true;

        selects.forEach(select => {
            select.classList.remove('error-highlight');
            if (!select.value) {
                allAnswered = false;
                select.classList.add('error-highlight');
            } else {
                answers[select.dataset.qid] = select.value;
            }
        });

        if (!allAnswered) {
            if (typeof triggerMascota === 'function') triggerMascota('info', 'Por favor, completa todos los espacios en blanco.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Verificando...';
        attempts++;

        const timeSpent = Math.round((Date.now() - startTime) / 1000);

        try {
            const res = await fetch('/game/grammar/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activityId,
                    answers: answers,
                    timeSpent: timeSpent
                })
            });
            const data = await res.json();
            
            // Highlight correct/incorrect selects based on results
            if (data.results) {
                data.results.forEach(r => {
                    const select = document.getElementById(`select-${r.questionId}`);
                    if (select) {
                        select.disabled = true;
                        if (r.isCorrect) {
                            select.style.borderBottom = '3px solid var(--success-color)';
                            select.style.color = 'var(--success-color)';
                        } else {
                            select.style.borderBottom = '3px solid var(--error-color)';
                            select.style.color = 'var(--error-color)';
                        }
                    }
                });
            }

            if (data.passed) {
                showGameResultModal({
                    passed: true,
                    title: '🎉 ¡Excelente Trabajo!',
                    xp: data.xpEarned || 0,
                    coins: data.coinsEarned || 0,
                    score: data.score,
                    correct: data.correctCount,
                    total: data.totalQ,
                    message: data.alreadyCompleted ? '¡Actividad completada previamente!' : '¡Has superado esta actividad!'
                });
            } else {
                if (attempts >= 2) {
                    showGameResultModal({
                        passed: false,
                        title: '😢 ¡Intento Fallido!',
                        xp: 0,
                        coins: 0,
                        score: data.score,
                        correct: data.correctCount,
                        total: data.totalQ,
                        message: 'Has agotado tus 2 intentos. ¡Vuelve al mapa y estudia un poco más para la próxima!'
                    });
                } else {
                    // If failed, they must repeat.
                    if (typeof triggerMascota === 'function') triggerMascota('error', 'Cortocircuito detectado 🛠️. Tienes 1 intento más.');
                    setTimeout(() => {
                        // Reset only incorrect selects so they can try again
                        selects.forEach(select => {
                            const qId = select.dataset.qid;
                            const result = data.results && data.results.find(r => r.questionId == qId);
                            
                            if (result && result.isCorrect) {
                                // Keep correct ones disabled and green
                                select.disabled = true;
                                select.style.borderBottom = '3px solid var(--success-color)';
                                select.style.color = 'var(--success-color)';
                            } else {
                                // Clear incorrect ones
                                select.disabled = false;
                                select.value = '';
                                select.style.borderBottom = '2px solid var(--accent-blue)';
                                select.style.color = 'var(--text-primary)';
                            }
                        });
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Verificar Respuestas';
                    }, 3000);
                }
            }

        } catch (err) {
            console.error('Submit error:', err);
            alert('Error enviando los resultados.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verificar Respuestas';
        }
    });
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
        if (typeof triggerMascota === 'function') triggerMascota('error', '¡No te rindas! Sigue practicando.');
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
