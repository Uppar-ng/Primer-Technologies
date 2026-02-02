/**
 * Primer Technologies - Contact Page JavaScript
 * Handles contact form submission, validation, and FAQ accordion
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize contact page
    initContactPage();
    
    // Setup form validation and submission
    setupContactForm();
    
    // Setup FAQ accordion
    setupFAQAccordion();
    
    // Setup newsletter form
    setupNewsletterForm();
});

/**
 * Initialize contact page
 */
function initContactPage() {
    // Add CSS for contact page specific styles
    const style = document.createElement('style');
    style.textContent = `
        .contact-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: var(--spacing-xl);
            margin-top: var(--spacing-2xl);
        }
        
        .contact-option {
            text-align: center;
            padding: var(--spacing-xl);
            background: var(--surface-white);
            border-radius: var(--border-radius-lg);
            box-shadow: var(--shadow-md);
            transition: transform var(--transition-normal) ease;
        }
        
        .contact-option:hover {
            transform: translateY(-4px);
        }
        
        .option-icon {
            width: 5rem;
            height: 5rem;
            background: linear-gradient(135deg, var(--primary-blue), var(--secondary-green));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto var(--spacing-lg);
            color: white;
            font-size: 2rem;
        }
        
        .contact-layout {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--spacing-2xl);
        }
        
        @media (min-width: 1024px) {
            .contact-layout {
                grid-template-columns: 2fr 1fr;
            }
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--spacing-md);
        }
        
        @media (min-width: 768px) {
            .form-row {
                grid-template-columns: 1fr 1fr;
            }
        }
        
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
        }
        
        .checkbox-group input[type="checkbox"] {
            width: 1.25rem;
            height: 1.25rem;
        }
        
        .checkbox-group label {
            margin: 0;
            color: var(--text-secondary);
            font-size: var(--font-size-sm);
        }
        
        .success-message {
            text-align: center;
            padding: var(--spacing-3xl) var(--spacing-xl);
            background: var(--surface-white);
            border-radius: var(--border-radius-lg);
            box-shadow: var(--shadow-md);
        }
        
        .contact-info {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-2xl);
        }
        
        .contact-section {
            background: var(--surface-white);
            border-radius: var(--border-radius-lg);
            padding: var(--spacing-xl);
            box-shadow: var(--shadow-md);
        }
        
        .contact-section h3 {
            display: flex;
            align-items: center;
            margin-bottom: var(--spacing-lg);
            font-size: var(--font-size-lg);
        }
        
        .contact-section h3 i {
            color: var(--primary-blue);
            margin-right: var(--spacing-sm);
        }
        
        .office-list {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
        }
        
        .office-item h4 {
            margin-bottom: var(--spacing-sm);
            color: var(--text-primary);
        }
        
        .office-item address p {
            margin: 0;
            color: var(--text-secondary);
            line-height: var(--line-height-relaxed);
        }
        
        .contact-details {
            list-style: none;
        }
        
        .contact-details li {
            display: flex;
            align-items: flex-start;
            gap: var(--spacing-md);
            margin-bottom: var(--spacing-lg);
        }
        
        .contact-details li:last-child {
            margin-bottom: 0;
        }
        
        .contact-details i {
            color: var(--primary-blue);
            font-size: 1.25rem;
            min-width: 1.5rem;
            margin-top: 0.125rem;
        }
        
        .contact-details strong {
            display: block;
            color: var(--text-primary);
            margin-bottom: 0.125rem;
        }
        
        .contact-details p {
            margin: 0;
            color: var(--text-secondary);
        }
        
        .business-hours {
            list-style: none;
        }
        
        .business-hours li {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-sm) 0;
            border-bottom: 1px solid var(--border-light);
        }
        
        .business-hours li:last-child {
            border-bottom: none;
        }
        
        .business-hours li span:first-child {
            color: var(--text-primary);
        }
        
        .business-hours li span:last-child {
            color: var(--text-secondary);
            font-weight: 500;
        }
        
        .map-container {
            border-radius: var(--border-radius-md);
            overflow: hidden;
            box-shadow: var(--shadow-md);
        }
        
        .faq-accordion {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .faq-item {
            background: var(--surface-white);
            border-radius: var(--border-radius-lg);
            margin-bottom: var(--spacing-md);
            overflow: hidden;
            box-shadow: var(--shadow-md);
        }
        
        .faq-question {
            width: 100%;
            padding: var(--spacing-lg);
            background: none;
            border: none;
            text-align: left;
            font-size: var(--font-size-lg);
            font-weight: 600;
            color: var(--text-primary);
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background-color var(--transition-fast) ease;
        }
        
        .faq-question:hover {
            background-color: var(--background-dark);
        }
        
        .faq-question i {
            transition: transform var(--transition-fast) ease;
        }
        
        .faq-question[aria-expanded="true"] i {
            transform: rotate(180deg);
        }
        
        .faq-answer {
            padding: 0 var(--spacing-lg);
            max-height: 0;
            overflow: hidden;
            transition: all var(--transition-normal) ease;
        }
        
        .faq-answer p {
            padding-bottom: var(--spacing-lg);
            margin: 0;
            color: var(--text-secondary);
            line-height: var(--line-height-relaxed);
        }
        
        .faq-answer[aria-hidden="false"] {
            max-height: 500px;
        }
        
        .faq-footer {
            text-align: center;
            margin-top: var(--spacing-3xl);
        }
        
        .faq-footer h3 {
            margin-bottom: var(--spacing-lg);
        }
        
        .newsletter-section {
            text-align: center;
            padding: var(--spacing-3xl) var(--spacing-xl);
            max-width: 800px;
            margin: 0 auto;
        }
        
        .newsletter-section h2 {
            margin-bottom: var(--spacing-lg);
        }
        
        .newsletter-section p {
            margin-bottom: var(--spacing-2xl);
            color: var(--text-secondary);
        }
        
        .newsletter-form-large {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
            max-width: 600px;
            margin: 0 auto;
        }
        
        @media (min-width: 768px) {
            .newsletter-form-large {
                flex-direction: row;
            }
        }
        
        .error-message {
            color: var(--error);
            font-size: var(--font-size-sm);
            margin-top: var(--spacing-xs);
            display: none;
        }
        
        .error-message.show {
            display: block;
        }
        
        .form-input.error,
        .form-select.error {
            border-color: var(--error);
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Setup contact form validation and submission
 */
function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const subjectInput = document.getElementById('subject');
    const messageInput = document.getElementById('message');
    const submitButton = form.querySelector('button[type="submit"]');
    const loadingIndicator = submitButton.querySelector('.loading');
    
    // Form validation
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Show loading state
        submitButton.disabled = true;
        loadingIndicator.style.display = 'inline-block';
        
        try {
            // Simulate API call
            await submitFormData();
            
            // Show success message
            showSuccessMessage();
            
        } catch (error) {
            console.error('Error submitting form:', error);
            showErrorMessage();
        } finally {
            // Reset loading state
            submitButton.disabled = false;
            loadingIndicator.style.display = 'none';
        }
    });
    
    // Real-time validation
    [nameInput, emailInput, subjectInput, messageInput].forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

/**
 * Validate entire form
 */
function validateForm() {
    let isValid = true;
    
    // Validate required fields
    const requiredFields = [
        { id: 'name', message: 'Please enter your full name' },
        { id: 'email', message: 'Please enter a valid email address' },
        { id: 'subject', message: 'Please select a subject' },
        { id: 'message', message: 'Please enter your message' }
    ];
    
    requiredFields.forEach(field => {
        const input = document.getElementById(field.id);
        const errorElement = input.parentElement.querySelector('.error-message') || createErrorElement(input);
        
        if (!input.value.trim()) {
            showFieldError(input, errorElement, field.message);
            isValid = false;
        } else if (field.id === 'email' && !isValidEmail(input.value)) {
            showFieldError(input, errorElement, 'Please enter a valid email address');
            isValid = false;
        } else {
            clearFieldError({ target: input });
        }
    });
    
    return isValid;
}

/**
 * Validate individual field
 */
function validateField(e) {
    const input = e.target;
    const errorElement = input.parentElement.querySelector('.error-message') || createErrorElement(input);
    
    if (!input.value.trim() && input.required) {
        showFieldError(input, errorElement, 'This field is required');
        return false;
    }
    
    if (input.type === 'email' && input.value.trim() && !isValidEmail(input.value)) {
        showFieldError(input, errorElement, 'Please enter a valid email address');
        return false;
    }
    
    clearFieldError(e);
    return true;
}

/**
 * Clear field error
 */
function clearFieldError(e) {
    const input = e.target;
    const errorElement = input.parentElement.querySelector('.error-message');
    
    if (errorElement) {
        errorElement.classList.remove('show');
    }
    
    input.classList.remove('error');
}

/**
 * Show field error
 */
function showFieldError(input, errorElement, message) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
    input.classList.add('error');
}

/**
 * Create error element for a field
 */
function createErrorElement(input) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    input.parentElement.appendChild(errorElement);
    return errorElement;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Submit form data (simulated)
 */
async function submitFormData() {
    // In a real implementation, this would send data to a server
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate random success/failure
            if (Math.random() > 0.1) { // 90% success rate for demo
                resolve();
            } else {
                reject(new Error('Server error'));
            }
        }, 1500);
    });
}

/**
 * Show success message
 */
function showSuccessMessage() {
    const formContainer = document.querySelector('.contact-form-container');
    const form = document.getElementById('contactForm');
    const successDiv = document.getElementById('formSuccess');
    
    if (!formContainer || !successDiv) return;
    
    // Generate reference number
    const referenceNumber = `PT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    document.getElementById('referenceNumber').textContent = referenceNumber;
    
    // Hide form, show success
    form.style.display = 'none';
    successDiv.style.display = 'block';
    
    // Scroll to success message
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Show error message
 */
function showErrorMessage() {
    // Show error message to user
    alert('Sorry, there was an error submitting your message. Please try again.');
}

/**
 * Reset form after success
 */
function resetForm() {
    const form = document.getElementById('contactForm');
    const successDiv = document.getElementById('formSuccess');
    
    if (!form || !successDiv) return;
    
    // Reset form
    form.reset();
    form.style.display = 'block';
    successDiv.style.display = 'none';
    
    // Clear any error messages
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
    });
    document.querySelectorAll('.error').forEach(el => {
        el.classList.remove('error');
    });
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Setup FAQ accordion
 */
function setupFAQAccordion() {
    const accordion = document.getElementById('faqAccordion');
    if (!accordion) return;
    
    const questions = accordion.querySelectorAll('.faq-question');
    
    questions.forEach(question => {
        question.addEventListener('click', () => {
            const isExpanded = question.getAttribute('aria-expanded') === 'true';
            const answer = question.nextElementSibling;
            
            // Close all other items
            questions.forEach(q => {
                if (q !== question) {
                    q.setAttribute('aria-expanded', 'false');
                    q.nextElementSibling.setAttribute('aria-hidden', 'true');
                }
            });
            
            // Toggle current item
            question.setAttribute('aria-expanded', !isExpanded);
            answer.setAttribute('aria-hidden', isExpanded);
        });
    });
}

/**
 * Setup newsletter form
 */
function setupNewsletterForm() {
    const newsletterForm = document.getElementById('newsletterFormLarge');
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const emailInput = this.querySelector('input[type="email"]');
        const email = emailInput.value.trim();
        
        if (!isValidEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Simulate subscription
        console.log(`Subscribing email: ${email}`);
        
        // Show success message
        alert('Thank you for subscribing to our newsletter!');
        
        // Reset form
        this.reset();
    });
}

// Make functions available globally for onclick handlers
window.resetForm = resetForm;