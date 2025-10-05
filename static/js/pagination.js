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
        
        this.itemsPerRow = 1;
        this.currentVisible = 0;
        
        this.init();
    }
    
    init() {
        this.grid = document.querySelector(this.gridSelector);
        this.cards = document.querySelectorAll(this.cardSelector);
        this.button = document.querySelector(this.buttonSelector);
        
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
        
        // Calculate initial visible items
        if (this.hasFeaturedItem && this.totalCards > 1) {
            // First item is featured and spans full width, so start counting from second item
            // Show first item (featured) + first row of regular items
            this.currentVisible = Math.min(1 + this.itemsPerRow, this.totalCards);
        } else {
            // Show first complete row
            this.currentVisible = Math.min(this.itemsPerRow, this.totalCards);
        }
        
        // Hide all cards beyond the initial visible count
        for (let i = this.currentVisible; i < this.totalCards; i++) {
            this.cards[i].style.display = 'none';
        }
        
        // Hide button if all items are visible
        if (this.currentVisible >= this.totalCards) {
            this.button.style.display = 'none';
        } else {
            this.button.style.display = 'block';
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
                this.cards[i].style.display = 'block';
                this.cards[i].style.animation = 'fadeInUp 0.6s ease forwards';
                this.cards[i].style.animationDelay = `${(i - previousVisible) * 0.1}s`;
            }
        }
        
        // Hide button if no more items
        if (this.currentVisible >= this.totalCards) {
            this.button.style.display = 'none';
        }
    }
    
    bindEvents() {
        // View More button click
        this.button.addEventListener('click', () => {
            this.showMoreItems();
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
            gridSelector: '#news-grid',
            cardSelector: '.news-card',
            buttonSelector: '#view-more-btn',
            hasFeaturedItem: true,
            rowsPerClick: 2
        },
        articles: {
            gridSelector: '.articles-grid',
            cardSelector: '.article-card',
            buttonSelector: '#view-more-articles-btn',
            hasFeaturedItem: false,
            rowsPerClick: 2
        },
        knowledge: {
            gridSelector: '.knowledge-grid',
            cardSelector: '.knowledge-card',
            buttonSelector: '#view-more-knowledge-btn',
            hasFeaturedItem: false,
            rowsPerClick: 2
        },
        storytime: {
            gridSelector: '.storytime-grid',
            cardSelector: '.storytime-card',
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