/**
 * Primer Technologies - Main JavaScript File
 * Common functionality used across all pages
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize common functionality
    initCommon();
    
    // Load header and footer data
    loadCommonData();
    
    // Setup mobile menu
    setupMobileMenu();
    
    // Setup user dropdown
    setupUserDropdown();
    
    // Setup header scroll effect
    setupHeaderScroll();
    
    // Setup property listing buttons
    setupPropertyButtons();
});

/**
 * Initialize common functionality
 */
function initCommon() {
    // Add any global initialization code here
    console.log('Primer Technologies - Complete Property Solutions');
}

/**
 * Load common data (header/footer info)
 */
async function loadCommonData() {
    try {
        // Load company info from JSON
        const response = await fetch('data/info.json');
        const data = await response.json();
        
        // Update any dynamic content if needed
        updateDynamicContent(data.company);
        
    } catch (error) {
        console.error('Error loading common data:', error);
    }
}

/**
 * Update dynamic content on page
 */
function updateDynamicContent(companyInfo) {
    // Update copyright year if needed
    const copyrightElements = document.querySelectorAll('.footer-bottom p');
    copyrightElements.forEach(element => {
        if (element.textContent.includes('2024')) {
            element.innerHTML = element.innerHTML.replace('2024', new Date().getFullYear());
        }
    });
    
    // Update contact information if needed
    // This can be expanded to update other dynamic content
}

/**
 * Setup mobile menu functionality
 */
function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const closeMobileMenu = document.getElementById('closeMobileMenu');
    const mobileNav = document.getElementById('mobileNav');
    
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            mobileNav.classList.toggle('active');
            document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
        });
    }
    
    if (closeMobileMenu && mobileNav) {
        closeMobileMenu.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            closeMobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Close mobile menu when clicking on a link
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

/**
 * Setup user dropdown menu
 */
function setupUserDropdown() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            userDropdown.style.display = 'none';
        });
        
        // Prevent dropdown from closing when clicking inside
        userDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

/**
 * Setup header scroll effect
 */
function setupHeaderScroll() {
    const mainHeader = document.getElementById('mainHeader');
    
    if (mainHeader) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                mainHeader.classList.add('scrolled');
            } else {
                mainHeader.classList.remove('scrolled');
            }
        });
        
        // Initialize on load
        if (window.scrollY > 50) {
            mainHeader.classList.add('scrolled');
        }
    }
}

/**
 * Setup property listing buttons
 */
function setupPropertyButtons() {
    const listPropertyBtn = document.getElementById('listPropertyBtn');
    const mobileListPropertyBtn = document.getElementById('mobileListPropertyBtn');
    
    const handleListProperty = () => {
        // In a real implementation, this would navigate to the property listing page
        alert('In a complete implementation, this would open the property listing form.');
        // window.location.href = 'list-property.html';
    };
    
    if (listPropertyBtn) {
        listPropertyBtn.addEventListener('click', handleListProperty);
    }
    
    if (mobileListPropertyBtn) {
        mobileListPropertyBtn.addEventListener('click', handleListProperty);
    }
}

/**
 * View service details
 */
function viewService(serviceId) {
    // In a real implementation, this would navigate to the service details
    console.log(`Viewing service: ${serviceId}`);
    // window.location.href = `services.html#${serviceId}`;
    
    // For now, just scroll to the service section on the services page
    alert(`In a complete implementation, this would navigate to the ${serviceId} service details.`);
}

/**
 * View blog post
 */
function viewBlogPost(postId) {
    // In a real implementation, this would navigate to the blog post
    console.log(`Viewing blog post: ${postId}`);
    // window.location.href = `blog-post.html?id=${postId}`;
    
    alert(`In a complete implementation, this would open blog post ${postId}.`);
}

/**
 * Format price with commas
 */
function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

/**
 * Debounce function for performance
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
 * Check if device is mobile
 */
function isMobile() {
    return window.innerWidth <= 767;
}

/**
 * Check if device is tablet
 */
function isTablet() {
    return window.innerWidth > 767 && window.innerWidth <= 1023;
}

/**
 * Check if device is desktop
 */
function isDesktop() {
    return window.innerWidth > 1023;
}

/**
 * Set active navigation link based on current page
 */
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || 
            (currentPage === '' && href === 'index.html') ||
            (href && href.includes(currentPage.replace('.html', '')))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Setup form validation
 */
function setupFormValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
    
    form.addEventListener('submit', function(e) {
        if (!validateForm(this)) {
            e.preventDefault();
        }
    });
}

/**
 * Validate a form field
 */
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    if (field.required && !value) {
        isValid = false;
        errorMessage = field.dataset.errorMessage || 'This field is required';
    }
    
    if (field.type === 'email' && value && !isValidEmail(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
    }
    
    if (field.type === 'tel' && value && !isValidPhone(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid phone number';
    }
    
    if (field.type === 'number' && field.min && parseInt(value) < parseInt(field.min)) {
        isValid = false;
        errorMessage = `Minimum value is ${field.min}`;
    }
    
    if (field.type === 'number' && field.max && parseInt(value) > parseInt(field.max)) {
        isValid = false;
        errorMessage = `Maximum value is ${field.max}`;
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

/**
 * Validate entire form
 */
function validateForm(form) {
    const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * Show field error
 */
function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    errorElement.style.color = 'var(--error)';
    errorElement.style.fontSize = 'var(--font-size-sm)';
    errorElement.style.marginTop = 'var(--spacing-xs)';
    
    field.parentNode.appendChild(errorElement);
    field.classList.add('error');
}

/**
 * Clear field error
 */
function clearFieldError(field) {
    const errorElement = field.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
    field.classList.remove('error');
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone format (basic)
 */
function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

/**
 * Show loading state
 */
function showLoading(element) {
    element.disabled = true;
    const originalText = element.innerHTML;
    element.innerHTML = `<span class="loading"></span> Loading...`;
    element.dataset.originalContent = originalText;
}

/**
 * Hide loading state
 */
function hideLoading(element) {
    element.disabled = false;
    element.innerHTML = element.dataset.originalContent || 'Submit';
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = 'var(--spacing-md) var(--spacing-lg)';
    toast.style.backgroundColor = type === 'success' ? 'var(--success)' : 
                                 type === 'error' ? 'var(--error)' : 
                                 type === 'warning' ? 'var(--warning)' : 'var(--info)';
    toast.style.color = 'white';
    toast.style.borderRadius = 'var(--border-radius-md)';
    toast.style.boxShadow = 'var(--shadow-lg)';
    toast.style.zIndex = 'var(--z-index-tooltip)';
    toast.style.transition = 'transform var(--transition-normal) ease';
    toast.style.transform = 'translateY(100px)';
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

/**
 * Handle API errors
 */
function handleApiError(error) {
    console.error('API Error:', error);
    showToast(error.message || 'An error occurred. Please try again.', 'error');
}

/**
 * Make API request
 */
async function makeApiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(endpoint, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        handleApiError(error);
        throw error;
    }
}

/**
 * Initialize page when DOM is loaded
 */
window.addEventListener('DOMContentLoaded', function() {
    // Set active navigation
    setActiveNavLink();
    
    // Initialize any page-specific functionality based on current page
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'about.html':
            // About page specific initialization
            break;
        case 'blog.html':
            // Blog page specific initialization
            break;
        case 'contact.html':
            // Contact page specific initialization
            setupFormValidation('contactForm');
            break;
        case 'services.html':
            // Services page specific initialization
            break;
        case 'browse.html':
            // Browse page specific initialization
            break;
        default:
            // Homepage or other pages
            break;
    }
});