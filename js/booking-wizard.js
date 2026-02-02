// booking-wizard.js - Works with existing HTML structure
document.addEventListener('DOMContentLoaded', function() {
    // ================
    // GLOBAL VARIABLES
    // ================
    let bookingData = {
        service: null,
        package: null,
        addons: [],
        datetime: {
            date: null,
            time: null
        },
        contact: {
            fullName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            specialInstructions: ''
        },
        totalPrice: 0,
        bookingId: generateBookingId()
    };

    const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID'; // Replace with your Formspree form ID
    
    // ================
    // SERVICE SELECTION (STEP 1)
    // ================
    const serviceCards = document.querySelectorAll('.service-card');
    const nextStep1Btn = document.getElementById('nextStep1');
    
    // Service packages data - Using your existing service types
    const servicePackages = {
        listing: [
            {
                id: 'listing_basic',
                name: 'Basic Listing',
                price: 299,
                period: 'one-time',
                features: [
                    'Property listing on website',
                    'Basic photography',
                    '30-day listing',
                    'Contact form'
                ]
            },
            {
                id: 'listing_standard',
                name: 'Standard Listing',
                price: 499,
                period: 'one-time',
                features: [
                    'Everything in Basic plus:',
                    'Professional photography',
                    'Virtual tour',
                    '90-day listing',
                    'Featured placement'
                ],
                popular: true
            },
            {
                id: 'listing_premium',
                name: 'Premium Listing',
                price: 799,
                period: 'one-time',
                features: [
                    'Everything in Standard plus:',
                    'Video walkthrough',
                    'Open house organization',
                    'Dedicated agent',
                    'Cross-platform syndication'
                ]
            }
        ],
        maintenance: [
            {
                id: 'maintenance_basic',
                name: 'Basic Maintenance',
                price: 149,
                period: 'per month',
                features: [
                    'Monthly inspection',
                    'Basic repairs',
                    'Cleaning services',
                    'Emergency contact'
                ]
            },
            {
                id: 'maintenance_standard',
                name: 'Standard Maintenance',
                price: 249,
                period: 'per month',
                features: [
                    'Everything in Basic plus:',
                    'Bi-weekly inspection',
                    'Advanced repairs',
                    'Professional cleaning',
                    'Landscaping'
                ],
                popular: true
            },
            {
                id: 'maintenance_premium',
                name: 'Premium Maintenance',
                price: 399,
                period: 'per month',
                features: [
                    'Everything in Standard plus:',
                    'Weekly inspection',
                    'All repairs covered',
                    '24/7 emergency',
                    'Smart home monitoring'
                ]
            }
        ],
        logistics: [
            {
                id: 'logistics_basic',
                name: 'Local Move',
                price: 499,
                period: 'one-time',
                features: [
                    'Local transportation',
                    '2 movers (4 hours)',
                    'Packing materials',
                    'Loading/unloading'
                ]
            },
            {
                id: 'logistics_standard',
                name: 'Long Distance',
                price: 1299,
                period: 'one-time',
                features: [
                    'Everything in Basic plus:',
                    'Long-distance transport',
                    '3 movers (8 hours)',
                    'Premium packing',
                    'Storage (30 days)'
                ],
                popular: true
            },
            {
                id: 'logistics_premium',
                name: 'Full Service',
                price: 2499,
                period: 'one-time',
                features: [
                    'Everything in Standard plus:',
                    'Full packing/unpacking',
                    '4 movers (12 hours)',
                    'Custom crating',
                    'Setup at destination'
                ]
            }
        ],
        handyman: [
            {
                id: 'handyman_basic',
                name: 'Single Task',
                price: 89,
                period: 'per hour',
                features: [
                    'Basic repairs',
                    'Minor installations',
                    'Furniture assembly',
                    '2-hour minimum'
                ]
            },
            {
                id: 'handyman_standard',
                name: 'Multiple Tasks',
                price: 249,
                period: 'flat rate',
                features: [
                    'Everything in Basic plus:',
                    'Up to 3 tasks',
                    'Half-day service',
                    'Advanced installations',
                    'Next-day scheduling'
                ],
                popular: true
            },
            {
                id: 'handyman_premium',
                name: 'Project Package',
                price: 599,
                period: 'flat rate',
                features: [
                    'Everything in Standard plus:',
                    'Full-day service',
                    'Complete room makeover',
                    'Custom carpentry',
                    'Priority service'
                ]
            }
        ]
    };

    // Service add-ons data
    const serviceAddons = {
        listing: [
            { id: 'virtual_staging', name: 'Virtual Staging', price: 149, description: 'Digitally furnished photos' },
            { id: 'drone_photos', name: 'Drone Photography', price: 199, description: 'Aerial property shots' },
            { id: 'floor_plan', name: '3D Floor Plan', price: 99, description: 'Interactive layout' },
            { id: 'copywriting', name: 'Professional Copy', price: 79, description: 'Compelling description' }
        ],
        maintenance: [
            { id: 'gutter_clean', name: 'Gutter Cleaning', price: 129, description: 'Complete gutter service' },
            { id: 'hvac_service', name: 'HVAC Service', price: 199, description: 'HVAC maintenance' },
            { id: 'pressure_wash', name: 'Pressure Washing', price: 249, description: 'Exterior cleaning' },
            { id: 'window_clean', name: 'Window Cleaning', price: 149, description: 'Interior/exterior windows' }
        ],
        logistics: [
            { id: 'packing', name: 'Packing Service', price: 299, description: 'Complete packing' },
            { id: 'unpacking', name: 'Unpacking Service', price: 299, description: 'Complete unpacking' },
            { id: 'storage_ins', name: 'Storage Insurance', price: 49, description: 'Extended insurance' },
            { id: 'car_transport', name: 'Vehicle Transport', price: 399, description: 'Car transportation' }
        ],
        handyman: [
            { id: 'emergency', name: 'Emergency Service', price: 99, description: 'Priority same-day' },
            { id: 'materials', name: 'Material Purchase', price: 79, description: 'Purchase & delivery' },
            { id: 'cleanup', name: 'Cleanup Service', price: 59, description: 'Post-work cleanup' },
            { id: 'warranty', name: 'Warranty Extension', price: 129, description: '1-year warranty' }
        ]
    };

    // Initialize service selection
    if (serviceCards.length > 0) {
        serviceCards.forEach(card => {
            card.addEventListener('click', function() {
                serviceCards.forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                bookingData.service = this.dataset.service;
                nextStep1Btn.disabled = false;
            });
        });
    }

    // ================
    // PACKAGE SELECTION (STEP 2)
    // ================
    const packageOptionsContainer = document.getElementById('packageOptions');
    const nextStep2Btn = document.getElementById('nextStep2');
    const prevStep2Btn = document.getElementById('prevStep2');

    function loadPackages() {
        if (!bookingData.service || !packageOptionsContainer) return;

        const packages = servicePackages[bookingData.service];
        if (!packages) return;

        packageOptionsContainer.innerHTML = '';

        packages.forEach(pkg => {
            const packageCard = document.createElement('div');
            packageCard.className = 'package-card';
            if (bookingData.package?.id === pkg.id) {
                packageCard.classList.add('selected');
            }
            packageCard.dataset.packageId = pkg.id;

            let featuresHTML = '';
            pkg.features.forEach(feature => {
                featuresHTML += `<li><i class="fas fa-check"></i>${feature}</li>`;
            });

            packageCard.innerHTML = `
                ${pkg.popular ? '<div class="popular-badge">Most Popular</div>' : ''}
                <div class="package-header">
                    <h4 class="package-name">${pkg.name}</h4>
                    <div class="package-price">$${pkg.price}</div>
                    <div class="package-period">${pkg.period}</div>
                </div>
                <div class="package-features">
                    <ul class="feature-list">
                        ${featuresHTML}
                    </ul>
                </div>
            `;

            packageCard.addEventListener('click', function() {
                document.querySelectorAll('.package-card').forEach(card => {
                    card.classList.remove('selected');
                });
                this.classList.add('selected');
                bookingData.package = pkg;
                nextStep2Btn.disabled = false;
            });

            packageOptionsContainer.appendChild(packageCard);
        });
    }

    // ================
    // ADD-ONS SELECTION (STEP 3)
    // ================
    const addonsGrid = document.getElementById('addonsGrid');
    const nextStep3Btn = document.getElementById('nextStep3');
    const prevStep3Btn = document.getElementById('prevStep3');

    function loadAddons() {
        if (!bookingData.service || !addonsGrid) return;

        const addons = serviceAddons[bookingData.service];
        if (!addons) return;

        addonsGrid.innerHTML = '';

        addons.forEach(addon => {
            const addonOption = document.createElement('div');
            addonOption.className = 'addon-option';
            if (bookingData.addons.some(a => a.id === addon.id)) {
                addonOption.classList.add('selected');
            }
            addonOption.dataset.addonId = addon.id;

            addonOption.innerHTML = `
                <div class="addon-checkbox"></div>
                <div class="addon-content">
                    <div class="addon-header">
                        <h4 class="addon-name">${addon.name}</h4>
                        <div class="addon-price">$${addon.price}</div>
                    </div>
                    <p class="addon-description">${addon.description}</p>
                </div>
            `;

            addonOption.addEventListener('click', function() {
                this.classList.toggle('selected');
                
                if (this.classList.contains('selected')) {
                    bookingData.addons.push(addon);
                } else {
                    bookingData.addons = bookingData.addons.filter(a => a.id !== addon.id);
                }
            });

            addonsGrid.appendChild(addonOption);
        });
    }

    // ================
    // DATE & TIME SELECTION (STEP 4)
    // ================
    const calendarGrid = document.getElementById('calendarGrid');
    const timeSlots = document.getElementById('timeSlots');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const selectedDateDisplay = document.getElementById('selectedDateDisplay');
    const nextStep4Btn = document.getElementById('nextStep4');
    const prevStep4Btn = document.getElementById('prevStep4');

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    // Available time slots
    const availableTimes = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

    function renderCalendar() {
        if (!calendarGrid) return;

        calendarGrid.innerHTML = '';

        // Day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            calendarGrid.appendChild(dayElement);
        });

        // Get first day of month
        const firstDay = new Date(currentYear, currentMonth, 1);
        const startingDay = firstDay.getDay();

        // Get last day of month
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Previous month's days
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = 0; i < startingDay; i++) {
            const dateElement = document.createElement('div');
            dateElement.className = 'calendar-date other-month';
            dateElement.textContent = prevMonthLastDay - startingDay + i + 1;
            calendarGrid.appendChild(dateElement);
        }

        // Current month's days
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const dateElement = document.createElement('div');
            dateElement.className = 'calendar-date';
            dateElement.textContent = day;
            dateElement.dataset.date = `${currentYear}-${currentMonth + 1}-${day}`;

            const dateObj = new Date(currentYear, currentMonth, day);
            dateObj.setHours(0, 0, 0, 0);

            // Disable past dates
            if (dateObj < today) {
                dateElement.classList.add('disabled');
            }

            // Mark selected date
            if (bookingData.datetime.date && 
                dateObj.getTime() === new Date(bookingData.datetime.date).getTime()) {
                dateElement.classList.add('selected');
            }

            if (!dateElement.classList.contains('disabled')) {
                dateElement.addEventListener('click', function() {
                    document.querySelectorAll('.calendar-date').forEach(el => {
                        el.classList.remove('selected');
                    });
                    this.classList.add('selected');
                    bookingData.datetime.date = this.dataset.date;
                    
                    const dateObj = new Date(bookingData.datetime.date);
                    selectedDateDisplay.textContent = `Selected: ${dateObj.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}`;
                    
                    validateStep4();
                });
            }

            calendarGrid.appendChild(dateElement);
        }

        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        document.querySelector('.calendar-section h3').textContent = 
            `${monthNames[currentMonth]} ${currentYear}`;
    }

    function renderTimeSlots() {
        if (!timeSlots) return;

        timeSlots.innerHTML = '';

        availableTimes.forEach(time => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = time;

            if (bookingData.datetime.time === time) {
                timeSlot.classList.add('selected');
            }

            timeSlot.addEventListener('click', function() {
                document.querySelectorAll('.time-slot').forEach(el => {
                    el.classList.remove('selected');
                });
                this.classList.add('selected');
                bookingData.datetime.time = time;
                validateStep4();
            });

            timeSlots.appendChild(timeSlot);
        });
    }

    function validateStep4() {
        nextStep4Btn.disabled = !(bookingData.datetime.date && bookingData.datetime.time);
    }

    // Calendar navigation
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', function() {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', function() {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });
    }

    // ================
    // CONTACT INFO (STEP 5)
    // ================
    const nextStep5Btn = document.getElementById('nextStep5');
    const prevStep5Btn = document.getElementById('prevStep5');
    const contactInputs = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];

    function validateContactForm() {
        let isValid = true;
        
        contactInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input && input.required) {
                if (!input.value.trim()) {
                    isValid = false;
                }
            }
        });

        // Email validation
        const emailInput = document.getElementById('email');
        if (emailInput && emailInput.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value)) {
                isValid = false;
            }
        }

        nextStep5Btn.disabled = !isValid;
        return isValid;
    }

    function saveContactInfo() {
        contactInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                bookingData.contact[inputId] = input.value.trim();
            }
        });
        
        const specialInstructions = document.getElementById('specialInstructions');
        if (specialInstructions) {
            bookingData.contact.specialInstructions = specialInstructions.value.trim();
        }
    }

    // Add input event listeners
    contactInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', validateContactForm);
            input.addEventListener('change', validateContactForm);
        }
    });

    // ================
    // REVIEW & CONFIRM (STEP 6)
    // ================
    const bookingSummary = document.getElementById('bookingSummary');
    const confirmBookingBtn = document.getElementById('confirmBooking');
    const prevStep6Btn = document.getElementById('prevStep6');
    const termsAgreement = document.getElementById('termsAgreement');

    function calculateTotal() {
        let total = 0;
        
        if (bookingData.package) {
            total += bookingData.package.price;
        }
        
        bookingData.addons.forEach(addon => {
            total += addon.price;
        });
        
        bookingData.totalPrice = total;
        return total;
    }

    function renderBookingSummary() {
        if (!bookingSummary) return;

        const total = calculateTotal();
        
        bookingSummary.innerHTML = `
            <div class="summary-section">
                <div class="summary-header">
                    <h4><i class="fas fa-concierge-bell"></i> Service Details</h4>
                    <button class="edit-btn" data-step="1">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
                <div class="summary-content">
                    <div class="summary-item">
                        <span>Service Type:</span>
                        <span>${bookingData.service ? bookingData.service.charAt(0).toUpperCase() + bookingData.service.slice(1) : 'Not selected'}</span>
                    </div>
                    <div class="summary-item">
                        <span>Package:</span>
                        <span>${bookingData.package ? `${bookingData.package.name} - $${bookingData.package.price}` : 'Not selected'}</span>
                    </div>
                    ${bookingData.addons.length > 0 ? `
                        <div class="summary-item">
                            <span>Add-ons:</span>
                            <span></span>
                        </div>
                        ${bookingData.addons.map(addon => `
                            <div class="summary-item" style="padding-left: 1.5rem;">
                                <span>• ${addon.name}</span>
                                <span class="summary-price">$${addon.price}</span>
                            </div>
                        `).join('')}
                    ` : ''}
                </div>
            </div>
            
            <div class="summary-section">
                <div class="summary-header">
                    <h4><i class="fas fa-calendar-alt"></i> Schedule</h4>
                    <button class="edit-btn" data-step="4">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
                <div class="summary-content">
                    <div class="summary-item">
                        <span>Date:</span>
                        <span>${bookingData.datetime.date ? new Date(bookingData.datetime.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        }) : 'Not selected'}</span>
                    </div>
                    <div class="summary-item">
                        <span>Time:</span>
                        <span>${bookingData.datetime.time || 'Not selected'}</span>
                    </div>
                </div>
            </div>
            
            <div class="summary-section">
                <div class="summary-header">
                    <h4><i class="fas fa-user"></i> Contact Information</h4>
                    <button class="edit-btn" data-step="5">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
                <div class="summary-content">
                    <div class="summary-item">
                        <span>Name:</span>
                        <span>${bookingData.contact.fullName || 'Not provided'}</span>
                    </div>
                    <div class="summary-item">
                        <span>Email:</span>
                        <span>${bookingData.contact.email || 'Not provided'}</span>
                    </div>
                    <div class="summary-item">
                        <span>Phone:</span>
                        <span>${bookingData.contact.phone || 'Not provided'}</span>
                    </div>
                    <div class="summary-item">
                        <span>Address:</span>
                        <span>${bookingData.contact.address ? `${bookingData.contact.address}, ${bookingData.contact.city}, ${bookingData.contact.state} ${bookingData.contact.zipCode}` : 'Not provided'}</span>
                    </div>
                    ${bookingData.contact.specialInstructions ? `
                        <div class="summary-item">
                            <span>Special Instructions:</span>
                            <span>${bookingData.contact.specialInstructions}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="summary-section">
                <div class="summary-item total">
                    <span>Total Amount:</span>
                    <span class="summary-price">$${total.toFixed(2)}</span>
                </div>
            </div>
        `;

        // Add edit button listeners
        bookingSummary.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const step = parseInt(this.dataset.step);
                goToStep(step);
            });
        });
    }

    // Terms agreement toggle
    if (termsAgreement) {
        termsAgreement.addEventListener('change', function() {
            confirmBookingBtn.disabled = !this.checked;
        });
    }

    // ================
    // SUCCESS SCREEN
    // ================
    const successScreen = document.getElementById('successScreen');
    const bookingReference = document.getElementById('bookingReference');
    const finalBookingDetails = document.getElementById('finalBookingDetails');
    const newBookingBtn = document.getElementById('newBooking');

    function showSuccessScreen() {
        bookingReference.textContent = bookingData.bookingId;
        
        const dateTime = bookingData.datetime.date ? new Date(bookingData.datetime.date) : null;
        finalBookingDetails.innerHTML = `
            <div class="detail-item">
                <span>Service:</span>
                <span>${bookingData.service ? bookingData.service.charAt(0).toUpperCase() + bookingData.service.slice(1) : ''}</span>
            </div>
            <div class="detail-item">
                <span>Package:</span>
                <span>${bookingData.package.name}</span>
            </div>
            <div class="detail-item">
                <span>Date:</span>
                <span>${dateTime ? dateTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }) : ''}</span>
            </div>
            <div class="detail-item">
                <span>Time:</span>
                <span>${bookingData.datetime.time}</span>
            </div>
            <div class="detail-item">
                <span>Total:</span>
                <span>$${bookingData.totalPrice.toFixed(2)}</span>
            </div>
        `;
        
        document.querySelectorAll('.wizard-step').forEach(step => {
            step.classList.remove('active');
        });
        successScreen.classList.add('active');
        
        document.getElementById('progressLine').style.width = '100%';
        updateStepIndicators(7);
    }

    // ================
    // NAVIGATION FUNCTIONS
    // ================
    function goToStep(stepNumber) {
        document.querySelectorAll('.wizard-step').forEach(step => {
            step.classList.remove('active');
        });
        
        const targetStep = document.getElementById(`step${stepNumber}`);
        if (targetStep) {
            targetStep.classList.add('active');
        }
        
        const progressWidth = (stepNumber / 6) * 100;
        document.getElementById('progressLine').style.width = `${progressWidth}%`;
        
        updateStepIndicators(stepNumber);
        
        if (stepNumber === 2 && bookingData.service) {
            loadPackages();
        } else if (stepNumber === 3 && bookingData.service) {
            loadAddons();
        } else if (stepNumber === 4) {
            renderCalendar();
            renderTimeSlots();
        } else if (stepNumber === 6) {
            saveContactInfo();
            renderBookingSummary();
        }
    }

    function updateStepIndicators(currentStep) {
        const steps = document.querySelectorAll('.step');
        steps.forEach(step => {
            step.classList.remove('active', 'completed');
            const stepNum = parseInt(step.dataset.step);
            if (stepNum < currentStep) {
                step.classList.add('completed');
            } else if (stepNum === currentStep) {
                step.classList.add('active');
            }
        });
    }

    // ================
    // FORMSPREE API INTEGRATION
    // ================
    async function submitBookingToFormspree() {
        try {
            const response = await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    _subject: `New Service Booking - ${bookingData.bookingId}`,
                    booking_id: bookingData.bookingId,
                    service_type: bookingData.service,
                    package_name: bookingData.package?.name,
                    package_price: bookingData.package?.price || 0,
                    addons: bookingData.addons.map(a => `${a.name} - $${a.price}`).join(', '),
                    total_price: bookingData.totalPrice,
                    scheduled_date: bookingData.datetime.date,
                    scheduled_time: bookingData.datetime.time,
                    full_name: bookingData.contact.fullName,
                    email: bookingData.contact.email,
                    phone: bookingData.contact.phone,
                    address: `${bookingData.contact.address}, ${bookingData.contact.city}, ${bookingData.contact.state} ${bookingData.contact.zipCode}`,
                    special_instructions: bookingData.contact.specialInstructions,
                    timestamp: new Date().toISOString()
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Error submitting booking:', error);
            return false;
        }
    }

    // ================
    // EVENT LISTENERS
    // ================
    
    // Step navigation
    if (nextStep1Btn) {
        nextStep1Btn.addEventListener('click', () => goToStep(2));
    }

    if (nextStep2Btn) {
        nextStep2Btn.addEventListener('click', () => goToStep(3));
    }

    if (prevStep2Btn) {
        prevStep2Btn.addEventListener('click', () => goToStep(1));
    }

    if (nextStep3Btn) {
        nextStep3Btn.addEventListener('click', () => goToStep(4));
    }

    if (prevStep3Btn) {
        prevStep3Btn.addEventListener('click', () => goToStep(2));
    }

    if (nextStep4Btn) {
        nextStep4Btn.addEventListener('click', () => goToStep(5));
    }

    if (prevStep4Btn) {
        prevStep4Btn.addEventListener('click', () => goToStep(3));
    }

    if (nextStep5Btn) {
        nextStep5Btn.addEventListener('click', () => {
            saveContactInfo();
            goToStep(6);
        });
    }

    if (prevStep5Btn) {
        prevStep5Btn.addEventListener('click', () => goToStep(4));
    }

    if (prevStep6Btn) {
        prevStep6Btn.addEventListener('click', () => goToStep(5));
    }

    // Confirm booking
    if (confirmBookingBtn) {
        confirmBookingBtn.addEventListener('click', async function() {
            if (!this.disabled) {
                const originalText = this.innerHTML;
                this.innerHTML = '<span class="loading"></span> Processing...';
                this.disabled = true;
                
                const success = await submitBookingToFormspree();
                
                if (success) {
                    showSuccessScreen();
                } else {
                    alert('There was an error processing your booking. Please try again.');
                    this.innerHTML = originalText;
                    this.disabled = false;
                }
            }
        });
    }

    // Cancel booking
    const cancelBookingBtn = document.getElementById('cancelBooking');
    if (cancelBookingBtn) {
        cancelBookingBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to cancel this booking?')) {
                window.location.href = 'index.html';
            }
        });
    }

    // New booking
    if (newBookingBtn) {
        newBookingBtn.addEventListener('click', function() {
            // Reset data
            bookingData = {
                service: null,
                package: null,
                addons: [],
                datetime: {
                    date: null,
                    time: null
                },
                contact: {
                    fullName: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    specialInstructions: ''
                },
                totalPrice: 0,
                bookingId: generateBookingId()
            };
            
            // Reset UI
            document.querySelectorAll('.service-card').forEach(card => {
                card.classList.remove('selected');
            });
            nextStep1Btn.disabled = true;
            
            contactInputs.forEach(inputId => {
                const input = document.getElementById(inputId);
                if (input) input.value = '';
            });
            
            const specialInstructions = document.getElementById('specialInstructions');
            if (specialInstructions) specialInstructions.value = '';
            
            if (termsAgreement) termsAgreement.checked = false;
            
            goToStep(1);
        });
    }

    // ================
    // UTILITY FUNCTIONS
    // ================
    function generateBookingId() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PRIMER-${timestamp}${random}`;
    }

    // ================
    // INITIALIZATION
    // ================
    renderCalendar();
    renderTimeSlots();
    validateContactForm();
});