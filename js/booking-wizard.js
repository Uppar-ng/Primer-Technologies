// booking-wizard.js - Clean Booking Wizard with Formspree Integration

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing booking wizard...');
    
    // Initialize everything
    initBookingWizard();
});

// Formspree Configuration - REPLACE WITH YOUR FORM ID
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID_HERE';
const FORMSPREE_SUBMIT_BUTTON = 'Submit Booking';

// Booking State
const bookingState = {
    currentStep: 1,
    selectedService: null,
    serviceDetails: {},
    selectedAddons: [],
    selectedDate: null,
    selectedTime: null,
    contactInfo: {},
    totalPrice: 0,
    bookingReference: generateBookingReference()
};

// Services Data
const services = [
    {
        id: 'listing',
        name: 'Property Listing',
        description: 'Professional property listing and marketing services',
        icon: 'fas fa-home',
        duration: 'Varies',
        basePrice: 0,
        features: [
            'Professional photography',
            'Virtual tour creation',
            'Marketing across platforms',
            'Open house organization'
        ],
        questions: [
            {
                id: 'propertyType',
                type: 'select',
                label: 'Property Type',
                required: true,
                options: [
                    { value: 'house', label: 'House' },
                    { value: 'apartment', label: 'Apartment' },
                    { value: 'commercial', label: 'Commercial' },
                    { value: 'land', label: 'Land' },
                    { value: 'other', label: 'Other' }
                ]
            },
            {
                id: 'bedrooms',
                type: 'number',
                label: 'Number of Bedrooms',
                required: true,
                min: 0,
                max: 20,
                placeholder: 'e.g., 3'
            },
            {
                id: 'bathrooms',
                type: 'number',
                label: 'Number of Bathrooms',
                required: true,
                min: 1,
                max: 20,
                placeholder: 'e.g., 2'
            },
            {
                id: 'squareFootage',
                type: 'number',
                label: 'Square Footage',
                required: false,
                placeholder: 'Approximate size in sq ft'
            }
        ]
    },
    {
        id: 'maintenance',
        name: 'Property Maintenance',
        description: 'Complete property maintenance and repair services',
        icon: 'fas fa-tools',
        duration: 'Ongoing',
        basePrice: 0,
        features: [
            'Regular inspections',
            'Emergency repairs',
            'Preventive maintenance',
            '24/7 support'
        ],
        questions: [
            {
                id: 'maintenanceType',
                type: 'select',
                label: 'Maintenance Type',
                required: true,
                options: [
                    { value: 'regular', label: 'Regular Maintenance' },
                    { value: 'emergency', label: 'Emergency Repair' },
                    { value: 'seasonal', label: 'Seasonal Service' },
                    { value: 'inspection', label: 'Property Inspection' }
                ]
            },
            {
                id: 'frequency',
                type: 'select',
                label: 'Service Frequency',
                required: true,
                options: [
                    { value: 'one_time', label: 'One-time Service' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'biweekly', label: 'Bi-weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'annually', label: 'Annually' }
                ]
            }
        ]
    },
    {
        id: 'logistics',
        name: 'Moving & Logistics',
        description: 'Professional moving and logistics services',
        icon: 'fas fa-truck-moving',
        duration: 'One-time',
        basePrice: 0,
        features: [
            'Packing & unpacking',
            'Loading & unloading',
            'Transportation',
            'Storage solutions'
        ],
        questions: [
            {
                id: 'vehicleType',
                type: 'select',
                label: 'Vehicle Type Needed',
                required: true,
                options: [
                    { value: 'small_van', label: 'Small Van (1-2 rooms)' },
                    { value: 'medium_truck', label: 'Medium Truck (2-3 rooms)' },
                    { value: 'large_truck', label: 'Large Truck (3-4 rooms)' },
                    { value: 'extra_large', label: 'Extra Large Truck (4+ rooms)' }
                ]
            },
            {
                id: 'rooms',
                type: 'number',
                label: 'Number of Rooms',
                required: true,
                min: 1,
                max: 20,
                placeholder: 'Total number of rooms to move'
            }
        ]
    },
    {
        id: 'handyman',
        name: 'Handyman Services',
        description: 'Expert handyman and repair services',
        icon: 'fas fa-hammer',
        duration: 'As needed',
        basePrice: 0,
        features: [
            'Minor repairs',
            'Installations',
            'Furniture assembly',
            'Custom projects'
        ],
        questions: [
            {
                id: 'serviceCategory',
                type: 'select',
                label: 'Service Category',
                required: true,
                options: [
                    { value: 'electrical', label: 'Electrical Work' },
                    { value: 'plumbing', label: 'Plumbing' },
                    { value: 'carpentry', label: 'Carpentry' },
                    { value: 'painting', label: 'Painting' },
                    { value: 'drywall', label: 'Drywall Repair' },
                    { value: 'assembly', label: 'Furniture Assembly' }
                ]
            },
            {
                id: 'taskDescription',
                type: 'textarea',
                label: 'Task Description',
                required: true,
                placeholder: 'Please describe the work needed...',
                rows: 3
            }
        ]
    }
];

// Addons Data (simplified)
const addons = {
    listing: [
        { id: 'virtual_staging', name: 'Virtual Staging', description: 'Digitally furnished photos', price: 0 },
        { id: 'drone_photos', name: 'Drone Photography', description: 'Aerial property shots', price: 0 }
    ],
    maintenance: [
        { id: 'gutter_clean', name: 'Gutter Cleaning', description: 'Complete gutter cleaning', price: 0 },
        { id: 'hvac_service', name: 'HVAC Service', description: 'HVAC maintenance', price: 0 }
    ],
    logistics: [
        { id: 'packing', name: 'Packing Service', description: 'Professional packing', price: 0 },
        { id: 'storage', name: 'Storage Unit', description: 'Secure storage rental', price: 0 }
    ],
    handyman: [
        { id: 'emergency', name: 'Emergency Service', description: 'Priority same-day service', price: 0 },
        { id: 'warranty', name: 'Warranty Extension', description: 'Extended warranty', price: 0 }
    ]
};

// Utility Functions
function generateBookingReference() {
    const prefix = 'PRIMER';
    const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}-${randomNum}`;
}

function formatCurrency(amount) {
    return 'Price upon request';
}

function formatDate(dateString) {
    if (!dateString) return 'Not selected';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Main Initialization
function initBookingWizard() {
    console.log('Initializing booking wizard...');
    
    try {
        // Step 1: Service Selection
        initServiceSelection();
        
        // Step 2: Navigation
        initStepNavigation();
        
        // Step 3: Calendar
        initCalendar();
        
        // Step 4: Time Slots
        initTimeSlots();
        
        // Step 5: Contact Form
        initContactForm();
        
        // Step 6: Terms and Submission
        initTermsAndSubmission();
        
        // Success Actions
        initSuccessActions();
        
        console.log('Booking wizard initialized successfully');
    } catch (error) {
        console.error('Error initializing booking wizard:', error);
        showError('Failed to initialize booking wizard. Please refresh the page.');
    }
}

// STEP 1: Service Selection
function initServiceSelection() {
    console.log('Initializing service selection...');
    
    const serviceCards = document.querySelectorAll('.service-card');
    const nextButton = document.getElementById('nextStep1');
    
    if (!serviceCards.length) {
        console.error('No service cards found');
        return;
    }
    
    // Clear any existing event listeners by cloning and replacing
    serviceCards.forEach(card => {
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
    });
    
    // Get fresh references
    const freshServiceCards = document.querySelectorAll('.service-card');
    
    freshServiceCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.stopPropagation();
            
            console.log('Service card clicked:', this.dataset.service);
            
            // Remove selected class from all cards
            freshServiceCards.forEach(c => {
                c.classList.remove('selected');
            });
            
            // Add selected class to clicked card
            this.classList.add('selected');
            
            // Get service ID and find service
            const serviceId = this.dataset.service;
            const selectedService = services.find(s => s.id === serviceId);
            
            if (selectedService) {
                bookingState.selectedService = selectedService;
                nextButton.disabled = false;
                
                console.log(`Service selected: ${selectedService.name}`);
            }
        });
    });
    
    // Next button
    if (nextButton) {
        nextButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!bookingState.selectedService) {
                alert('Please select a service');
                return;
            }
            
            console.log('Moving to step 2...');
            loadServiceQuestions();
            goToStep(2);
        });
    }
    
    // Initialize with no service selected
    nextButton.disabled = true;
}

// Load Service Questions for Step 2
function loadServiceQuestions() {
    console.log('Loading service questions...');
    
    const container = document.getElementById('serviceDetailsContainer');
    const service = bookingState.selectedService;
    
    if (!service || !service.questions) {
        container.innerHTML = '<p>No questions available for this service.</p>';
        return;
    }
    
    let html = '';
    
    service.questions.forEach(question => {
        html += `<div class="form-group" data-question="${question.id}">`;
        html += `<label class="form-label">${question.label}${question.required ? ' <span class="required-star">*</span>' : ''}</label>`;
        
        switch(question.type) {
            case 'select':
                html += `<select class="form-select" id="${question.id}" name="${question.id}" ${question.required ? 'required' : ''}>`;
                html += `<option value="">Select...</option>`;
                question.options.forEach(option => {
                    html += `<option value="${option.value}">${option.label}</option>`;
                });
                html += `</select>`;
                break;
                
            case 'number':
                html += `<input type="number" class="form-input" id="${question.id}" name="${question.id}" 
                    ${question.required ? 'required' : ''}
                    ${question.min ? `min="${question.min}"` : ''}
                    ${question.max ? `max="${question.max}"` : ''}
                    placeholder="${question.placeholder || ''}">`;
                break;
                
            case 'textarea':
                html += `<textarea class="form-textarea" id="${question.id}" name="${question.id}" 
                    rows="${question.rows || 3}"
                    ${question.required ? 'required' : ''}
                    placeholder="${question.placeholder || ''}"></textarea>`;
                break;
                
            default:
                html += `<input type="text" class="form-input" id="${question.id}" name="${question.id}"
                    ${question.required ? 'required' : ''}
                    placeholder="${question.placeholder || ''}">`;
        }
        
        html += `</div>`;
    });
    
    container.innerHTML = html;
    
    // Initialize validation
    initStep2Validation();
}

// Step 2 Validation
function initStep2Validation() {
    const nextButton = document.getElementById('nextStep2');
    const formInputs = document.querySelectorAll('#serviceDetailsContainer input, #serviceDetailsContainer select, #serviceDetailsContainer textarea');
    
    if (!nextButton || !formInputs.length) return;
    
    // Validate on input
    formInputs.forEach(input => {
        input.addEventListener('input', validateStep2);
        input.addEventListener('change', validateStep2);
    });
    
    // Initial validation
    validateStep2();
    
    // Next button
    nextButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (validateStep2()) {
            saveServiceDetails();
            loadAddons();
            goToStep(3);
        } else {
            alert('Please fill in all required fields');
        }
    });
    
    // Back button
    const backButton = document.getElementById('prevStep2');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            goToStep(1);
        });
    }
}

function validateStep2() {
    const nextButton = document.getElementById('nextStep2');
    const service = bookingState.selectedService;
    
    if (!service || !service.questions) {
        if (nextButton) nextButton.disabled = true;
        return false;
    }
    
    let isValid = true;
    
    // Check each required question
    service.questions.forEach(question => {
        if (question.required) {
            const input = document.getElementById(question.id);
            if (input) {
                const value = input.value.trim();
                if (!value) {
                    isValid = false;
                    input.classList.add('error');
                } else {
                    input.classList.remove('error');
                }
            } else {
                isValid = false;
            }
        }
    });
    
    if (nextButton) {
        nextButton.disabled = !isValid;
    }
    
    return isValid;
}

function saveServiceDetails() {
    bookingState.serviceDetails = {};
    const service = bookingState.selectedService;
    
    if (service && service.questions) {
        service.questions.forEach(question => {
            const input = document.getElementById(question.id);
            if (input) {
                bookingState.serviceDetails[question.id] = input.value;
            }
        });
    }
    
    console.log('Service details saved:', bookingState.serviceDetails);
}

// STEP 3: Add-ons
function loadAddons() {
    console.log('Loading add-ons...');
    
    const container = document.getElementById('addonsGrid');
    const serviceId = bookingState.selectedService.id;
    const serviceAddons = addons[serviceId] || [];
    
    if (!serviceAddons.length) {
        container.innerHTML = '<p>No add-ons available for this service.</p>';
        return;
    }
    
    let html = '';
    
    serviceAddons.forEach(addon => {
        html += `
            <div class="addon-option" data-addon-id="${addon.id}">
                <div class="addon-checkbox"></div>
                <div class="addon-content">
                    <div class="addon-header">
                        <h4 class="addon-name">${addon.name}</h4>
                    </div>
                    <p class="addon-description">${addon.description}</p>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Initialize addon selection
    initAddonSelection();
}

function initAddonSelection() {
    const addonOptions = document.querySelectorAll('.addon-option');
    
    addonOptions.forEach(option => {
        option.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });
    
    // Next button
    const nextButton = document.getElementById('nextStep3');
    if (nextButton) {
        nextButton.addEventListener('click', function(e) {
            e.preventDefault();
            saveSelectedAddons();
            goToStep(4);
        });
    }
    
    // Back button
    const backButton = document.getElementById('prevStep3');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            goToStep(2);
        });
    }
}

function saveSelectedAddons() {
    const selectedAddons = [];
    const serviceId = bookingState.selectedService.id;
    const serviceAddons = addons[serviceId] || [];
    
    document.querySelectorAll('.addon-option.selected').forEach(option => {
        const addonId = option.dataset.addonId;
        const addon = serviceAddons.find(a => a.id === addonId);
        if (addon) {
            selectedAddons.push(addon);
        }
    });
    
    bookingState.selectedAddons = selectedAddons;
    console.log('Addons saved:', bookingState.selectedAddons);
}

// STEP 4: Date & Time
let currentCalendarDate = new Date();

function initCalendar() {
    console.log('Initializing calendar...');
    
    renderCalendar();
    
    // Month navigation
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', function(e) {
            e.preventDefault();
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', function(e) {
            e.preventDefault();
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendar();
        });
    }
    
    // Next button
    const nextButton = document.getElementById('nextStep4');
    if (nextButton) {
        nextButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!bookingState.selectedDate || !bookingState.selectedTime) {
                alert('Please select both date and time');
                return;
            }
            
            goToStep(5);
        });
    }
    
    // Back button
    const backButton = document.getElementById('prevStep4');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            goToStep(3);
        });
    }
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    // Clear calendar
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });
    
    // Get month info
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    // Add empty cells for days before first day
    for (let i = 0; i < startingDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-date other-month';
        calendarGrid.appendChild(emptyCell);
    }
    
    // Add days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        const dateElement = document.createElement('div');
        dateElement.className = 'calendar-date';
        dateElement.textContent = day;
        dateElement.dataset.date = date.toISOString().split('T')[0];
        
        // Disable past dates
        if (date < today) {
            dateElement.classList.add('disabled');
        } else {
            dateElement.addEventListener('click', function() {
                // Remove selected from all dates
                document.querySelectorAll('.calendar-date').forEach(d => {
                    d.classList.remove('selected');
                });
                
                // Select this date
                this.classList.add('selected');
                bookingState.selectedDate = this.dataset.date;
                
                // Update display
                const display = document.getElementById('selectedDateDisplay');
                if (display) {
                    display.textContent = `Selected: ${formatDate(bookingState.selectedDate)}`;
                }
                
                validateDateTime();
            });
        }
        
        // Mark as selected if matches saved date
        if (bookingState.selectedDate === dateElement.dataset.date) {
            dateElement.classList.add('selected');
        }
        
        calendarGrid.appendChild(dateElement);
    }
    
    // Update month display
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const monthYearDisplay = document.querySelector('.calendar-header h3');
    if (monthYearDisplay) {
        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
    }
}

function initTimeSlots() {
    console.log('Initializing time slots...');
    
    const timeSlotsContainer = document.getElementById('timeSlots');
    if (!timeSlotsContainer) return;
    
    const timeSlots = [
        '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
        '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
        '04:00 PM', '05:00 PM'
    ];
    
    timeSlotsContainer.innerHTML = '';
    
    timeSlots.forEach(slot => {
        const slotElement = document.createElement('div');
        slotElement.className = 'time-slot';
        slotElement.textContent = slot;
        slotElement.dataset.time = slot;
        
        slotElement.addEventListener('click', function() {
            // Remove selected from all slots
            document.querySelectorAll('.time-slot').forEach(s => {
                s.classList.remove('selected');
            });
            
            // Select this slot
            this.classList.add('selected');
            bookingState.selectedTime = this.dataset.time;
            
            validateDateTime();
        });
        
        // Mark as selected if matches saved time
        if (bookingState.selectedTime === slot) {
            slotElement.classList.add('selected');
        }
        
        timeSlotsContainer.appendChild(slotElement);
    });
}

function validateDateTime() {
    const nextButton = document.getElementById('nextStep4');
    if (nextButton) {
        const isValid = !!(bookingState.selectedDate && bookingState.selectedTime);
        nextButton.disabled = !isValid;
        return isValid;
    }
    return false;
}

// STEP 5: Contact Information
function initContactForm() {
    console.log('Initializing contact form...');
    
    const nextButton = document.getElementById('nextStep5');
    if (!nextButton) return;
    
    // Validate on input
    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', validateContactForm);
            field.addEventListener('change', validateContactForm);
        }
    });
    
    // Initial validation
    validateContactForm();
    
    // Next button
    nextButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (validateContactForm()) {
            saveContactInfo();
            loadBookingSummary();
            goToStep(6);
        } else {
            alert('Please fill in all required fields correctly');
        }
    });
    
    // Back button
    const backButton = document.getElementById('prevStep5');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            goToStep(4);
        });
    }
}

function validateContactForm() {
    const nextButton = document.getElementById('nextStep5');
    if (!nextButton) return false;
    
    let isValid = true;
    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    
    // Clear previous errors
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('.form-input.error, .form-select.error').forEach(el => {
        el.classList.remove('error');
    });
    
    // Check each required field
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        const value = field.value.trim();
        
        if (!value) {
            isValid = false;
            field.classList.add('error');
            showFieldError(field, 'This field is required');
        } else if (fieldId === 'email' && !isValidEmail(value)) {
            isValid = false;
            field.classList.add('error');
            showFieldError(field, 'Please enter a valid email address');
        } else if (fieldId === 'phone' && !isValidPhone(value)) {
            isValid = false;
            field.classList.add('error');
            showFieldError(field, 'Please enter a valid phone number');
        }
    });
    
    nextButton.disabled = !isValid;
    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    // Remove non-digits and check length
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10;
}

function showFieldError(field, message) {
    // Remove existing error
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
    
    // Add new error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    field.parentNode.appendChild(errorDiv);
}

function saveContactInfo() {
    bookingState.contactInfo = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        zipCode: document.getElementById('zipCode').value,
        specialInstructions: document.getElementById('specialInstructions').value
    };
    
    console.log('Contact info saved:', bookingState.contactInfo);
}

// STEP 6: Review & Summary
function loadBookingSummary() {
    console.log('Loading booking summary...');
    
    const container = document.getElementById('bookingSummary');
    if (!container) return;
    
    // Calculate total price
    bookingState.totalPrice = 0;
    
    let html = '';
    
    // Service Details
    html += `
        <div class="summary-section">
            <div class="summary-header">
                <h4><i class="fas fa-concierge-bell"></i> Service Details</h4>
                <button class="edit-btn" data-step="1">Edit</button>
            </div>
            <div class="summary-content">
                <div class="summary-item">
                    <span class="label">Service:</span>
                    <span class="value">${bookingState.selectedService.name}</span>
                </div>
    `;
    
    // Add service details
    Object.entries(bookingState.serviceDetails).forEach(([key, value]) => {
        if (value) {
            const question = bookingState.selectedService.questions.find(q => q.id === key);
            if (question) {
                html += `
                    <div class="summary-item">
                        <span class="label">${question.label}:</span>
                        <span class="value">${value}</span>
                    </div>
                `;
            }
        }
    });
    
    html += `</div></div>`;
    
    // Add-ons
    if (bookingState.selectedAddons.length > 0) {
        html += `
            <div class="summary-section">
                <div class="summary-header">
                    <h4><i class="fas fa-plus-circle"></i> Add-ons</h4>
                    <button class="edit-btn" data-step="3">Edit</button>
                </div>
                <div class="summary-content">
        `;
        
        bookingState.selectedAddons.forEach(addon => {
            html += `
                <div class="summary-item">
                    <span class="label">${addon.name}:</span>
                    <span class="value">${addon.description}</span>
                </div>
            `;
        });
        
        html += `</div></div>`;
    }
    
    // Date & Time
    html += `
        <div class="summary-section">
            <div class="summary-header">
                <h4><i class="fas fa-calendar-alt"></i> Schedule</h4>
                <button class="edit-btn" data-step="4">Edit</button>
            </div>
            <div class="summary-content">
                <div class="summary-item">
                    <span class="label">Date:</span>
                    <span class="value">${formatDate(bookingState.selectedDate)}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Time:</span>
                    <span class="value">${bookingState.selectedTime}</span>
                </div>
            </div>
        </div>
    `;
    
    // Contact Info
    html += `
        <div class="summary-section">
            <div class="summary-header">
                <h4><i class="fas fa-user"></i> Contact Information</h4>
                <button class="edit-btn" data-step="5">Edit</button>
            </div>
            <div class="summary-content">
                <div class="summary-item">
                    <span class="label">Name:</span>
                    <span class="value">${bookingState.contactInfo.fullName}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Email:</span>
                    <span class="value">${bookingState.contactInfo.email}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Phone:</span>
                    <span class="value">${bookingState.contactInfo.phone}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Address:</span>
                    <span class="value">${bookingState.contactInfo.address}, ${bookingState.contactInfo.city}, ${bookingState.contactInfo.state} ${bookingState.contactInfo.zipCode}</span>
                </div>
            </div>
        </div>
    `;
    
    // Total Price
    html += `
        <div class="summary-section">
            <div class="summary-header">
                <h4><i class="fas fa-receipt"></i> Pricing</h4>
            </div>
            <div class="summary-content">
                <div class="summary-item total">
                    <span class="label">Pricing:</span>
                    <span class="summary-price">Price upon request</span>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Add edit button functionality
    initEditButtons();
}

function initEditButtons() {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const step = parseInt(this.dataset.step);
            goToStep(step);
        });
    });
}

// Terms and Submission
function initTermsAndSubmission() {
    console.log('Initializing terms and submission...');
    
    const termsCheckbox = document.getElementById('termsAgreement');
    const confirmButton = document.getElementById('confirmBooking');
    
    if (!termsCheckbox || !confirmButton) return;
    
    // Terms checkbox
    termsCheckbox.addEventListener('change', function() {
        confirmButton.disabled = !this.checked;
    });
    
    // Confirm booking
    confirmButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (!termsCheckbox.checked) {
            alert('Please agree to the terms and conditions');
            return;
        }
        
        submitBooking();
    });
    
    // Back button
    const backButton = document.getElementById('prevStep6');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            goToStep(5);
        });
    }
}

// Formspree Submission
async function submitBooking() {
    const confirmButton = document.getElementById('confirmBooking');
    const originalText = confirmButton.innerHTML;
    
    try {
        // Show loading
        confirmButton.disabled = true;
        confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Prepare form data
        const formData = new FormData();
        
        // Basic booking info
        formData.append('_subject', `New Booking: ${bookingState.bookingReference}`);
        formData.append('booking_reference', bookingState.bookingReference);
        formData.append('service_type', bookingState.selectedService.name);
        formData.append('service_id', bookingState.selectedService.id);
        
        // Service details
        Object.entries(bookingState.serviceDetails).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        // Add-ons
        bookingState.selectedAddons.forEach((addon, index) => {
            formData.append(`addon_${index + 1}`, `${addon.name} - ${addon.description}`);
        });
        
        // Schedule
        formData.append('date', bookingState.selectedDate);
        formData.append('time', bookingState.selectedTime);
        
        // Contact info
        Object.entries(bookingState.contactInfo).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        // Price
        formData.append('pricing', 'Price upon request');
        
        // Metadata
        formData.append('_replyto', bookingState.contactInfo.email);
        formData.append('submission_date', new Date().toISOString());
        
        // Send to Formspree
        const response = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            showSuccessScreen();
        } else {
            throw new Error('Form submission failed');
        }
        
    } catch (error) {
        console.error('Submission error:', error);
        alert('There was an error submitting your booking. Please try again.');
        
        // Reset button
        confirmButton.disabled = false;
        confirmButton.innerHTML = originalText;
    }
}

// Success Screen
function showSuccessScreen() {
    console.log('Showing success screen...');
    
    // Update booking reference
    document.getElementById('bookingReference').textContent = bookingState.bookingReference;
    
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show success screen
    const successScreen = document.getElementById('successScreen');
    if (successScreen) {
        successScreen.classList.add('active');
    }
    
    // Update progress to 100%
    updateProgressBar(100);
}

function initSuccessActions() {
    // New booking button
    const newBookingBtn = document.getElementById('newBooking');
    if (newBookingBtn) {
        newBookingBtn.addEventListener('click', resetWizard);
    }
}

function resetWizard() {
    console.log('Resetting wizard...');
    
    // Reset booking state
    Object.keys(bookingState).forEach(key => {
        if (key === 'bookingReference') {
            bookingState[key] = generateBookingReference();
        } else if (Array.isArray(bookingState[key])) {
            bookingState[key] = [];
        } else if (typeof bookingState[key] === 'object') {
            bookingState[key] = {};
        } else {
            bookingState[key] = null;
        }
    });
    
    bookingState.currentStep = 1;
    
    // Reset form fields
    document.getElementById('fullName').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('address').value = '';
    document.getElementById('city').value = '';
    document.getElementById('state').value = '';
    document.getElementById('zipCode').value = '';
    document.getElementById('specialInstructions').value = '';
    document.getElementById('termsAgreement').checked = false;
    
    // Reset UI
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    document.querySelectorAll('.wizard-step').forEach(step => {
        step.classList.remove('active');
    });
    
    document.getElementById('step1').classList.add('active');
    document.getElementById('successScreen').classList.remove('active');
    
    // Reset progress
    updateProgressBar();
    
    // Reset buttons
    document.getElementById('nextStep1').disabled = true;
    document.getElementById('confirmBooking').disabled = true;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Step Navigation
function initStepNavigation() {
    console.log('Initializing step navigation...');
    
    // Cancel booking
    const cancelBtn = document.getElementById('cancelBooking');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Are you sure you want to cancel? All data will be lost.')) {
                window.location.href = 'index.html';
            }
        });
    }
    
    // Update progress bar initially
    updateProgressBar();
}

function goToStep(stepNumber) {
    console.log(`Going to step ${stepNumber}`);
    
    // Validate step number
    if (stepNumber < 1 || stepNumber > 6) {
        console.error('Invalid step number:', stepNumber);
        return;
    }
    
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show target step
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
        bookingState.currentStep = stepNumber;
        
        // Update progress bar
        updateProgressBar();
        
        // Smooth scroll to step
        setTimeout(() => {
            targetStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } else {
        console.error(`Step ${stepNumber} not found`);
    }
}

function updateProgressBar(percentage = null) {
    const progressLine = document.getElementById('progressLine');
    if (!progressLine) return;
    
    // Calculate percentage if not provided
    let progressPercent;
    if (percentage !== null) {
        progressPercent = percentage;
    } else {
        progressPercent = ((bookingState.currentStep - 1) / 5) * 100;
    }
    
    progressLine.style.width = `${progressPercent}%`;
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        const stepNumber = index + 1;
        
        step.classList.remove('active', 'completed');
        
        if (stepNumber < bookingState.currentStep) {
            step.classList.add('completed');
        } else if (stepNumber === bookingState.currentStep) {
            step.classList.add('active');
        }
    });
}

// Error Handling
function showError(message) {
    console.error('Booking Wizard Error:', message);
    
    // Create error display if it doesn't exist
    let errorDiv = document.getElementById('bookingWizardError');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'bookingWizardError';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Make sure no service is auto-selected
window.addEventListener('load', function() {
    console.log('Page loaded, ensuring no auto-selection...');
    
    // Clear any auto-selected service
    document.querySelectorAll('.service-card.selected').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Disable next button
    const nextButton = document.getElementById('nextStep1');
    if (nextButton) {
        nextButton.disabled = true;
    }
    
    // Ensure step 1 is active
    goToStep(1);
});

// Export for debugging
window.bookingState = bookingState;
window.goToStep = goToStep;