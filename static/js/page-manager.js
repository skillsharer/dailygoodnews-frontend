/**
 * Page Manager - Handles FOUC prevention, loading states, and page initialization
 * Professional UX with consistent loading behavior across all pages
 */

class PageManager {
    constructor() {
        this.isPageLoaded = false;
        this.init();
    }

    init() {
        this.preventFOUC();
        this.setupLoader();
        this.setupPageTransitions();
        this.handleSessionNavigation();
    }

    // Prevent Flash of Unstyled Content (FOUC)
    preventFOUC() {
        // Set body opacity immediately to prevent flash
        document.body.style.opacity = '1';
        document.body.classList.add('page-loaded');
        
        // Mark page as loaded for CSS transitions
        requestAnimationFrame(() => {
            document.documentElement.classList.add('loaded');
        });
    }

    // Enhanced loader management
    setupLoader() {
        const loader = document.getElementById('loader');
        if (!loader) return;

        // Check navigation type for smart loader behavior
        const isInternalNavigation = sessionStorage.getItem('isInternalNavigation');
        const isBackForward = performance.navigation.type === 2;
        const isSameSite = document.referrer.includes(window.location.hostname);
        
        // Hide loader immediately for internal navigation
        if (isInternalNavigation || isBackForward || isSameSite) {
            loader.style.display = 'none';
            return;
        }

        // Smooth loader exit for external visits
        this.hideLoaderGracefully(loader);
    }

    hideLoaderGracefully(loader) {
        // Ensure minimum loading time for brand perception (300ms)
        const minLoadTime = 300;
        const startTime = performance.now();
        
        const hideLoader = () => {
            const elapsed = performance.now() - startTime;
            const delay = Math.max(0, minLoadTime - elapsed);
            
            setTimeout(() => {
                loader.style.opacity = '0';
                loader.style.transform = 'scale(0.9)';
                
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 300);
            }, delay);
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hideLoader);
        } else {
            hideLoader();
        }
    }

    // Handle session-based navigation and state
    handleSessionNavigation() {
        const hasVisitedSession = sessionStorage.getItem('hasVisitedSession');
        const heroSection = document.getElementById('hero-section');
        const mainContent = document.getElementById('main-content');
        
        // Home page session handling
        if (heroSection && mainContent && hasVisitedSession) {
            heroSection.classList.add('hidden');
            // Remove visible class addition - content stays static
            
            // Let browser handle natural scroll position for better UX
        }

        // Mark internal navigation for loader optimization
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.hostname === window.location.hostname) {
                sessionStorage.setItem('isInternalNavigation', 'true');
            }
        });

        // Clear internal navigation flag after page loads
        window.addEventListener('load', () => {
            setTimeout(() => {
                sessionStorage.removeItem('isInternalNavigation');
            }, 100);
        });
    }

    // Smooth page transitions
    setupPageTransitions() {
        // Add enter animation class
        requestAnimationFrame(() => {
            document.body.classList.add('page-enter');
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshPageState();
            }
        });
    }

    // Refresh page state when returning from background
    refreshPageState() {
        const footer = document.querySelector('footer');
        
        // Ensure footer styling is preserved
        if (footer) {
            footer.style.background = 'linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #4a5568 100%)';
            footer.style.color = 'rgba(255, 255, 255, 0.95)';
        }

        // Re-initialize any dynamic elements if needed
        this.initializeDynamicElements();
    }

    // Initialize dynamic page elements
    initializeDynamicElements() {
        // Mobile menu functionality
        const menuToggle = document.querySelector('.menu-toggle');
        const nav = document.querySelector('.main-nav');
        
        if (menuToggle && nav) {
            // Remove existing listeners to prevent duplicates
            const newMenuToggle = menuToggle.cloneNode(true);
            menuToggle.parentNode.replaceChild(newMenuToggle, menuToggle);
            
            newMenuToggle.addEventListener('click', () => {
                newMenuToggle.classList.toggle('active');
                nav.classList.toggle('active');
                
                // Accessibility
                const isExpanded = nav.classList.contains('active');
                newMenuToggle.setAttribute('aria-expanded', isExpanded);
                nav.setAttribute('aria-hidden', !isExpanded);
            });
        }

        // Header stays in original position - no scroll effects
    }

    // Header maintains original position - no scroll-based changes needed

    // Utility: Show toast notifications for user feedback
    static showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        
        // Toast styles
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            background: type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            maxWidth: '300px'
        });
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });
        
        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
}

// Initialize page manager immediately
new PageManager();

// Export for external use
window.PageManager = PageManager;