/**
 * Enhanced UI Manager - Mobile-first, accessible, professional interactions
 * Centralized management for consistent UX across all devices
 */

class EnhancedUIManager {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.init();
    }

    init() {
        this.setupMobileNavigation();
        this.setupAccessibility();
        this.setupPerformanceOptimizations();
        this.setupResponsiveHandling();
        this.setupTouchInteractions();
    }

    // Enhanced mobile navigation with better UX
    setupMobileNavigation() {
        const menuToggle = document.querySelector('.menu-toggle');
        const nav = document.querySelector('.main-nav');
        const navLinks = document.querySelectorAll('.nav-button');
        
        if (!menuToggle || !nav) return;

        // Improved toggle with smooth animations
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMobileMenu(menuToggle, nav);
        });

        // Close menu when clicking nav links (mobile)
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (this.isMobile && nav.classList.contains('active')) {
                    this.toggleMobileMenu(menuToggle, nav);
                }
            });
        });

        // Close menu when clicking outside (mobile)
        document.addEventListener('click', (e) => {
            if (this.isMobile && 
                nav.classList.contains('active') && 
                !nav.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                this.toggleMobileMenu(menuToggle, nav);
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('active')) {
                this.toggleMobileMenu(menuToggle, nav);
                menuToggle.focus();
            }
        });
    }

    toggleMobileMenu(toggle, nav) {
        const isActive = nav.classList.contains('active');
        
        // Toggle classes with animation timing
        toggle.classList.toggle('active');
        nav.classList.toggle('active');
        
        // Accessibility updates
        toggle.setAttribute('aria-expanded', !isActive);
        nav.setAttribute('aria-hidden', isActive);
        
        // Prevent body scroll when menu is open (mobile)
        if (this.isMobile) {
            document.body.style.overflow = isActive ? '' : 'hidden';
        }

        // Focus management
        if (!isActive) {
            // Menu opened - focus first nav item
            const firstNavItem = nav.querySelector('.nav-button');
            if (firstNavItem) {
                setTimeout(() => firstNavItem.focus(), 300);
            }
        } else {
            // Menu closed - return focus to toggle
            toggle.focus();
            document.body.style.overflow = '';
        }
    }

    // Enhanced accessibility features
    setupAccessibility() {
        // Add skip links for keyboard navigation
        this.addSkipLinks();
        
        // Enhanced focus management
        this.setupFocusManagement();
        
        // Keyboard navigation improvements
        this.setupKeyboardNavigation();

        // Screen reader enhancements
        this.setupScreenReaderSupport();
    }

    addSkipLinks() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        
        // Skip link styles
        Object.assign(skipLink.style, {
            position: 'absolute',
            top: '-40px',
            left: '6px',
            background: '#000',
            color: '#fff',
            padding: '8px',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: '10001',
            transition: 'top 0.3s'
        });

        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });

        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });

        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    setupFocusManagement() {
        // Enhanced focus indicators
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Focus trap for modals/menus
        this.setupFocusTrapping();
    }

    setupFocusTrapping() {
        const nav = document.querySelector('.main-nav');
        if (!nav) return;

        nav.addEventListener('keydown', (e) => {
            if (!nav.classList.contains('active') || e.key !== 'Tab') return;

            const focusableElements = nav.querySelectorAll('.nav-button');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        });
    }

    setupKeyboardNavigation() {
        // Arrow key navigation for menu items
        const navButtons = document.querySelectorAll('.nav-button');
        
        navButtons.forEach((button, index) => {
            button.addEventListener('keydown', (e) => {
                let targetIndex;
                
                switch (e.key) {
                    case 'ArrowDown':
                    case 'ArrowRight':
                        e.preventDefault();
                        targetIndex = (index + 1) % navButtons.length;
                        break;
                    case 'ArrowUp':
                    case 'ArrowLeft':
                        e.preventDefault();
                        targetIndex = (index - 1 + navButtons.length) % navButtons.length;
                        break;
                    case 'Home':
                        e.preventDefault();
                        targetIndex = 0;
                        break;
                    case 'End':
                        e.preventDefault();
                        targetIndex = navButtons.length - 1;
                        break;
                }
                
                if (targetIndex !== undefined) {
                    navButtons[targetIndex].focus();
                }
            });
        });
    }

    setupScreenReaderSupport() {
        // Add proper ARIA labels and live regions
        const main = document.querySelector('main') || document.querySelector('#main-content');
        if (main && !main.getAttribute('aria-label')) {
            main.setAttribute('aria-label', 'Main content');
        }

        // Live region for dynamic content updates
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);
    }

    // Performance optimizations
    setupPerformanceOptimizations() {
        // Intersection Observer for lazy animations
        this.setupIntersectionObserver();
        
        // Debounced resize handling
        this.setupResizeHandling();
        
        // Optimized scroll handling
        this.setupScrollOptimizations();
    }

    setupIntersectionObserver() {
        if (!window.IntersectionObserver || this.reducedMotion) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    // Animate cards with staggered timing
                    const delay = Array.from(entry.target.parentNode.children).indexOf(entry.target) * 100;
                    setTimeout(() => {
                        entry.target.classList.add('animate-in');
                    }, delay);
                }
            });
        }, { 
            threshold: 0.1,
            rootMargin: '50px 0px'
        });

        // Observe cards and sections
        const observableElements = document.querySelectorAll('.news-card, .articles-card, .knowledge-card, .storytime-card, .section-title');
        observableElements.forEach(el => observer.observe(el));
    }

    setupResizeHandling() {
        let resizeTimer;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.isMobile = window.innerWidth <= 768;
                this.handleResponsiveChanges();
            }, 150);
        });
    }

    handleResponsiveChanges() {
        const nav = document.querySelector('.main-nav');
        const menuToggle = document.querySelector('.menu-toggle');
        
        // Reset mobile menu state on desktop
        if (!this.isMobile && nav && nav.classList.contains('active')) {
            nav.classList.remove('active');
            menuToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    setupScrollOptimizations() {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    handleScroll() {
        // Optimized scroll effects can be added here
        // Currently handled by PageManager for header effects
    }

    // Enhanced touch interactions for mobile
    setupTouchInteractions() {
        if (!this.isMobile) return;

        // Improved touch feedback for buttons and cards
        const interactiveElements = document.querySelectorAll('.cta-button, .nav-button, .news-card, .articles-card, .knowledge-card, .storytime-card');
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', (e) => {
                if (!this.reducedMotion) {
                    element.style.transform = element.matches('.cta-button, .nav-button') ? 'scale(0.98)' : 'scale(0.99)';
                    element.style.transition = 'transform 0.1s ease';
                }
            }, { passive: true });

            element.addEventListener('touchend', () => {
                if (!this.reducedMotion) {
                    element.style.transform = '';
                }
            }, { passive: true });

            element.addEventListener('touchcancel', () => {
                if (!this.reducedMotion) {
                    element.style.transform = '';
                }
            }, { passive: true });
        });
    }

    setupResponsiveHandling() {
        // Responsive image loading optimization
        // Exclude Coffee Break images from lazy loading to ensure immediate loading
        const images = document.querySelectorAll('img[data-src]:not(.articles-card-image)');
        if (images.length > 0) {
            this.setupLazyLoading(images);
        }

        // Responsive typography adjustments
        this.adjustResponsiveTypography();
    }

    setupLazyLoading(images) {
        if (!window.IntersectionObserver) {
            // Fallback for older browsers
            images.forEach(img => {
                img.src = img.dataset.src;
            });
            return;
        }

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        }, { rootMargin: '100px 0px' });

        images.forEach(img => imageObserver.observe(img));
    }

    adjustResponsiveTypography() {
        // Dynamic font size adjustments based on viewport
        const root = document.documentElement;
        const updateFontSizes = () => {
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            
            if (vw < 480) {
                root.style.setProperty('--font-scale', '0.9');
            } else if (vw < 768) {
                root.style.setProperty('--font-scale', '0.95');
            } else {
                root.style.setProperty('--font-scale', '1');
            }
        };

        updateFontSizes();
        window.addEventListener('resize', updateFontSizes);
    }

    // Utility method to announce changes to screen readers
    static announceToScreenReader(message) {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }
}

// Initialize Enhanced UI Manager
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedUIManager();
});

// Export for external use
window.EnhancedUIManager = EnhancedUIManager;