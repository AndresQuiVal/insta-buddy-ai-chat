// Function to show a specific slide
function showSlide(slideNumber) {
    // Hide all slides first
    document.querySelectorAll('.carousel__slide').forEach(slide => {
        slide.classList.remove('active');
        slide.style.opacity = '0';
        slide.style.transform = 'translateX(100%)';
        slide.style.pointerEvents = 'none';
        slide.style.zIndex = '0';
    });

    // Show the target slide
    const targetSlide = document.getElementById(`carousel__slide${slideNumber}`);
    if (targetSlide) {
        targetSlide.classList.add('active');
        targetSlide.style.opacity = '1';
        targetSlide.style.transform = 'translateX(0)';
        targetSlide.style.pointerEvents = 'auto';
        targetSlide.style.zIndex = '1';
    }
}

// Initial setup - show slide 3 first
document.addEventListener('DOMContentLoaded', () => {
    showSlide(3);

    // Click handlers for slide 3 (Selección inicial)
    document.getElementById('prospectByPost')?.addEventListener('click', () => {
        showSlide(4); // Va al slide del post
    });

    document.getElementById('prospectByAccount')?.addEventListener('click', () => {
        showSlide(4); // Va al slide de la cuenta
    });

    // Click handlers for slide 4 (Post URL input)
    document.getElementById('emailPreparedPost')?.addEventListener('input', function() {
        const sendButton = document.getElementById('sendInstagramMessagePost');
        if (sendButton) {
            sendButton.disabled = !this.value;
        }
    });

    document.getElementById('sendInstagramMessagePost')?.addEventListener('click', () => {
        showSlide(5); // Va al slide de mensaje
    });

    // Click handlers for slide 5 (Message input)
    document.getElementById('sendInstagramMessage4')?.addEventListener('click', () => {
        showSlide(6); // Va al slide de género
    });

    // Click handlers for slide 6 (Gender selection)
    document.getElementById('closeButtonConf')?.addEventListener('click', () => {
        showSlide(8); // Va al slide de configuración adicional
    });

    // Click handlers for slide 7 (Additional settings)
    document.getElementById('sendInstagramMessage')?.addEventListener('click', () => {
        showSlide(7); // Va al slide final
    });

    // Back button handlers
    document.getElementById('cancelInstagramMessagePost')?.addEventListener('click', () => {
        showSlide(3); // Vuelve a la selección inicial
    });

    document.getElementById('cancelInstagramMessage4')?.addEventListener('click', () => {
        showSlide(4); // Vuelve al input de post
    });

    document.getElementById('cancelInstagramMessage5')?.addEventListener('click', () => {
        showSlide(5); // Vuelve al input de mensaje
    });

    document.getElementById('cancelInstagramMessageConf')?.addEventListener('click', () => {
        showSlide(6); // Vuelve a la selección de género
    });

    document.getElementById('cancelInstagramMessage6')?.addEventListener('click', () => {
        showSlide(7); // Vuelve a la configuración adicional
    });

    // Handlers for confirmation buttons
    document.getElementById('sendInstagramMessage2')?.addEventListener('click', () => {
        showSlide(5); // Va al slide de mensaje
    });

    document.getElementById('sendInstagramMessage3')?.addEventListener('click', () => {
        showSlide(5); // Va al slide de mensaje
    });

    // Handler for final confirmation
    document.getElementById('closeButtonConf')?.addEventListener('click', () => {
        showSlide(7); // Va al slide final
    });
}); 