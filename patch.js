const fs = require('fs');

function replaceTimeout(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Pattern for boss-battle.js
    const bossPattern = /setTimeout\(\(\) => \{\s*if \(battleEnded\) return;\s*if \(explanationBox\) explanationBox\.style\.display = 'none';\s*if \(playerHpValue <= 0 \|\| currentQuestionIndex >= TOTAL_QUESTIONS - 1\) \{\s*finishBattle\(\);\s*\} else \{\s*currentQuestionIndex\+\+;\s*loadQuestion\(\);\s*\}\s*\}, 3000\);/g;
    
    if (bossPattern.test(content)) {
        content = content.replace(bossPattern, 
            'let nextBtn = document.getElementById(\'nextQuestionBtn\');' +
            'if (!nextBtn) {' +
                'nextBtn = document.createElement(\'button\');' +
                'nextBtn.id = \'nextQuestionBtn\';' +
                'nextBtn.className = \'btn-submit\';' +
                'nextBtn.style.marginTop = \'1rem\';' +
                'nextBtn.style.background = \'#0ea5e9\';' +
                'nextBtn.style.color = \'white\';' +
                'nextBtn.style.border = \'none\';' +
                'nextBtn.style.padding = \'0.75rem 1.5rem\';' +
                'nextBtn.style.borderRadius = \'8px\';' +
                'nextBtn.style.cursor = \'pointer\';' +
                'nextBtn.textContent = \'Siguiente ➔\';' +
                'const expBox = document.getElementById(\'explanationBox\');' +
                'if (expBox) expBox.appendChild(nextBtn);' +
            '}' +
            'nextBtn.onclick = () => {' +
                'if (battleEnded) return;' +
                'const expBox = document.getElementById(\'explanationBox\');' +
                'if (expBox) expBox.style.display = \'none\';' +
                'if (playerHpValue <= 0 || currentQuestionIndex >= TOTAL_QUESTIONS - 1) {' +
                    'finishBattle();' +
                '} else {' +
                    'currentQuestionIndex++;' +
                    'loadQuestion();' +
                '}' +
            '};');
        console.log('Patched boss pattern in', file);
    }

    // Pattern for reading.js and pragmatics.js
    const stdPattern = /setTimeout\(\(\) => \{\s*currentIndex\+\+;\s*if \(currentIndex >= totalQuestions\) \{\s*submitResults\(\);\s*\} else \{\s*renderQuestion\(\);\s*\}\s*\}, 3000\);/g;
    
    if (stdPattern.test(content)) {
        content = content.replace(stdPattern, 
            'let nextBtn = document.getElementById(\'nextQuestionBtn\');' +
            'if (!nextBtn) {' +
                'nextBtn = document.createElement(\'button\');' +
                'nextBtn.id = \'nextQuestionBtn\';' +
                'nextBtn.className = \'btn-primary\';' +
                'nextBtn.style.marginTop = \'1rem\';' +
                'nextBtn.style.display = \'block\';' +
                'nextBtn.textContent = \'Siguiente ➔\';' +
                'const expBox = document.getElementById(\'explanationBox\');' +
                'if (expBox) expBox.appendChild(nextBtn);' +
            '}' +
            'nextBtn.onclick = () => {' +
                'const expBox = document.getElementById(\'explanationBox\');' +
                'if (expBox) expBox.style.display = \'none\';' +
                'currentIndex++;' +
                'if (currentIndex >= totalQuestions) {' +
                    'submitResults();' +
                '} else {' +
                    'renderQuestion();' +
                '}' +
            '};');
        console.log('Patched standard pattern in', file);
    }
    
    fs.writeFileSync(file, content);
}

['public/js/boss-battle.js', 'public/js/reading.js', 'public/js/pragmatics.js'].forEach(replaceTimeout);

