/**
 * Primer Technologies - Blog Page JavaScript
 * Handles blog data loading, filtering, search, and pagination
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize blog page
    initBlogPage();
    
    // Load blog data
    loadBlogData();
    
    // Setup event listeners
    setupEventListeners();
});

/**
 * Initialize blog page
 */
function initBlogPage() {
    // Add CSS for blog page specific styles
    const style = document.createElement('style');
    style.textContent = `
        .blog-search-form .form-group {
            position: relative;
        }
        
        .blog-search-form .btn {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
            padding-left: var(--spacing-lg);
            padding-right: var(--spacing-lg);
        }
        
        .featured-article {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--spacing-2xl);
            background: var(--surface-white);
            border-radius: var(--border-radius-lg);
            overflow: hidden;
            box-shadow: var(--shadow-lg);
        }
        
        @media (min-width: 768px) {
            .featured-article {
                grid-template-columns: 1fr 1fr;
            }
        }
        
        .featured-image {
            height: 300px;
            overflow: hidden;
        }
        
        @media (min-width: 768px) {
            .featured-image {
                height: auto;
            }
        }
        
        .featured-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform var(--transition-normal) ease;
        }
        
        .featured-article:hover .featured-image img {
            transform: scale(1.05);
        }
        
        .featured-content {
            padding: var(--spacing-xl);
        }
        
        .featured-category {
            display: inline-block;
            background: var(--primary-blue);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: var(--border-radius-sm);
            font-size: var(--font-size-xs);
            font-weight: 600;
            margin-bottom: var(--spacing-md);
        }
        
        .featured-title {
            font-size: var(--font-size-3xl);
            margin-bottom: var(--spacing-md);
        }
        
        .featured-excerpt {
            color: var(--text-secondary);
            margin-bottom: var(--spacing-lg);
            line-height: var(--line-height-relaxed);
        }
        
        .featured-meta {
            display: flex;
            align-items: center;
            gap: var(--spacing-lg);
            color: var(--text-tertiary);
            font-size: var(--font-size-sm);
            margin-bottom: var(--spacing-lg);
        }
        
        .featured-meta span {
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }
        
        .blog-layout {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--spacing-2xl);
        }
        
        @media (min-width: 1024px) {
            .blog-layout {
                grid-template-columns: 2fr 1fr;
            }
        }
        
        .articles-header {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
            margin-bottom: var(--spacing-2xl);
        }
        
        @media (min-width: 768px) {
            .articles-header {
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
            }
        }
        
        .articles-filter {
            display: flex;
            gap: var(--spacing-md);
        }
        
        .blog-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--spacing-xl);
        }
        
        @media (min-width: 768px) {
            .blog-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        
        @media (min-width: 1200px) {
            .blog-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }
        
        .blog-card {
            background: var(--surface-white);
            border-radius: var(--border-radius-lg);
            overflow: hidden;
            box-shadow: var(--shadow-md);
            transition: transform var(--transition-normal) ease;
        }
        
        .blog-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-xl);
        }
        
        .blog-image {
            height: 200px;
            overflow: hidden;
        }
        
        .blog-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform var(--transition-normal) ease;
        }
        
        .blog-card:hover .blog-image img {
            transform: scale(1.05);
        }
        
        .blog-content {
            padding: var(--spacing-lg);
        }
        
        .blog-category {
            display: inline-block;
            background: var(--primary-blue);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: var(--border-radius-sm);
            font-size: var(--font-size-xs);
            font-weight: 600;
            margin-bottom: var(--spacing-md);
        }
        
        .blog-title {
            font-size: var(--font-size-lg);
            margin-bottom: var(--spacing-sm);
            color: var(--text-primary);
        }
        
        .blog-excerpt {
            color: var(--text-secondary);
            margin-bottom: var(--spacing-md);
            font-size: var(--font-size-sm);
            line-height: var(--line-height-relaxed);
        }
        
        .blog-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: var(--text-tertiary);
            font-size: var(--font-size-xs);
            margin-bottom: var(--spacing-md);
        }
        
        .blog-meta span {
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }
        
        .blog-actions {
            display: flex;
            gap: var(--spacing-sm);
        }
        
        .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: var(--spacing-sm);
            margin-top: var(--spacing-2xl);
            padding: var(--spacing-lg) 0;
        }
        
        .pagination-btn {
            width: 2.5rem;
            height: 2.5rem;
            border: 1px solid var(--border-light);
            background: var(--surface-white);
            border-radius: var(--border-radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all var(--transition-fast) ease;
        }
        
        .pagination-btn:hover:not(:disabled) {
            background: var(--primary-blue);
            color: white;
            border-color: var(--primary-blue);
        }
        
        .pagination-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .pagination-page {
            min-width: 2.5rem;
            height: 2.5rem;
            border: 1px solid var(--border-light);
            background: var(--surface-white);
            border-radius: var(--border-radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all var(--transition-fast) ease;
        }
        
        .pagination-page:hover {
            background: var(--background-dark);
        }
        
        .pagination-page.active {
            background: var(--primary-blue);
            color: white;
            border-color: var(--primary-blue);
        }
        
        .blog-sidebar {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-2xl);
        }
        
        .sidebar-widget {
            background: var(--surface-white);
            border-radius: var(--border-radius-lg);
            padding: var(--spacing-xl);
            box-shadow: var(--shadow-md);
        }
        
        .sidebar-widget h3 {
            margin-bottom: var(--spacing-lg);
            font-size: var(--font-size-lg);
        }
        
        .categories-list {
            list-style: none;
        }
        
        .categories-list li {
            margin-bottom: var(--spacing-sm);
        }
        
        .categories-list a {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-sm) 0;
            color: var(--text-secondary);
            text-decoration: none;
            border-bottom: 1px solid var(--border-light);
            transition: color var(--transition-fast) ease;
        }
        
        .categories-list a:hover {
            color: var(--primary-blue);
        }
        
        .categories-list .count {
            background: var(--background-dark);
            color: var(--text-secondary);
            padding: 0.125rem 0.5rem;
            border-radius: var(--border-radius-sm);
            font-size: var(--font-size-xs);
        }
        
        .popular-articles {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
        }
        
        .popular-article {
            display: flex;
            gap: var(--spacing-md);
            align-items: flex-start;
            padding-bottom: var(--spacing-md);
            border-bottom: 1px solid var(--border-light);
        }
        
        .popular-article:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        
        .popular-image {
            width: 80px;
            height: 80px;
            flex-shrink: 0;
            border-radius: var(--border-radius-md);
            overflow: hidden;
        }
        
        .popular-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .popular-content h4 {
            font-size: var(--font-size-sm);
            margin-bottom: 0.25rem;
        }
        
        .popular-content p {
            font-size: var(--font-size-xs);
            color: var(--text-tertiary);
            margin: 0;
        }
        
        .newsletter-widget {
            text-align: center;
        }
        
        .newsletter-widget p {
            margin-bottom: var(--spacing-md);
            color: var(--text-secondary);
        }
        
        .resources-list {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
        }
        
        .resource-link {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            padding: var(--spacing-sm);
            background: var(--background-dark);
            border-radius: var(--border-radius-md);
            color: var(--text-primary);
            text-decoration: none;
            transition: background-color var(--transition-fast) ease;
        }
        
        .resource-link:hover {
            background: var(--border-light);
        }
        
        .resource-link i {
            color: var(--primary-blue);
        }
        
        .cta-section {
            text-align: center;
            padding: var(--spacing-3xl) var(--spacing-xl);
            max-width: 800px;
            margin: 0 auto;
        }
        
        .cta-section h2 {
            margin-bottom: var(--spacing-lg);
        }
        
        .cta-section p {
            margin-bottom: var(--spacing-2xl);
            color: var(--text-secondary);
        }
        
        .cta-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-md);
            justify-content: center;
        }
        
        .loading-state {
            text-align: center;
            padding: var(--spacing-2xl);
            color: var(--text-tertiary);
        }
        
        .no-results {
            text-align: center;
            padding: var(--spacing-2xl);
            grid-column: 1 / -1;
        }
    `;
    
    document.head.appendChild(style);
}

let blogData = [];
let currentPage = 1;
const itemsPerPage = 9;
let currentCategory = 'all';
let currentSort = 'newest';
let currentSearch = '';

/**
 * Load blog data from JSON
 */
async function loadBlogData() {
    try {
        const response = await fetch('data/blog.json');
        const data = await response.json();
        blogData = data.posts;
        
        // Display featured article
        displayFeaturedArticle();
        
        // Display articles
        displayArticles();
        
        // Display categories
        displayCategories();
        
        // Display popular articles
        displayPopularArticles();
        
    } catch (error) {
        console.error('Error loading blog data:', error);
        displayError();
    }
}

/**
 * Display featured article
 */
function displayFeaturedArticle() {
    const featuredContainer = document.getElementById('featuredArticle');
    if (!featuredContainer || blogData.length === 0) return;
    
    // Get the most recent article as featured
    const featured = [...blogData]
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    featuredContainer.innerHTML = `
        <div class="featured-image">
            <img src="images/blog/${featured.image}" alt="${featured.title}" loading="lazy">
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

/**
 * Display articles based on current filters
 */
function displayArticles() {
    const articlesGrid = document.getElementById('articlesGrid');
    const pagination = document.getElementById('pagination');
    
    if (!articlesGrid) return;
    
    // Apply filters
    let filteredData = [...blogData];
    
    // Apply category filter
    if (currentCategory !== 'all') {
        filteredData = filteredData.filter(article => 
            article.category.toLowerCase().replace(/\s+/g, '-') === currentCategory
        );
    }
    
    // Apply search filter
    if (currentSearch) {
        const searchTerm = currentSearch.toLowerCase();
        filteredData = filteredData.filter(article =>
            article.title.toLowerCase().includes(searchTerm) ||
            article.excerpt.toLowerCase().includes(searchTerm) ||
            article.content.toLowerCase().includes(searchTerm) ||
            article.author.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply sorting
    switch (currentSort) {
        case 'newest':
            filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'popular':
            filteredData.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // Display articles
    if (pageData.length === 0) {
        articlesGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: var(--spacing-md);"></i>
                <h3>No Articles Found</h3>
                <p>Try adjusting your filters or search terms.</p>
            </div>
        `;
        pagination.innerHTML = '';
        return;
    }
    
    articlesGrid.innerHTML = pageData.map(article => `
        <article class="blog-card">
            <div class="blog-image">
                <img src="images/blog/${article.image}" alt="${article.title}" loading="lazy">
            </div>
            <div class="blog-content">
                <span class="blog-category">${article.category}</span>
                <h3 class="blog-title">${article.title}</h3>
                <p class="blog-excerpt">${article.excerpt}</p>
                <div class="blog-meta">
                    <span><i class="fas fa-user"></i>${article.author}</span>
                    <span><i class="fas fa-calendar"></i>${formatDate(article.date)}</span>
                </div>
                <button class="btn btn-outline" onclick="viewBlogPost(${article.id})">
                    Read More
                </button>
            </div>
        </article>
    `).join('');
    
    // Display pagination
    displayPagination(totalPages);
}

/**
 * Display pagination controls
 */
function displayPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination || totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = `
        <button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Display page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - 1 && i <= currentPage + 1)
        ) {
            paginationHTML += `
                <button class="pagination-page ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    paginationHTML += `
        <button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
}

/**
 * Change current page
 */
function changePage(page) {
    const totalPages = Math.ceil(getFilteredData().length / itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayArticles();
    
    // Scroll to top of articles
    const articlesGrid = document.getElementById('articlesGrid');
    if (articlesGrid) {
        articlesGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Get filtered data based on current filters
 */
function getFilteredData() {
    let filteredData = [...blogData];
    
    if (currentCategory !== 'all') {
        filteredData = filteredData.filter(article => 
            article.category.toLowerCase().replace(/\s+/g, '-') === currentCategory
        );
    }
    
    if (currentSearch) {
        const searchTerm = currentSearch.toLowerCase();
        filteredData = filteredData.filter(article =>
            article.title.toLowerCase().includes(searchTerm) ||
            article.excerpt.toLowerCase().includes(searchTerm) ||
            article.content.toLowerCase().includes(searchTerm) ||
            article.author.toLowerCase().includes(searchTerm)
        );
    }
    
    return filteredData;
}

/**
 * Display categories with counts
 */
function displayCategories() {
    const categoriesList = document.getElementById('categoriesList');
    if (!categoriesList) return;
    
    // Get unique categories with counts
    const categories = {};
    blogData.forEach(article => {
        const categorySlug = article.category.toLowerCase().replace(/\s+/g, '-');
        categories[categorySlug] = categories[categorySlug] || {
            name: article.category,
            count: 0,
            slug: categorySlug
        };
        categories[categorySlug].count++;
    });
    
    categoriesList.innerHTML = Object.values(categories)
        .map(category => `
            <li>
                <a href="#" onclick="filterByCategory('${category.slug}'); return false;">
                    ${category.name}
                    <span class="count">${category.count}</span>
                </a>
            </li>
        `).join('');
}

/**
 * Display popular articles
 */
function displayPopularArticles() {
    const popularContainer = document.getElementById('popularArticles');
    if (!popularContainer) return;
    
    // Get top 4 most viewed articles
    const popular = [...blogData]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 4);
    
    popularContainer.innerHTML = popular.map(article => `
        <div class="popular-article">
            <div class="popular-image">
                <img src="images/blog/${article.image}" alt="${article.title}" loading="lazy">
            </div>
            <div class="popular-content">
                <h4>${article.title}</h4>
                <p><i class="fas fa-calendar" style="margin-right: 0.25rem;"></i>${formatDate(article.date)}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Filter articles by category
 */
function filterByCategory(category) {
    currentCategory = category;
    currentPage = 1;
    document.getElementById('categoryFilter').value = category;
    displayArticles();
}

/**
 * Format date to readable format
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * View blog post (placeholder function)
 */
function viewBlogPost(id) {
    // In a real implementation, this would navigate to the blog post page
    console.log(`Viewing blog post ${id}`);
    alert(`In a complete implementation, this would navigate to blog-post.html?id=${id}`);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentCategory = e.target.value;
            currentPage = 1;
            displayArticles();
        });
    }
    
    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            currentSort = e.target.value;
            currentPage = 1;
            displayArticles();
        });
    }
    
    // Search form
    const searchForm = document.getElementById('blogSearchForm');
    const searchInput = document.getElementById('blogSearch');
    
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            currentSearch = searchInput.value.trim();
            currentPage = 1;
            displayArticles();
        });
        
        // Live search on input (optional)
        searchInput.addEventListener('input', debounce(() => {
            currentSearch = searchInput.value.trim();
            currentPage = 1;
            displayArticles();
        }, 500));
    }
    
    // Newsletter form
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input[type="email"]').value;
            subscribeNewsletter(email);
        });
    }
}

/**
 * Debounce function for search input
 */
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

/**
 * Subscribe to newsletter
 */
function subscribeNewsletter(email) {
    // In a real implementation, this would send data to a server
    console.log(`Subscribing email: ${email}`);
    alert('Thank you for subscribing to our newsletter!');
    
    // Reset form
    const form = document.getElementById('newsletterForm');
    if (form) form.reset();
}

/**
 * Display error message
 */
function displayError() {
    const articlesGrid = document.getElementById('articlesGrid');
    if (!articlesGrid) return;
    
    articlesGrid.innerHTML = `
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
