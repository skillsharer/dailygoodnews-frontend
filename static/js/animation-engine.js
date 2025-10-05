/**
 * Minimal Animation Engine - Subtle and Non-Intrusive
 * Only essential animations that enhance UX without being overwhelming
 */

class AnimationEngine {
    constructor() {
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.animatedElements = new WeakSet();
        this.init();
    }

    init() {
        if (this.isReducedMotion) return;
        
        this.setupSubtleScrollAnimations();
        this.setupBasicHoverEffects();
    }

    // Only animate section titles with a very subtle fade-in
    setupSubtleScrollAnimations() {
        const observerOptions = {
            threshold: 0.3,
            rootMargin: '0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
                    // Very subtle fade-in
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    this.animatedElements.add(entry.target);
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, observerOptions);

        // Only animate section titles
        const titles = document.querySelectorAll('.section-title');
        titles.forEach(title => {
            title.style.opacity = '0';
            title.style.transform = 'translateY(15px)';
            title.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(title);
        });
    }

    // Very subtle hover effects for cards only
    setupBasicHoverEffects() {
        const cards = document.querySelectorAll('.card, [class*="-card"]');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (this.isReducedMotion) return;
                // Very subtle lift effect
                card.style.transform = 'translateY(-2px)';
                card.style.transition = 'transform 0.2s ease';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.animationEngine = new AnimationEngine();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationEngine;
}