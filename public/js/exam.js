document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('examForm');
    const submitBtn = document.getElementById('submitExamBtn');
    const timerDisplay = document.getElementById('exam-timer');
    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('exam-progress');
    const resultModal = document.getElementById('resultModal');
    const finalScore = document.getElementById('finalScore');
    
    const totalQuestions = document.querySelectorAll('.question-card, .cloze-inline-select').length;
    let answeredCount = 0;
    
    // Timer: 45 minutes
    let timeRemaining = 45 * 60;
    const startTime = Date.now();

    const timerInterval = setInterval(() => {
        timeRemaining--;
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            timerDisplay.textContent = "00:00";
            alert('¡Tiempo agotado! El examen se enviará automáticamente.');
            submitExam();
        } else {
            const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
            const s = (timeRemaining % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `${m}:${s}`;
        }
    }, 1000);

    // Track progress
    form.addEventListener('change', (e) => {
        let elementToMark = null;

        if (e.target.type === 'radio') {
            elementToMark = e.target.closest('.question-card');
        } else if (e.target.tagName.toLowerCase() === 'select') {
            elementToMark = e.target;
        }

        if (elementToMark && !elementToMark.classList.contains('answered')) {
            elementToMark.classList.add('answered');
            answeredCount++;
            progressText.textContent = `${answeredCount} / ${totalQuestions} Respondidas`;
            progressBar.style.width = `${(answeredCount / totalQuestions) * 100}%`;
            
            if (answeredCount === totalQuestions) {
                submitBtn.disabled = false;
            }
        }
    });

    submitBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres finalizar y enviar tus respuestas?')) {
            submitExam();
        }
    });

    async function submitExam() {
        clearInterval(timerInterval);
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        const formData = new FormData(form);
        const answers = {};
        for (let [key, value] of formData.entries()) {
            const qId = key.split('_')[1];
            answers[qId] = value;
        }

        const timeSpent = Math.round((Date.now() - startTime) / 1000);

        try {
            const res = await fetch('/exam/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers, timeSpent })
            });
            
            const data = await res.json();
            
            if (data.success) {
                finalScore.textContent = `${data.totalScore}%`;
                resultModal.classList.add('active');
            } else {
                alert(data.error || 'Hubo un error al enviar el examen.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Finalizar Examen';
            }
        } catch (err) {
            console.error('Submit Error:', err);
            alert('Error de red. Inténtalo de nuevo.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Finalizar Examen';
        }
    }
});
