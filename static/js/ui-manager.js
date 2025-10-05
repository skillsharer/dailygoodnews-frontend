/**
 * Common UI Components & Utilities
 * Centralized JavaScript for consistent UX across all pages
 */

class UIManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupLoader();
        this.setupNavigation();
        this.setupAccessibility();
        this.setupAnimations();
    }

    // FOUC Prevention & Loader Management
    setupLoader() {
        document.addEventListener("DOMContentLoaded", () => {
            // Hide loader with smooth transition
            const loader = document.getElementById('loader');
            if (loader) {
                setTimeout(() => {
                    loader.style.opacity = '0';
                    loader.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        loader.style.display = 'none';
                    }, 300);
                }, 100);
            }

            // Show body content with fade-in
            document.body.style.opacity = '1';
            
            // Add loaded class for CSS animations
            document.body.classList.add('page-loaded');
        });
    }

    // Mobile Navigation & Menu Toggle
    setupNavigation() {
        const menuToggle = document.querySelector('.menu-toggle');
        const nav = document.querySelector('.main-nav');
        
        if (menuToggle && nav) {
            // Enhanced mobile menu with proper ARIA
            menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
            menuToggle.setAttribute('aria-expanded', 'false');

            menuToggle.addEventListener('click', () => {
                const isActive = nav.classList.contains('active');
                
                menuToggle.classList.toggle('active');
                nav.classList.toggle('active');
                
                // Update ARIA states
                menuToggle.setAttribute('aria-expanded', !isActive);
                
                // Prevent body scroll when menu is open
                document.body.style.overflow = isActive ? 'auto' : 'hidden';
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
                    nav.classList.remove('active');
                    menuToggle.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = 'auto';
                }
            });

            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && nav.classList.contains('active')) {
                    nav.classList.remove('active');
                    menuToggle.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = 'auto';
                }
            });

            // Close menu when window resizes to desktop
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    nav.classList.remove('active');
                    menuToggle.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = 'auto';
                }
            });
        }
    }

    // Accessibility Enhancements
    setupAccessibility() {
        // Add focus indicators for keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Enhanced card accessibility
        const cards = document.querySelectorAll('[class*="-card"]');
        cards.forEach(card => {
            const link = card.querySelector('a');
            if (link) {
                // Make entire card focusable and clickable
                card.setAttribute('tabindex', '0');
                card.setAttribute('role', 'article');
                
                // Handle keyboard activation
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        link.click();
                    }
                });

                // Touch-friendly hover states
                card.addEventListener('touchstart', () => {
                    card.classList.add('touch-active');
                }, { passive: true });

                card.addEventListener('touchend', () => {
                    setTimeout(() => {
                        card.classList.remove('touch-active');
                    }, 150);
                }, { passive: true });
            }
        });

        // Skip to content link
        this.addSkipLink();
    }

    // Performance & Animation Optimizations
    setupAnimations() {
        // Respect user's motion preferences
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            document.body.classList.add('reduced-motion');
        }

        // Intersection Observer for scroll-triggered animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, observerOptions);

        // Observe cards and sections for scroll animations
        const animatedElements = document.querySelectorAll('[class*="-card"], .section-title');
        animatedElements.forEach(el => observer.observe(el));
    }

    // Add skip to content link for accessibility
    addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.setAttribute('aria-label', 'Skip to main content');
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // Utility: Smooth scroll with proper offset for fixed header
    static smoothScrollTo(target) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const headerHeight = document.querySelector('.site-header')?.offsetHeight || 80;
        const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetTop = elementTop - headerHeight - 20; // Extra 20px spacing

        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }

    // Utility: Toast notifications for user feedback
    static showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <span class="toast__message">${message}</span>
            <button class="toast__close" aria-label="Close notification">&times;</button>
        `;

        document.body.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('toast--removing');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);

        // Close on click
        toast.querySelector('.toast__close').addEventListener('click', () => {
            toast.classList.add('toast--removing');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        });
    }
}

// Enhanced Smooth Scroll for CTA buttons
document.addEventListener('DOMContentLoaded', () => {
    const ctaButtons = document.querySelectorAll('.cta-button, [href^="#"]');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const target = button.getAttribute('href');
            if (target && target.startsWith('#')) {
                e.preventDefault();
                UIManager.smoothScrollTo(target);
            }
        });
    });
});

// Initialize UI Manager
document.addEventListener('DOMContentLoaded', () => {
    new UIManager();
});

// Export for external use
window.UIManager = UIManager;