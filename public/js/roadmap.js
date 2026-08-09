/**
 * public/js/roadmap.js
 * Lógica del Mapa de Progreso de 12 Semanas
 */
document.addEventListener('DOMContentLoaded', () => {
    // Animate path progress based on completed weeks
    const pathProgress = document.getElementById('pathProgress');
    const weekNodes = document.querySelectorAll('.week-node');
    const totalWeeks = weekNodes.length;
    let completedWeeks = 0;
    
    weekNodes.forEach(node => {
        if (node.classList.contains('completed')) completedWeeks++;
    });
    
    // Animate progress line
    if (pathProgress && totalWeeks > 0) {
        const progressPercent = (completedWeeks / totalWeeks) * 100;
        setTimeout(() => {
            pathProgress.style.height = progressPercent + '%';
        }, 500);
    }
    
    // Animate stat values with count-up
    document.querySelectorAll('.stat-value').forEach(el => {
        const target = parseInt(el.textContent) || 0;
        if (target === 0) return;
        let current = 0;
        const increment = Math.ceil(target / 30);
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) { current = target; clearInterval(timer); }
            el.textContent = current;
        }, 30);
    });
    
    // Week node click handlers
    weekNodes.forEach(node => {
        node.addEventListener('click', () => {
            if (node.classList.contains('locked')) {
                // Show locked message
                const circle = node.querySelector('.node-circle');
                circle.style.animation = 'shake 0.4s ease-in-out';
                setTimeout(() => circle.style.animation = '', 400);
                return;
            }
            // Navigate to activity link if available
            const link = node.querySelector('a');
            if (link) window.location.href = link.getAttribute('href');
        });
    });
    
    // Entrance animations for nodes
    weekNodes.forEach((node, i) => {
        node.style.opacity = '0';
        node.style.transform = 'translateY(30px)';
        setTimeout(() => {
            node.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            node.style.opacity = '1';
            node.style.transform = 'translateY(0)';
        }, 150 * i);
    });
});
