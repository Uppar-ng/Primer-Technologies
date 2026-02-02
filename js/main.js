// js/main.js

// Global State Management
const AppState = {
    isMobile: false,
    isTouchDevice: false,
    currentPage: 'home',
    favorites: JSON.parse(localStorage.getItem('primer_favorites')) || [],
    cart: JSON.parse(localStorage.getItem('primer_cart')) || [],
    user: JSON.parse(localStorage.getItem('primer_user')) || null,
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

// DOM Elements
const DOM = {
    mobileMenuModal: document.getElementById('mobileNav'),
    mobileMenuBtn: document.getElementById('mobileMenuToggle'),
    closeMenuModal: document.getElementById('closeMobileMenu'),
    featuredProperties: document.getElementById('featuredProperties'),
    servicesGrid: document.getElementById('servicesGrid'),
    blogGrid: document.getElementById('blogGrid')
};

// Initialize Application
function initApp() {
    detectDevice();
    setupEventListeners();
    loadInitialData();
    updateNavigation();
    prefillSearchForm();
    handleHeaderScroll();
    window.addEventListener('scroll', handleHeaderScroll);
}

// Device Detection
function detectDevice() {
    AppState.isMobile = window.innerWidth <= 767;
    AppState.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Event Listeners Setup
function setupEventListeners() {
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
    
    // List property button
    const listPropertyBtn = document.getElementById('listPropertyBtn');
    if (listPropertyBtn) {
        listPropertyBtn.addEventListener('click', handleListProperty);
    }
    
    // Mobile list property button
    const mobileListPropertyBtn = document.getElementById('mobileListPropertyBtn');
    if (mobileListPropertyBtn) {
        mobileListPropertyBtn.addEventListener('click', handleListProperty);
    }
    
    // User menu
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
    }
    
    // Close mobile nav on link click
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
}

// Header scroll function
function handleHeaderScroll() {
    const header = document.getElementById('mainHeader');
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
}

// Mobile Menu Functions
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

// Data Loading Functions
async function loadInitialData() {
    try {
        // Load featured properties
        await loadFeaturedProperties();
        
        // Note: Services are already in HTML, no need to load from JSON
        
        // Load blog posts only if blogGrid exists
        if (DOM.blogGrid) {
            await loadBlogPosts();
        }
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        showError('Failed to load data. Please check your connection.');
    }
}

async function loadFeaturedProperties() {
    try {
        // Check if featured properties container exists
        if (!DOM.featuredProperties) return;
        
        // Check if properties.json exists before trying to load
        try {
            const response = await fetch('data/properties.json');
            if (!response.ok) {
                throw new Error('Properties file not found');
            }
            
            const data = await response.json();
            
            // Filter for featured properties (first 6)
            const featured = data.properties.slice(0, 6);
            
            // Clear existing content
            DOM.featuredProperties.innerHTML = '';
            
            // Render properties
            featured.forEach(property => {
                const propertyCard = createPropertyCard(property);
                DOM.featuredProperties.appendChild(propertyCard);
            });
            
        } catch (fetchError) {
            console.warn('Could not load properties.json, using fallback:', fetchError);
            
            // Fallback: Keep existing HTML content or show placeholder
            if (DOM.featuredProperties.children.length === 0) {
                DOM.featuredProperties.innerHTML = `
                    <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-secondary);">
                        <p>Properties will be loaded soon.</p>
                        <p>Check back later for featured listings.</p>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('Error loading properties:', error);
        if (DOM.featuredProperties) {
            DOM.featuredProperties.innerHTML = '<p class="text-center" style="padding: var(--spacing-xl); color: var(--text-tertiary);">Unable to load properties. Please try again later.</p>';
        }
    }
}

function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    card.setAttribute('data-id', property.id);
    card.setAttribute('role', 'article');
    card.setAttribute('aria-label', `${property.title} - ${property.price}`);

    const isFavorite = AppState.favorites.includes(property.id);
    
    card.innerHTML = `
        <div class="property-image">
            <img src="${property.images[0] || 'images/2.jpg'}" alt="${property.title}" loading="lazy">
            <span class="property-badge">${property.type === 'sale' ? 'For Sale' : 'For Rent'}</span>
            <button class="property-favorite ${isFavorite ? 'active' : ''}" 
                    aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
                    data-id="${property.id}">
                <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
            </button>
        </div>
        <div class="property-content">
            <div class="property-price">$${property.price.toLocaleString()}</div>
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
            <button class="btn btn-outline btn-full" onclick="viewProperty(${property.id})" style="margin-top: var(--spacing-md);">
                View Details
            </button>
        </div>
    `;

    // Add favorite button event listener
    const favoriteBtn = card.querySelector('.property-favorite');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(property.id, favoriteBtn);
        });
    }

    return card;
}

async function loadBlogPosts() {
    if (!DOM.blogGrid) return;
    
    try {
        // Check if blog.json exists
        const response = await fetch('data/blog.json');
        if (!response.ok) {
            throw new Error('Blog file not found');
        }
        
        const data = await response.json();
        
        // Get latest 3 posts
        const latestPosts = data.posts.slice(0, 3);
        
        // Clear existing content
        DOM.blogGrid.innerHTML = '';
        
        // Render blog posts
        latestPosts.forEach(post => {
            const blogCard = document.createElement('article');
            blogCard.className = 'blog-card';
            blogCard.setAttribute('data-id', post.id);

            blogCard.innerHTML = `
                <div class="blog-image">
                    <img src="${post.image || 'images/3.jpg'}" alt="${post.title}" loading="lazy">
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
        
    } catch (error) {
        console.warn('Could not load blog.json, keeping existing HTML:', error);
        // Keep existing HTML content
        return;
    }
}

// Utility Functions
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
        return dateString; // Return original if parsing fails
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#2563EB'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1050;
        animation: slideIn 0.3s ease;
        font-size: 14px;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function showError(message) {
    showNotification(message, 'error');
}

// Prefill search form from URL parameters
function prefillSearchForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const location = urlParams.get('location');
    const type = urlParams.get('type');
    const minPrice = urlParams.get('minPrice');
    const maxPrice = urlParams.get('maxPrice');
    
    if (location) {
        const locationInput = document.getElementById('location');
        if (locationInput) locationInput.value = location;
    }
    
    if (type) {
        const typeSelect = document.getElementById('propertyType');
        if (typeSelect) typeSelect.value = type;
    }
    
    if (minPrice) {
        const minPriceInput = document.getElementById('minPrice');
        if (minPriceInput) minPriceInput.value = minPrice;
    }
    
    if (maxPrice) {
        const maxPriceInput = document.getElementById('maxPrice');
        if (maxPriceInput) maxPriceInput.value = maxPrice;
    }
}

// Event Handlers
function handleResize() {
    const wasMobile = AppState.isMobile;
    detectDevice();
    
    if (wasMobile !== AppState.isMobile) {
        updateNavigation();
    }
}

function handlePropertySearch(e) {
    e.preventDefault();
    
    const location = document.getElementById('location')?.value || '';
    const type = document.getElementById('propertyType')?.value || '';
    const minPrice = document.getElementById('minPrice')?.value || '';
    const maxPrice = document.getElementById('maxPrice')?.value || '';
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        
        // Create loading indicator if not exists
        let loadingSpan = submitBtn.querySelector('.loading');
        if (!loadingSpan) {
            loadingSpan = document.createElement('span');
            loadingSpan.className = 'loading';
            loadingSpan.style.cssText = 'display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px; vertical-align: middle;';
            loadingSpan.style.display = 'inline-block';
        }
        
        submitBtn.disabled = true;
        
        // Build query parameters
        const params = new URLSearchParams();
        if (location) params.set('location', location);
        if (type) params.set('type', type);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        
        // Redirect to browse page with search parameters
        setTimeout(() => {
            window.location.href = `browse.html?${params.toString()}`;
            
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 800);
    }
}

function handleListProperty() {
    window.location.href = 'contact.html?service=listing';
}

function toggleFavorite(propertyId, button) {
    const index = AppState.favorites.indexOf(propertyId);
    
    if (index > -1) {
        // Remove from favorites
        AppState.favorites.splice(index, 1);
        button.classList.remove('active');
        button.setAttribute('aria-label', 'Add to favorites');
        button.innerHTML = '<i class="far fa-heart"></i>';
        showNotification('Removed from favorites');
    } else {
        // Add to favorites
        AppState.favorites.push(propertyId);
        button.classList.add('active');
        button.setAttribute('aria-label', 'Remove from favorites');
        button.innerHTML = '<i class="fas fa-heart"></i>';
        showNotification('Added to favorites');
    }
    
    // Save to localStorage
    try {
        localStorage.setItem('primer_favorites', JSON.stringify(AppState.favorites));
    } catch (e) {
        console.warn('Could not save favorites to localStorage:', e);
    }
}

function updateNavigation() {
    // Update active state based on current page
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

// Navigation Functions (called from HTML onclick)
function viewProperty(id) {
    window.location.href = `property.html?id=${id}`;
}

function viewService(id) {
    window.location.href = `services.html#${id}`;
}

function viewBlogPost(id) {
    window.location.href = `blog.html#post-${id}`;
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Add CSS animations
const style = document.createElement('style');
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
    }
    
    .notification.notification-error {
        background-color: #EF4444 !important;
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
