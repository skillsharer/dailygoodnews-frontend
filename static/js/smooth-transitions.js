/**
 * Smooth Transitions & Animations
 * Professional, eye-catching, and seamless interactions
 */

class SmoothTransitions {
    constructor() {
        this.isAnimating = false;
        this.scrollThreshold = 100;
        this.init();
    }

    init() {
        this.setupHeroTransition();
        this.setupSmoothScrolling();
        this.setupMicroInteractions();
        this.setupScrollAnimations();
        this.setupHeaderScroll();
    }

    // Dynamic header on scroll
    setupHeaderScroll() {
        const header = document.querySelector('.site-header');
        if (!header) return;

        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > this.scrollThreshold) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        }, { passive: true });
    }

    // Scroll-based card animations
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const animateOnScroll = (entries, observer) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        };

        const observer = new IntersectionObserver(animateOnScroll, observerOptions);

        // Observe cards
        const cards = document.querySelectorAll('.card, .news-card, .article-card, .story-card, .knowledge-card');
        cards.forEach((card, index) => {
            if (index > 0) { // Skip first card
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                observer.observe(card);
            }
        });
    }

    // Enhanced Hero Section Transition for Home Page
    setupHeroTransition() {
        const exploreButton = document.getElementById("explore-now");
        const heroSection = document.getElementById('hero-section');
        const targetSection = document.getElementById("main-content");
        const footer = document.querySelector('footer');

        if (!exploreButton || !heroSection || !targetSection) return;

        exploreButton.addEventListener("click", (e) => {
            e.preventDefault();
            
            if (this.isAnimating) return;
            this.isAnimating = true;

            // Mark as visited for session
            sessionStorage.setItem('hasVisitedSession', 'true');

            // Improved smooth transition
            this.executeHeroTransition(heroSection, targetSection, footer);
        });
    }

    async executeHeroTransition(heroSection, targetSection, footer) {
        // Phase 1: Start hero fade (300ms)
        heroSection.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
        heroSection.style.opacity = '0';
        heroSection.style.transform = 'translateY(-40px) scale(0.96)';
        
        // Phase 2: Content already visible - no animation needed
        // Removed visible class addition to prevent sliding
        
        // Phase 3: Hide hero from layout after fade starts (300ms)
        await this.delay(300);
        heroSection.classList.add("hidden");
        
        // Ensure footer maintains styling
        if (footer) {
            footer.style.background = 'linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #4a5568 100%)';
            footer.style.color = 'rgba(255, 255, 255, 0.95)';
        }
        
        // Phase 4: Calculate scroll after layout stabilizes (50ms)
        await this.delay(50);
        
        const firstNewsCard = document.querySelector('.news-card:first-child');
        const sectionTitle = document.querySelector('.section-title');
        
                        if (firstNewsCard && sectionTitle) {
                            const titleRect = sectionTitle.getBoundingClientRect();
                            const scrollTarget = window.pageYOffset + titleRect.top - 140; // Account for header height            // Smooth scroll to content
            this.smoothScrollTo(scrollTarget, 1200);
            
            // Phase 5: Highlight first card after scroll
            await this.delay(800);
            this.highlightCard(firstNewsCard);
        }
        
        this.isAnimating = false;
    }

    // Professional smooth scrolling
    smoothScrollTo(targetY, duration = 1000) {
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        let startTime = null;

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            
            // Smooth easing function
            const easeProgress = this.easeOutCubic(progress);
            const currentY = startY + (distance * easeProgress);
            
            window.scrollTo(0, currentY);
            
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    }

    // Card highlight with calm animation
    highlightCard(card) {
        card.style.transform = 'translateY(-6px) scale(1.02)';
        card.style.boxShadow = '0 16px 48px rgba(129, 199, 212, 0.3)';
        card.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        // Remove highlight gracefully
        setTimeout(() => {
            card.style.transform = '';
            card.style.boxShadow = '';
            card.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }, 3500);
    }

    // Setup smooth scrolling for all CTA links
    setupSmoothScrolling() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;
            
            e.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            const target = document.getElementById(targetId);
            
            if (target) {
                const targetY = target.offsetTop - 80;
                this.smoothScrollTo(targetY, 800);
            }
        });
    }

    // Subtle micro-interactions for better UX
    setupMicroInteractions() {
        // Card hover effects are handled by CSS - no JS duplication needed
        // This provides better performance and smoother animations
        
        // Button press feedback
        document.addEventListener('mousedown', (e) => {
            const button = e.target.closest('.cta-button, .nav-button, .subscribe-button, .go-back-btn');
            if (button) {
                button.style.transform = 'scale(0.98)';
                button.style.transition = 'transform 0.1s ease';
            }
        });

        document.addEventListener('mouseup', (e) => {
            const button = e.target.closest('.cta-button, .nav-button, .subscribe-button, .go-back-btn');
            if (button) {
                button.style.transform = '';
            }
        });
    }

    // Utility functions
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize smooth transitions
document.addEventListener('DOMContentLoaded', () => {
    new SmoothTransitions();
});

// Export for external use
window.SmoothTransitions = SmoothTransitions;