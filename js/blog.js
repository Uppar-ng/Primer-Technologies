// js/blog.js - Enhanced Version (Corrected)

// ============================================
// Configuration & Constants
// ============================================
const BlogConfig = {
    apiEndpoints: {
        blog: 'data/blog.json'
    },
    localStorageKeys: {
        newsletter: 'primer_newsletter_subscribed',
        readArticles: 'primer_read_articles'
    },
    pagination: {
        itemsPerPage: 9,
        visiblePages: 3
    },
    cacheDuration: 10 * 60 * 1000, // 10 minutes
    imagePaths: {
        blog: 'images/blog/',
        fallback: 'images/3.jpg'
    }
};

// ============================================
// Blog Application State
// ============================================
const BlogState = {
    blogData: [],
    currentPage: 1,
    currentCategory: 'all',
    currentSort: 'newest',
    currentSearch: '',
    cache: {
        blogPosts: null,
        timestamp: 0
    },
    readArticles: new Set()
};

// ============================================
// DOM Elements Reference
// ============================================
const BlogDOM = {
    featuredArticle: document.getElementById('featuredArticle'),
    articlesGrid: document.getElementById('articlesGrid'),
    pagination: document.getElementById('pagination'),
    categoriesList: document.getElementById('categoriesList'),
    popularArticles: document.getElementById('popularArticles'),
    blogSearchForm: document.getElementById('blogSearchForm'),
    blogSearch: document.getElementById('blogSearch'),
    categoryFilter: document.getElementById('categoryFilter'),
    sortFilter: document.getElementById('sortFilter'),
    newsletterForm: document.getElementById('newsletterForm')
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
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

function slugify(text) {
    return text.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function getImagePath(imageName) {
    if (!imageName) return BlogConfig.imagePaths.fallback;
    if (imageName.startsWith('http')) return imageName;
    return `${BlogConfig.imagePaths.blog}${imageName}`;
}

// ============================================
// State Management
// ============================================
const BlogStateManager = {
    initialize() {
        this.loadReadArticles();
    },
    
    loadReadArticles() {
        try {
            const read = localStorage.getItem(BlogConfig.localStorageKeys.readArticles);
            if (read) {
                BlogState.readArticles = new Set(JSON.parse(read));
            }
        } catch (e) {
            console.warn('Failed to load read articles:', e);
        }
    },
    
    markArticleAsRead(articleId) {  // Correct function name
        BlogState.readArticles.add(articleId);
        try {
            localStorage.setItem(
                BlogConfig.localStorageKeys.readArticles,
                JSON.stringify([...BlogState.readArticles])
            );
        } catch (e) {
            console.warn('Failed to save read articles:', e);
        }
    },
    
    isArticleRead(articleId) {
        return BlogState.readArticles.has(articleId);
    },
    
    subscribeNewsletter(email) {
        try {
            localStorage.setItem(BlogConfig.localStorageKeys.newsletter, email);
            return true;
        } catch (e) {
            console.warn('Failed to save newsletter subscription:', e);
            return false;
        }
    },
    
    isSubscribed() {
        return !!localStorage.getItem(BlogConfig.localStorageKeys.newsletter);
    }
};

// ============================================
// Data Loading & Caching
// ============================================
async function loadBlogData() {
    try {
        // Check cache first
        const now = Date.now();
        if (BlogState.cache.blogPosts && 
            (now - BlogState.cache.timestamp < BlogConfig.cacheDuration)) {
            BlogState.blogData = BlogState.cache.blogPosts;
            renderBlogContent();
            return;
        }

        const response = await fetch(BlogConfig.apiEndpoints.blog);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        BlogState.blogData = data.posts || [];
        
        // Update cache
        BlogState.cache.blogPosts = BlogState.blogData;
        BlogState.cache.timestamp = now;
        
        renderBlogContent();
        
    } catch (error) {
        console.error('Error loading blog data:', error);
        displayErrorState();
    }
}

// ============================================
// Rendering Functions
// ============================================
function renderBlogContent() {
    displayFeaturedArticle();
    displayCategories();
    displayPopularArticles();
    displayArticles();
}

function displayFeaturedArticle() {
    if (!BlogDOM.featuredArticle || BlogState.blogData.length === 0) return;
    
    // Get the most recent article as featured
    const featured = [...BlogState.blogData]
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    if (!featured) return;
    
    BlogDOM.featuredArticle.innerHTML = `
        <div class="featured-image">
            <img src="${getImagePath(featured.image)}" 
                 alt="${featured.title}" 
                 loading="lazy"
                 onerror="this.src='${BlogConfig.imagePaths.fallback}'">
        </div>
        <div class="featured-content">
            <span class="featured-category">${featured.category}</span>
            <h3 class="featured-title">${featured.title}</h3>
            <p class="featured-excerpt">${featured.excerpt}</p>
            <div class="featured-meta">
                <span><i class="fas fa-user"></i>${featured.author}</span>
                <span><i class="fas fa-calendar"></i>${formatDate(featured.date)}</span>
                <span><i class="fas fa-clock"></i>${featured.readTime || '5 min read'}</span>
            </div>
            <button class="btn btn-primary" onclick="viewBlogPost(${featured.id})">
                Read Full Article
            </button>
        </div>
    `;
}

function displayArticles() {
    if (!BlogDOM.articlesGrid) return;
    
    const filteredData = getFilteredData();
    const totalPages = Math.ceil(filteredData.length / BlogConfig.pagination.itemsPerPage);
    const startIndex = (BlogState.currentPage - 1) * BlogConfig.pagination.itemsPerPage;
    const endIndex = startIndex + BlogConfig.pagination.itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    if (pageData.length === 0) {
        BlogDOM.articlesGrid.innerHTML = createNoResultsHTML();
        BlogDOM.pagination.innerHTML = '';
        return;
    }
    
    BlogDOM.articlesGrid.innerHTML = pageData.map(createArticleCardHTML).join('');
    displayPagination(totalPages);
    
    // Re-attach event listeners for read more buttons
    attachReadMoreListeners();
}

function createArticleCardHTML(article) {
    const isRead = BlogStateManager.isArticleRead(article.id);
    const readClass = isRead ? 'article-read' : '';
    
    return `
        <article class="blog-card ${readClass}" data-id="${article.id}">
            <div class="blog-image">
                <img src="${getImagePath(article.image)}" 
                     alt="${article.title}" 
                     loading="lazy"
                     onerror="this.src='${BlogConfig.imagePaths.fallback}'">
            </div>
            <div class="blog-content">
                <span class="blog-category">${article.category}</span>
                <h3 class="blog-title">${article.title}</h3>
                <div class="blog-excerpt-container">
                    <p class="blog-excerpt">${article.excerpt}</p>
                    ${article.content ? `
                        <div class="article-full-content" style="display: none;">
                            ${article.content}
                        </div>
                        <button class="btn-text read-more-btn" data-id="${article.id}">
                            <span class="read-more-text">Read More</span>
                            <span class="read-less-text" style="display: none;">Show Less</span>
                            <i class="fas fa-chevron-down read-more-icon"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="blog-meta">
                    <span><i class="fas fa-user"></i>${article.author}</span>
                    <span><i class="fas fa-calendar"></i>${formatDate(article.date)}</span>
                </div>
                <button class="btn btn-outline view-article-btn" data-id="${article.id}">
                    View Details
                </button>
            </div>
        </article>
    `;
}

function attachReadMoreListeners() {
    // Attach event listeners to all read more buttons
    document.querySelectorAll('.read-more-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const articleId = parseInt(this.dataset.id);
            handleReadMore(articleId);
        });
    });
    
    // Attach event listeners to view article buttons
    document.querySelectorAll('.view-article-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const articleId = parseInt(this.dataset.id);
            viewBlogPost(articleId);
        });
    });
}

function createNoResultsHTML() {
    return `
        <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: var(--spacing-2xl);">
            <i class="fas fa-search" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: var(--spacing-md);"></i>
            <h3>No Articles Found</h3>
            <p>Try adjusting your filters or search terms.</p>
            <button onclick="clearFilters()" class="btn btn-primary" style="margin-top: var(--spacing-md);">
                <i class="fas fa-redo" style="margin-right: 0.5rem;"></i>Clear Filters
            </button>
        </div>
    `;
}

function displayPagination(totalPages) {
    if (!BlogDOM.pagination || totalPages <= 1) {
        BlogDOM.pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = `
        <button class="pagination-btn" 
                onclick="changePage(${BlogState.currentPage - 1})" 
                ${BlogState.currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Calculate page range
    const halfVisible = Math.floor(BlogConfig.pagination.visiblePages / 2);
    let startPage = Math.max(1, BlogState.currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + BlogConfig.pagination.visiblePages - 1);
    
    if (endPage - startPage + 1 < BlogConfig.pagination.visiblePages) {
        startPage = Math.max(1, endPage - BlogConfig.pagination.visiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
        paginationHTML += `
            <button class="pagination-page" onclick="changePage(1)">1</button>
            ${startPage > 2 ? '<span class="pagination-ellipsis">...</span>' : ''}
        `;
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-page ${i === BlogState.currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Last page
    if (endPage < totalPages) {
        paginationHTML += `
            ${endPage < totalPages - 1 ? '<span class="pagination-ellipsis">...</span>' : ''}
            <button class="pagination-page" onclick="changePage(${totalPages})">${totalPages}</button>
        `;
    }
    
    paginationHTML += `
        <button class="pagination-btn" 
                onclick="changePage(${BlogState.currentPage + 1})" 
                ${BlogState.currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    BlogDOM.pagination.innerHTML = paginationHTML;
}

function displayCategories() {
    if (!BlogDOM.categoriesList || BlogState.blogData.length === 0) return;
    
    // Calculate category counts
    const categories = {};
    BlogState.blogData.forEach(article => {
        const categorySlug = slugify(article.category);
        categories[categorySlug] = categories[categorySlug] || {
            name: article.category,
            slug: categorySlug,
            count: 0
        };
        categories[categorySlug].count++;
    });
    
    BlogDOM.categoriesList.innerHTML = Object.values(categories)
        .sort((a, b) => b.count - a.count)
        .map(category => `
            <li>
                <a href="#" class="category-link" data-category="${category.slug}">
                    ${category.name}
                    <span class="count">${category.count}</span>
                </a>
            </li>
        `).join('');
}

function displayPopularArticles() {
    if (!BlogDOM.popularArticles || BlogState.blogData.length === 0) return;
    
    // Get top 4 most viewed articles
    const popular = [...BlogState.blogData]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 4);
    
    BlogDOM.popularArticles.innerHTML = popular.map(article => `
        <div class="popular-article" data-id="${article.id}" style="cursor: pointer;">
            <div class="popular-image">
                <img src="${getImagePath(article.image)}" 
                     alt="${article.title}" 
                     loading="lazy"
                     onerror="this.src='${BlogConfig.imagePaths.fallback}'">
            </div>
            <div class="popular-content">
                <h4>${article.title}</h4>
                <p><i class="fas fa-calendar" style="margin-right: 0.25rem;"></i>${formatDate(article.date)}</p>
            </div>
        </div>
    `).join('');
    
    // Attach click listeners to popular articles
    document.querySelectorAll('.popular-article').forEach(article => {
        article.addEventListener('click', function() {
            const articleId = parseInt(this.dataset.id);
            viewBlogPost(articleId);
        });
    });
}

// ============================================
// Filtering & Data Processing
// ============================================
function getFilteredData() {
    let filteredData = [...BlogState.blogData];
    
    // Category filter
    if (BlogState.currentCategory !== 'all') {
        filteredData = filteredData.filter(article => 
            slugify(article.category) === BlogState.currentCategory
        );
    }
    
    // Search filter
    if (BlogState.currentSearch) {
        const searchTerm = BlogState.currentSearch.toLowerCase();
        filteredData = filteredData.filter(article =>
            article.title.toLowerCase().includes(searchTerm) ||
            article.excerpt.toLowerCase().includes(searchTerm) ||
            (article.content && article.content.toLowerCase().includes(searchTerm)) ||
            article.author.toLowerCase().includes(searchTerm) ||
            article.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply sorting
    switch (BlogState.currentSort) {
        case 'newest':
            filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'popular':
            filteredData.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
        case 'most-read':
            filteredData.sort((a, b) => (b.readCount || 0) - (a.readCount || 0));
            break;
    }
    
    return filteredData;
}

// ============================================
// Event Handlers & Interaction
// ============================================
function handleCategoryFilter(category) {
    BlogState.currentCategory = category;
    BlogState.currentPage = 1;
    if (BlogDOM.categoryFilter) {
        BlogDOM.categoryFilter.value = category;
    }
    displayArticles();
}

function handleSearch(searchTerm) {
    BlogState.currentSearch = searchTerm;
    BlogState.currentPage = 1;
    displayArticles();
}

function handleSort(sortType) {
    BlogState.currentSort = sortType;
    BlogState.currentPage = 1;
    displayArticles();
}

function changePage(page) {
    const filteredData = getFilteredData();
    const totalPages = Math.ceil(filteredData.length / BlogConfig.pagination.itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    BlogState.currentPage = page;
    displayArticles();
    
    // Smooth scroll to articles
    if (BlogDOM.articlesGrid) {
        BlogDOM.articlesGrid.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
        });
    }
}

function clearFilters() {
    BlogState.currentCategory = 'all';
    BlogState.currentSearch = '';
    BlogState.currentPage = 1;
    
    if (BlogDOM.categoryFilter) BlogDOM.categoryFilter.value = 'all';
    if (BlogDOM.sortFilter) BlogDOM.sortFilter.value = 'newest';
    if (BlogDOM.blogSearch) BlogDOM.blogSearch.value = '';
    
    displayArticles();
}

function handleReadMore(articleId) {
    const articleCard = document.querySelector(`.blog-card[data-id="${articleId}"]`);
    if (!articleCard) return;
    
    const readMoreBtn = articleCard.querySelector('.read-more-btn');
    const fullContent = articleCard.querySelector('.article-full-content');
    const excerpt = articleCard.querySelector('.blog-excerpt');
    const readMoreText = articleCard.querySelector('.read-more-text');
    const readLessText = articleCard.querySelector('.read-less-text');
    
    if (!readMoreBtn || !fullContent) return;
    
    const isExpanded = fullContent.style.display === 'block';
    
    if (isExpanded) {
        // Collapse
        fullContent.style.display = 'none';
        if (excerpt) excerpt.style.display = 'block';
        readMoreText.style.display = 'inline';
        readLessText.style.display = 'none';
        readMoreBtn.querySelector('.read-more-icon').classList.remove('fa-chevron-up');
        readMoreBtn.querySelector('.read-more-icon').classList.add('fa-chevron-down');
    } else {
        // Expand
        fullContent.style.display = 'block';
        if (excerpt) excerpt.style.display = 'none';
        readMoreText.style.display = 'none';
        readLessText.style.display = 'inline';
        readMoreBtn.querySelector('.read-more-icon').classList.remove('fa-chevron-down');
        readMoreBtn.querySelector('.read-more-icon').classList.add('fa-chevron-up');
        
        // Mark as read
        BlogStateManager.markArticleAsRead(articleId);  // Correct function name
        articleCard.classList.add('article-read');
    }
}

// ============================================
// View Blog Post Function (FIXED)
// ============================================
function viewBlogPost(id) {
    // Mark article as read - FIXED FUNCTION NAME
    BlogStateManager.markArticleAsRead(id);  // Correct function name
    
    // In a real implementation, navigate to blog post page
    // For now, show the article in a modal or alert
    const article = BlogState.blogData.find(a => a.id === id);
    if (article) {
        // Create a modal to show the article
        showArticleModal(article);
    }
}

function showArticleModal(article) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.article-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="article-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-lg);
            opacity: 0;
            animation: fadeIn 0.3s ease forwards;
        ">
            <div class="article-modal-content" style="
                background: var(--surface-white);
                border-radius: var(--border-radius-lg);
                max-width: 800px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                transform: translateY(20px);
                animation: slideUp 0.3s ease 0.1s forwards;
            ">
                <button class="modal-close" onclick="this.closest('.article-modal').remove()" style="
                    position: absolute;
                    top: var(--spacing-md);
                    right: var(--spacing-md);
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    color: var(--text-tertiary);
                    cursor: pointer;
                    z-index: 1;
                ">&times;</button>
                
                <div class="article-modal-body" style="padding: var(--spacing-2xl);">
                    <span class="blog-category">${article.category}</span>
                    <h2 style="margin-top: var(--spacing-md);">${article.title}</h2>
                    
                    <div class="article-modal-meta" style="
                        display: flex;
                        gap: var(--spacing-lg);
                        margin: var(--spacing-lg) 0;
                        color: var(--text-tertiary);
                        font-size: var(--font-size-sm);
                    ">
                        <span><i class="fas fa-user"></i>${article.author}</span>
                        <span><i class="fas fa-calendar"></i>${formatDate(article.date)}</span>
                        <span><i class="fas fa-clock"></i>${article.readTime || '5 min read'}</span>
                    </div>
                    
                    ${article.image ? `
                        <div style="margin: var(--spacing-xl) 0;">
                            <img src="${getImagePath(article.image)}" 
                                 alt="${article.title}" 
                                 style="width: 100%; border-radius: var(--border-radius-md);">
                        </div>
                    ` : ''}
                    
                    <div class="article-content" style="
                        line-height: var(--line-height-relaxed);
                        color: var(--text-secondary);
                    ">
                        ${article.content || article.excerpt}
                    </div>
                    
                    <div style="margin-top: var(--spacing-xl); text-align: center;">
                        <button class="btn btn-primary" onclick="this.closest('.article-modal').remove()">
                            Close Article
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes fadeIn {
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                to { transform: translateY(0); }
            }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Close modal on ESC key
    const modal = document.querySelector('.article-modal');
    const closeOnEsc = function(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeOnEsc);
        }
    };
    
    document.addEventListener('keydown', closeOnEsc);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
            document.removeEventListener('keydown', closeOnEsc);
        }
    });
}

// ============================================
// Newsletter Subscription
// ============================================
async function subscribeNewsletter(email) {
    // Show loading state
    const submitBtn = BlogDOM.newsletterForm?.querySelector('button[type="submit"]');
    if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading"></span> Subscribing...';
        submitBtn.disabled = true;
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Save subscription
            const success = BlogStateManager.subscribeNewsletter(email);
            
            if (success) {
                showNotification('Successfully subscribed to newsletter!', 'success');
                BlogDOM.newsletterForm.reset();
            } else {
                showNotification('Failed to subscribe. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            showNotification('Subscription failed. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// ============================================
// Error Handling
// ============================================
function displayErrorState() {
    if (!BlogDOM.articlesGrid) return;
    
    BlogDOM.articlesGrid.innerHTML = `
        <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: var(--spacing-2xl);">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error); margin-bottom: var(--spacing-md);"></i>
            <h3>Unable to Load Blog Articles</h3>
            <p>Please check your connection and try again.</p>
            <button onclick="loadBlogData()" class="btn btn-primary" style="margin-top: var(--spacing-md);">
                <i class="fas fa-redo" style="margin-right: 0.5rem;"></i>Retry
            </button>
        </div>
    `;
}

// ============================================
// Event Listeners Setup
// ============================================
function setupEventListeners() {
    // Category filter select
    if (BlogDOM.categoryFilter) {
        BlogDOM.categoryFilter.addEventListener('change', (e) => {
            handleCategoryFilter(e.target.value);
        });
    }
    
    // Sort filter select
    if (BlogDOM.sortFilter) {
        BlogDOM.sortFilter.addEventListener('change', (e) => {
            handleSort(e.target.value);
        });
    }
    
    // Search form
    if (BlogDOM.blogSearchForm && BlogDOM.blogSearch) {
        BlogDOM.blogSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSearch(BlogDOM.blogSearch.value.trim());
        });
        
        // Live search with debounce
        BlogDOM.blogSearch.addEventListener('input', debounce(() => {
            handleSearch(BlogDOM.blogSearch.value.trim());
        }, 500));
    }
    
    // Newsletter form
    if (BlogDOM.newsletterForm) {
        BlogDOM.newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = BlogDOM.newsletterForm.querySelector('input[type="email"]').value;
            if (email) {
                subscribeNewsletter(email);
            }
        });
    }
    
    // Category links (event delegation)
    document.addEventListener('click', (e) => {
        if (e.target.closest('.category-link')) {
            e.preventDefault();
            const link = e.target.closest('.category-link');
            const category = link.dataset.category;
            handleCategoryFilter(category);
        }
    });
}

// ============================================
// Notification System
// ============================================
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.blog-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `blog-notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#2563EB'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 99999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// CSS Injection for Additional Styles
// ============================================
function injectBlogStyles() {
    const styleId = 'blog-enhanced-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .article-read {
            opacity: 0.95;
            position: relative;
        }
        
        .article-read::after {
            content: 'Read';
            position: absolute;
            top: 10px;
            right: 10px;
            background: var(--success);
            color: white;
            padding: 2px 8px;
            border-radius: var(--border-radius-sm);
            font-size: var(--font-size-xs);
            font-weight: 600;
            z-index: 1;
        }
        
        .read-more-btn {
            background: none;
            border: none;
            color: var(--primary-blue);
            cursor: pointer;
            font-size: var(--font-size-sm);
            font-weight: 500;
            padding: 0;
            margin-top: var(--spacing-sm);
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: color var(--transition-fast);
        }
        
        .read-more-btn:hover {
            color: var(--primary-blue-dark);
            text-decoration: underline;
        }
        
        .read-more-icon {
            font-size: 0.875rem;
            transition: transform var(--transition-fast);
        }
        
        .pagination-ellipsis {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 2.5rem;
            height: 2.5rem;
            color: var(--text-tertiary);
        }
        
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
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    
    document.head.appendChild(style);
}

// ============================================
// Initialization
// ============================================
function initBlogPage() {
    // Inject styles
    injectBlogStyles();
    
    // Initialize state manager
    BlogStateManager.initialize();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load blog data
    loadBlogData();
}

// ============================================
// Start Application
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlogPage);
} else {
    initBlogPage();
}

// ============================================
// Global Functions (for HTML onclick)
// ============================================
window.viewBlogPost = viewBlogPost;
window.changePage = changePage;
window.clearFilters = clearFilters;