/**
 * Adiciona feedback tátil elástico e instantâneo ao clicar 
 * em elementos interativos como botões e links.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Seleciona todos os botões e links navegáveis e externos
    const interactiveElements = document.querySelectorAll(
        '.btn-primary-main, .btn-secondary-main, .nav-links a, .project-links a, .logo'
    );

    interactiveElements.forEach(element => {
        // Evento disparado no momento em que o clique inicia
        element.addEventListener('mousedown', () => {
            element.classList.add('click-active');
        });

        // Evento disparado quando o botão do mouse é solto
        element.addEventListener('mouseup', () => {
            element.classList.remove('click-active');
        });

        // Garante que o efeito saia mesmo se o usuário arrastar o mouse para fora do elemento
        element.addEventListener('mouseleave', () => {
            element.classList.remove('click-active');
        });

        // Suporte total a interações em dispositivos móveis (Touch screens)
        element.addEventListener('touchstart', () => {
            element.classList.add('click-active');
        }, { passive: true });

        element.addEventListener('touchend', () => {
            element.classList.remove('click-active');
        }, { passive: true });
    });
});
