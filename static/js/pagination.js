/**
 * Dynamic Row-Based Pagination System
 * Provides reusable pagination functionality for news grids
 */

class DynamicPagination {
    constructor(options = {}) {
        this.gridSelector = options.gridSelector || '.news-grid';
        this.cardSelector = options.cardSelector || '.news-card';
        this.buttonSelector = options.buttonSelector || '#view-more-btn';
        this.minItemWidth = options.minItemWidth || 320;
        this.gap = options.gap || 24; // 1.5rem
        this.padding = options.padding || 64; // 2rem on each side
        this.rowsPerClick = options.rowsPerClick || 2;
        this.hasFeaturedItem = options.hasFeaturedItem !== false; // default true
        this.initialVisibleCount = options.initialVisibleCount || null;
        this.pageType = options.pageType || 'home';
        this.storageKey = `dailygoodnews:${this.pageType}:pagination`;
        
        this.itemsPerRow = 1;
        this.currentVisible = 0;
        
        this.init();
    }
    
    init() {
        this.grid = document.querySelector(this.gridSelector);
        this.cards = document.querySelectorAll(this.cardSelector);
        this.button = document.querySelector(this.buttonSelector);
        this.buttonContainer = this.button ? this.button.closest('.view-more-container') : null;
        
        if (!this.grid || !this.cards.length || !this.button) {
            return;
        }
        
        this.totalCards = this.cards.length;
        this.setupPagination();
        this.bindEvents();
    }
    
    calculateItemsPerRow() {
        if (this.totalCards <= 1) return 1;
        
        // Get grid container width
        const gridWidth = this.grid.offsetWidth;
        const availableWidth = gridWidth - this.padding;
        
        // Calculate how many items can fit
        let itemsInRow = Math.floor((availableWidth + this.gap) / (this.minItemWidth + this.gap));
        itemsInRow = Math.max(1, itemsInRow); // At least 1 item per row
        
        return itemsInRow;
    }
    
    setupPagination() {
        this.itemsPerRow = this.calculateItemsPerRow();
        
        const defaultVisible = this.calculateDefaultVisibleCount();
        const restoredState = this.getStoredState();

        if (this.initialVisibleCount) {
            this.currentVisible = Math.min(this.initialVisibleCount, this.totalCards);
        } else if (restoredState && restoredState.visibleCount) {
            this.currentVisible = Math.min(
                Math.max(restoredState.visibleCount, defaultVisible),
                this.totalCards,
            );
        } else {
            this.currentVisible = defaultVisible;
        }

        this.cards.forEach((card, index) => {
            card.style.display = index < this.currentVisible ? '' : 'none';
            card.style.opacity = '';
            card.style.transform = '';
            card.style.transition = '';
            card.style.animation = '';
            card.style.animationDelay = '';
        });
        
        // Hide all cards beyond the initial visible count
        for (let i = this.currentVisible; i < this.totalCards; i++) {
            this.cards[i].style.display = 'none';
        }
        
        // Hide button if all items are visible
        this.updateButtonVisibility();

        if (restoredState && Number.isFinite(restoredState.scrollY)) {
            requestAnimationFrame(() => {
                window.scrollTo({
                    top: restoredState.scrollY,
                    behavior: 'auto',
                });
            });
        }
    }

    calculateDefaultVisibleCount() {
        if (this.hasFeaturedItem && this.totalCards > 1) {
            return Math.min(1 + this.itemsPerRow, this.totalCards);
        }

        return Math.min(this.itemsPerRow, this.totalCards);
    }

    getStoredState() {
        try {
            return JSON.parse(sessionStorage.getItem(this.storageKey) || 'null');
        } catch (error) {
            return null;
        }
    }

    storeState() {
        try {
            sessionStorage.setItem(
                this.storageKey,
                JSON.stringify({
                    visibleCount: this.currentVisible,
                    scrollY: window.scrollY,
                }),
            );
        } catch (error) {
            // Session storage can be unavailable in private modes.
        }
    }

    updateButtonVisibility() {
        const hasMoreItems = this.currentVisible < this.totalCards;
        const display = hasMoreItems ? '' : 'none';

        this.button.style.display = display;

        if (this.buttonContainer) {
            this.buttonContainer.style.display = display;
        }
    }
    
    showMoreItems() {
        const previousVisible = this.currentVisible;
        
        // Show next row(s) - show specified number of complete rows
        const itemsToShow = this.itemsPerRow * this.rowsPerClick;
        this.currentVisible = Math.min(this.currentVisible + itemsToShow, this.totalCards);
        
        // Animate new items
        for (let i = previousVisible; i < this.currentVisible; i++) {
            if (this.cards[i]) {
                this.cards[i].style.display = '';
                this.cards[i].style.opacity = '0';
                this.cards[i].style.transform = 'translateY(24px)';
                this.cards[i].style.transition = 'opacity 0.55s ease, transform 0.55s cubic-bezier(0.22, 0.68, 0, 1.2)';

                const card = this.cards[i];
                requestAnimationFrame(() => {
                    card.style.transitionDelay = `${(i - previousVisible) * 0.08}s`;
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                });
            }
        }
        
        // Hide button if no more items
        this.updateButtonVisibility();
        this.storeState();
    }
    
    bindEvents() {
        // View More button click
        this.button.addEventListener('click', () => {
            this.showMoreItems();
        });

        this.grid.addEventListener('click', (event) => {
            const cardLink = event.target.closest('a');

            if (cardLink) {
                this.storeState();
            }
        });
        
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const newItemsPerRow = this.calculateItemsPerRow();
                if (newItemsPerRow !== this.itemsPerRow) {
                    this.itemsPerRow = newItemsPerRow;
                }
            }, 250);
        });
    }
    
    // Public method to reinitialize pagination (useful for dynamic content)
    refresh() {
        this.cards = document.querySelectorAll(this.cardSelector);
        this.totalCards = this.cards.length;
        this.setupPagination();
    }
}

// Utility function to initialize pagination for different page types
function initializePagination(pageType = 'home') {
    const configs = {
        home: {
            pageType: 'home',
            gridSelector: '#news-grid',
            cardSelector: '.news-card',
            buttonSelector: '#view-more-btn',
            hasFeaturedItem: true,
            minItemWidth: 290,
            rowsPerClick: 2
        },
        articles: {
            pageType: 'articles',
            gridSelector: '.articles-grid',
            cardSelector: '.article-card',
            buttonSelector: '#view-more-articles-btn',
            hasFeaturedItem: false,
            rowsPerClick: 2
        },
        knowledge: {
            pageType: 'knowledge',
            gridSelector: '.knowledge-grid',
            cardSelector: '.knowledge-card',
            buttonSelector: '#view-more-knowledge-btn',
            hasFeaturedItem: false,
            rowsPerClick: 2
        },
        storytime: {
            pageType: 'storytime',
            gridSelector: '.storytime-grid',
            cardSelector: '.story-card',
            buttonSelector: '#view-more-stories-btn',
            hasFeaturedItem: false,
            rowsPerClick: 2
        }
    };
    
    const config = configs[pageType] || configs.home;
    return new DynamicPagination(config);
}

// Auto-initialize based on page detection
document.addEventListener('DOMContentLoaded', function() {
    // Detect page type based on current elements
    if (document.querySelector('#news-grid')) {
        initializePagination('home');
    } else if (document.querySelector('.articles-grid')) {
        initializePagination('articles');
    } else if (document.querySelector('.knowledge-grid')) {
        initializePagination('knowledge');
    } else if (document.querySelector('.storytime-grid')) {
        initializePagination('storytime');
    }
});

// Export for manual initialization if needed
window.DynamicPagination = DynamicPagination;
window.initializePagination = initializePagination;

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-go-back]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const fallbackUrl = link.getAttribute('href') || '/';
            let referrerUrl = null;

            try {
                referrerUrl = document.referrer ? new URL(document.referrer) : null;
            } catch (error) {
                referrerUrl = null;
            }

            if (
                referrerUrl &&
                referrerUrl.origin === window.location.origin &&
                window.history.length > 1
            ) {
                event.preventDefault();
                window.history.back();
                return;
            }

            window.location.href = fallbackUrl;
        });
    });
});
