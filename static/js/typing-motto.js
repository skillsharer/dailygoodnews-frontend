document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.hero-subtitle--typing');
    if (!container) return;

    const typedText = container.querySelector('.typed-text');
    const phrase = container.dataset.typingText || typedText?.textContent || '';
    if (!typedText || !phrase) return;

    typedText.textContent = '';

    let charIndex = 0;
    const typeNextCharacter = () => {
        typedText.textContent = phrase.slice(0, charIndex);

        if (charIndex <= phrase.length) {
            charIndex += 1;
            window.setTimeout(typeNextCharacter, 70);
        } else {
            container.classList.add('is-complete');
        }
    };

    window.setTimeout(typeNextCharacter, 450);
});
