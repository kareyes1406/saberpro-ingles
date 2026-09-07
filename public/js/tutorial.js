// public/js/tutorial.js
document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.tutorial-slide');
    const dotsContainer = document.getElementById('tutorialDots');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const finishSection = document.getElementById('finishSection');
    const totalSlides = slides.length;
    let currentSlide = 0;

    // Create dots
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.dataset.index = i;
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }
    const dots = document.querySelectorAll('.dot');

    function updateSlides() {
        slides.forEach((slide, index) => {
            if (index === currentSlide) {
                slide.classList.add('active');
                slide.style.transform = 'translateX(0)';
            } else if (index < currentSlide) {
                slide.classList.remove('active');
                slide.style.transform = 'translateX(-50px)';
            } else {
                slide.classList.remove('active');
                slide.style.transform = 'translateX(50px)';
            }
        });

        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });

        prevBtn.disabled = currentSlide === 0;
        
        if (currentSlide === totalSlides - 1) {
            nextBtn.style.display = 'none';
            finishSection.style.display = 'block';
        } else {
            nextBtn.style.display = 'flex';
            finishSection.style.display = 'none';
        }
    }

    function goToSlide(index) {
        currentSlide = index;
        updateSlides();
    }

    prevBtn.addEventListener('click', () => {
        if (currentSlide > 0) goToSlide(currentSlide - 1);
    });

    nextBtn.addEventListener('click', () => {
        if (currentSlide < totalSlides - 1) goToSlide(currentSlide + 1);
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && currentSlide > 0) goToSlide(currentSlide - 1);
        if (e.key === 'ArrowRight' && currentSlide < totalSlides - 1) goToSlide(currentSlide + 1);
    });

    // Touch support (swipe)
    let touchStartX = 0;
    let touchEndX = 0;
    const carousel = document.getElementById('tutorialCarousel');

    carousel.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    carousel.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});

    function handleSwipe() {
        const threshold = 50;
        if (touchStartX - touchEndX > threshold && currentSlide < totalSlides - 1) {
            goToSlide(currentSlide + 1); // Swipe left, go right
        }
        if (touchEndX - touchStartX > threshold && currentSlide > 0) {
            goToSlide(currentSlide - 1); // Swipe right, go left
        }
    }
});
