// js/main.js - Enhanced Version

// ============================================
// Configuration Constants
// ============================================
const Config = {
    fallbackImages: {
        property: 'images/2.jpg',
        blog: 'images/3.jpg'
    },
    apiEndpoints: {
        properties: 'data/properties.json',
        blog: 'data/blog.json'
    },
    localStorageKeys: {
        favorites: 'primer_favorites',
        cart: 'primer_cart',
        user: 'primer_user'
    },
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    currency: {
        symbol: '₦',
        code: 'NGN'
    }
};

// ============================================
// Application State
// ============================================
const AppState = {
    isMobile: false,
    isTouchDevice: false,
    currentPage: 'home',
    favorites: [],
    cart: [],
    user: null,
    propertyFilters: {
        location: '',
        type: '',
        minPrice: null,
        maxPrice: null,
        bedrooms: null,
        bathrooms: null,
        amenities: []
    }
};

// ============================================
// Cache Management
// ============================================
const Cache = {
    properties: null,
    blogPosts: null,
    timestamp: {
        properties: 0,
        blog: 0
    }
};

// ============================================
// DOM Elements Reference
// ============================================
const DOM = {
    mobileMenuModal: document.getElementById('mobileNav'),
    mobileMenuBtn: document.getElementById('mobileMenuToggle'),
    closeMenuModal: document.getElementById('closeMobileMenu'),
    featuredProperties: document.getElementById('featuredProperties'),
    servicesGrid: document.getElementById('servicesGrid'),
    blogGrid: document.getElementById('blogGrid'),
    mainHeader: document.getElementById('mainHeader')
};

// ============================================
// Notification Manager
// ============================================
const NotificationManager = {
    queue: [],
    isShowing: false,
    
    show(message, type = 'info', duration = 3000) {
        this.queue.push({ message, type, duration });
        if (!this.isShowing) {
            this.processQueue();
        }
    },
    
    processQueue() {
        if (this.queue.length === 0) {
            this.isShowing = false;
            return;
        }
        
        this.isShowing = true;
        const { message, type, duration } = this.queue.shift();
        this.createNotification(message, type, duration);
    },
    
    createNotification(message, type, duration) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="notification-icon ${this.getIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" aria-label="Close notification">
                &times;
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Add close button handler
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.removeNotification(notification));
        
        // Auto remove
        setTimeout(() => this.removeNotification(notification), duration);
    },
    
    removeNotification(notification) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
            this.processQueue();
        }, 300);
    },
    
    getIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }
};

// ============================================
// State Manager
// ============================================
const StateManager = {
    initialize() {
        // Load all state from localStorage
        AppState.favorites = this.get(Config.localStorageKeys.favorites) || [];
        AppState.cart = this.get(Config.localStorageKeys.cart) || [];
        AppState.user = this.get(Config.localStorageKeys.user) || null;
    },
    
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch {
            console.warn(`Failed to parse ${key} from localStorage`);
            return null;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Failed to save ${key} to localStorage:`, error);
            return false;
        }
    },
    
    updateFavorites(propertyId) {
        const index = AppState.favorites.indexOf(propertyId);
        if (index > -1) {
            AppState.favorites.splice(index, 1);
        } else {
            AppState.favorites.push(propertyId);
        }
        this.set(Config.localStorageKeys.favorites, AppState.favorites);
        return index === -1; // Returns true if added, false if removed
    }
};

// ============================================
// URL Helper
// ============================================
const URLHelper = {
    getSearchParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            location: params.get('location') || '',
            type: params.get('type') || '',
            minPrice: params.get('minPrice') || '',
            maxPrice: params.get('maxPrice') || ''
        };
    },
    
    buildSearchURL(params) {
        const urlParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
            if (value && value !== '') {
                urlParams.set(key, value);
            }
        });
        
        return `browse.html?${urlParams.toString()}`;
    },
    
    updateURLParam(key, value) {
        const url = new URL(window.location);
        if (value) {
            url.searchParams.set(key, value);
        } else {
            url.searchParams.delete(key);
        }
        window.history.pushState({}, '', url);
    }
};

// ============================================
// Utility Functions
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatDate(dateString) {
    try {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
        return dateString;
    }
}

function formatPrice(price) {
    return `${Config.currency.symbol}${price.toLocaleString()}`;
}

function showNotification(message, type = 'info') {
    NotificationManager.show(message, type);
}

function showError(message) {
    showNotification(message, 'error');
}

// ============================================
// Device & UI Functions
// ============================================
function detectDevice() {
    AppState.isMobile = window.innerWidth <= 767;
    AppState.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function handleHeaderScroll() {
    if (!DOM.mainHeader) return;
    
    if (window.scrollY > 50) {
        DOM.mainHeader.classList.add('scrolled');
    } else {
        DOM.mainHeader.classList.remove('scrolled');
    }
}

function updateNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        const linkPath = link.getAttribute('href');
        if (currentPath.endsWith(linkPath) || 
            (currentPath === '/' && linkPath === 'index.html') ||
            (currentPath.includes('index.html') && linkPath === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// ============================================
// Mobile Menu Functions
// ============================================
function openMobileMenu() {
    if (DOM.mobileMenuModal) {
        DOM.mobileMenuModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (DOM.mobileMenuBtn) {
            DOM.mobileMenuBtn.classList.add('active');
        }
    }
}

function closeMobileMenu() {
    if (DOM.mobileMenuModal) {
        DOM.mobileMenuModal.classList.remove('active');
        document.body.style.overflow = '';
        if (DOM.mobileMenuBtn) {
            DOM.mobileMenuBtn.classList.remove('active');
        }
    }
}

// ============================================
// Property Card Creation
// ============================================
function createPropertyCard(property) {
    const template = document.createElement('template');
    const isFavorite = AppState.favorites.includes(property.id);
    
    template.innerHTML = `
        <div class="property-card" data-id="${property.id}" role="article" aria-label="${property.title} - ${formatPrice(property.price)}">
            <div class="property-image">
                <img src="${property.images[0] || Config.fallbackImages.property}" 
                     alt="${property.title}" 
                     loading="lazy"
                     width="400" 
                     height="300">
                <span class="property-badge">${property.type === 'sale' ? 'For Sale' : 'For Rent'}</span>
                <button class="property-favorite ${isFavorite ? 'active' : ''}" 
                        aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
                        data-id="${property.id}"
                        data-action="toggle-favorite">
                    <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
            <div class="property-content">
                <div class="property-price">${formatPrice(property.price)}</div>
                <h3 class="property-title">${property.title}</h3>
                <p class="property-address">${property.address}, ${property.city}, ${property.state}</p>
                <div class="property-features">
                    <div class="feature">
                        <i class="fas fa-bed"></i>
                        <span>${property.bedrooms} bed${property.bedrooms !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="feature">
                        <i class="fas fa-bath"></i>
                        <span>${property.bathrooms} bath${property.bathrooms !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="feature">
                        <i class="fas fa-ruler-combined"></i>
                        <span>${property.squareFeet.toLocaleString()} sqft</span>
                    </div>
                </div>
                <button class="btn btn-outline btn-full" 
                        onclick="viewProperty(${property.id})" 
                        style="margin-top: var(--spacing-md);">
                    View Details
                </button>
            </div>
        </div>
    `;
    
    return template.content.firstElementChild;
}

// ============================================
// Data Loading Functions
// ============================================
async function loadInitialData() {
    try {
        await loadFeaturedProperties();
        
        if (DOM.blogGrid) {
            await loadBlogPosts();
        }
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        showError('Failed to load data. Please check your connection.');
    }
}

async function loadFeaturedProperties() {
    if (!DOM.featuredProperties) return;
    
    try {
        // Check cache first
        const now = Date.now();
        if (Cache.properties && (now - Cache.timestamp.properties < Config.cacheDuration)) {
            renderProperties(Cache.properties.slice(0, 6));
            return;
        }
        
        const response = await fetch(Config.apiEndpoints.properties);
        if (!response.ok) {
            throw new Error('Properties file not found');
        }
        
        const data = await response.json();
        
        // Cache the data
        Cache.properties = data.properties;
        Cache.timestamp.properties = now;
        
        // Render properties
        renderProperties(data.properties.slice(0, 6));
        
    } catch (error) {
        console.warn('Could not load properties.json:', error);
        showFallbackProperties();
    }
}

function renderProperties(properties) {
    DOM.featuredProperties.innerHTML = '';
    properties.forEach(property => {
        DOM.featuredProperties.appendChild(createPropertyCard(property));
    });
}

function showFallbackProperties() {
    if (DOM.featuredProperties.children.length === 0) {
        DOM.featuredProperties.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-secondary);">
                <p>Properties will be loaded soon.</p>
                <p>Check back later for featured listings.</p>
            </div>
        `;
    }
}

async function loadBlogPosts() {
    if (!DOM.blogGrid) return;
    
    try {
        // Check cache first
        const now = Date.now();
        if (Cache.blogPosts && (now - Cache.timestamp.blog < Config.cacheDuration)) {
            renderBlogPosts(Cache.blogPosts.slice(0, 3));
            return;
        }
        
        const response = await fetch(Config.apiEndpoints.blog);
        if (!response.ok) {
            throw new Error('Blog file not found');
        }
        
        const data = await response.json();
        
        // Cache the data
        Cache.blogPosts = data.posts;
        Cache.timestamp.blog = now;
        
        // Render blog posts
        renderBlogPosts(data.posts.slice(0, 3));
        
    } catch (error) {
        console.warn('Could not load blog.json, keeping existing HTML:', error);
    }
}

function renderBlogPosts(posts) {
    DOM.blogGrid.innerHTML = '';
    posts.forEach(post => {
        const blogCard = document.createElement('article');
        blogCard.className = 'blog-card';
        blogCard.setAttribute('data-id', post.id);

        blogCard.innerHTML = `
            <div class="blog-image">
                <img src="${post.image || Config.fallbackImages.blog}" alt="${post.title}" loading="lazy">
            </div>
            <div class="blog-content">
                <span class="blog-category">${post.category}</span>
                <h3 class="blog-title">${post.title}</h3>
                <p class="blog-excerpt">${post.excerpt}</p>
                <div class="blog-meta">
                    <span><i class="fas fa-user" style="margin-right: 0.25rem;"></i>${post.author}</span>
                    <span><i class="fas fa-calendar" style="margin-right: 0.25rem;"></i>${formatDate(post.date)}</span>
                </div>
                <button class="btn btn-outline" onclick="viewBlogPost(${post.id})" style="margin-top: var(--spacing-md);">
                    Read More
                </button>
            </div>
        `;

        DOM.blogGrid.appendChild(blogCard);
    });
}

// ============================================
// Event Handlers
// ============================================
function handleGlobalClick(e) {
    const target = e.target;
    
    // Handle favorite buttons
    if (target.closest('[data-action="toggle-favorite"]')) {
        e.preventDefault();
        e.stopPropagation();
        const button = target.closest('[data-action="toggle-favorite"]');
        const propertyId = parseInt(button.dataset.id);
        toggleFavorite(propertyId, button);
        return;
    }
    
    // Handle user dropdown outside click
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (userMenuBtn && userDropdown && userDropdown.classList.contains('active')) {
        if (!userMenuBtn.contains(target) && !userDropdown.contains(target)) {
            userDropdown.classList.remove('active');
        }
    }
    
    // Handle mobile nav link clicks
    if (target.closest('.mobile-nav-link')) {
        closeMobileMenu();
    }
}

function handleResize() {
    const wasMobile = AppState.isMobile;
    detectDevice();
    
    if (wasMobile !== AppState.isMobile) {
        updateNavigation();
    }
}

function handlePropertySearch(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const params = {
        location: formData.get('location') || '',
        type: formData.get('propertyType') || '',
        minPrice: formData.get('minPrice') || '',
        maxPrice: formData.get('maxPrice') || ''
    };
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        const originalHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Searching...';
        
        // Build and redirect to search results
        setTimeout(() => {
            window.location.href = URLHelper.buildSearchURL(params);
        }, 800);
    }
}

function handleListProperty() {
    window.location.href = 'contact.html?service=listing';
}

function toggleFavorite(propertyId, button) {
    const wasAdded = StateManager.updateFavorites(propertyId);
    
    if (wasAdded) {
        button.classList.add('active');
        button.setAttribute('aria-label', 'Remove from favorites');
        button.innerHTML = '<i class="fas fa-heart"></i>';
        showNotification('Added to favorites', 'success');
    } else {
        button.classList.remove('active');
        button.setAttribute('aria-label', 'Add to favorites');
        button.innerHTML = '<i class="far fa-heart"></i>';
        showNotification('Removed from favorites', 'info');
    }
}

// ============================================
// Form Functions
// ============================================
function prefillSearchForm() {
    const { location, type, minPrice, maxPrice } = URLHelper.getSearchParams();
    
    // Set form values
    const fields = {
        'location': location,
        'propertyType': type,
        'minPrice': minPrice,
        'maxPrice': maxPrice
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const element = document.getElementById(fieldId);
        if (element && value) {
            element.value = value;
        }
    });
}

// ============================================
// Setup Functions
// ============================================
function setupEventListeners() {
    // Global click handler for dynamic elements
    document.addEventListener('click', handleGlobalClick);
    
    // Mobile menu
    if (DOM.mobileMenuBtn) {
        DOM.mobileMenuBtn.addEventListener('click', openMobileMenu);
    }
    
    if (DOM.closeMenuModal) {
        DOM.closeMenuModal.addEventListener('click', closeMobileMenu);
    }
    
    // Window resize
    window.addEventListener('resize', debounce(handleResize, 250));
    
    // Search form
    const searchForm = document.getElementById('propertySearch');
    if (searchForm) {
        searchForm.addEventListener('submit', handlePropertySearch);
    }
    
    // List property buttons
    const listPropertyBtns = document.querySelectorAll('[data-action="list-property"]');
    listPropertyBtns.forEach(btn => {
        btn.addEventListener('click', handleListProperty);
    });
    
    // User menu
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
    }
}

function setupLazyLoading() {
    if (!('IntersectionObserver' in window)) return;
    
    const lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                lazyObserver.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.1
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        lazyObserver.observe(img);
    });
}

function injectStyles() {
    if (document.getElementById('dynamic-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'dynamic-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }
        
        .notification {
            animation: slideIn 0.3s ease;
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2563EB;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1050;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
        }
        
        .notification-success {
            background-color: #10B981 !important;
        }
        
        .notification-error {
            background-color: #EF4444 !important;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: inherit;
            font-size: 20px;
            cursor: pointer;
            margin-left: 10px;
            opacity: 0.8;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
        
        .loading {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #fff;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 8px;
            vertical-align: middle;
        }
    `;
    
    document.head.appendChild(style);
}

// ============================================
// Navigation Functions (Public API)
// ============================================
function viewProperty(id) {
    window.location.href = `property.html?id=${id}`;
}

function viewService(id) {
    window.location.href = `services.html#${id}`;
}

function viewBlogPost(id) {
    window.location.href = `blog.html#post-${id}`;
}

// ============================================
// Initialization
// ============================================
function initApp() {
    // Inject styles first
    injectStyles();
    
    // Initialize state
    StateManager.initialize();
    
    // Detect device
    detectDevice();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    loadInitialData();
    
    // Update UI
    updateNavigation();
    prefillSearchForm();
    handleHeaderScroll();
    
    // Setup performance optimizations
    setupLazyLoading();
    
    // Add scroll listener
    window.addEventListener('scroll', debounce(handleHeaderScroll, 100));
}

// Start the application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}