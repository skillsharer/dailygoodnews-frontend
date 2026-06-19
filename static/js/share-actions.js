document.addEventListener('DOMContentLoaded', () => {
    const copyButtons = document.querySelectorAll('[data-share-copy]');
    const nativeButtons = document.querySelectorAll('[data-share-native]');

    copyButtons.forEach((button) => {
        button.addEventListener('click', async () => {
            const url = button.dataset.shareUrl || window.location.href;
            const label = button.querySelector('span') || button;
            const originalText = label.textContent;

            try {
                await navigator.clipboard.writeText(url);
                label.textContent = 'Copied';
                button.classList.add('is-copied');
            } catch (error) {
                const fallback = document.createElement('textarea');
                fallback.value = url;
                fallback.setAttribute('readonly', '');
                fallback.style.position = 'fixed';
                fallback.style.opacity = '0';
                document.body.appendChild(fallback);
                fallback.select();
                document.execCommand('copy');
                fallback.remove();
                label.textContent = 'Copied';
                button.classList.add('is-copied');
            }

            window.setTimeout(() => {
                label.textContent = originalText;
                button.classList.remove('is-copied');
            }, 1800);
        });
    });

    nativeButtons.forEach((button) => {
        if (!navigator.share) {
            button.hidden = true;
            return;
        }

        button.addEventListener('click', async () => {
            try {
                await navigator.share({
                    title: button.dataset.shareTitle || document.title,
                    url: button.dataset.shareUrl || window.location.href,
                });
            } catch (error) {
                // User cancellation should not surface as an error.
            }
        });
    });

    document.addEventListener('click', (event) => {
        document.querySelectorAll('.social-share[open]').forEach((menu) => {
            if (!menu.contains(event.target)) {
                menu.removeAttribute('open');
            }
        });
    });
});
