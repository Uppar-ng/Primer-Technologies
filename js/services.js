// js/services.js

class ServicesPage {
    constructor() {
        this.currentService = 'listing';
        this.serviceData = null;
        this.isMobile = false;
        this.initialized = false;
        
        this.init();
    }

    async init() {
        this.detectDevice();
        await this.loadServiceData();
        this.setupEventListeners();
        this.setupServiceNavigation();
        this.handleInitialState();
        this.initialized = true;
        
        if (this.isMobile) {
            this.setupMobileServiceCards();
        }
    }

    detectDevice() {
        this.isMobile = window.innerWidth <= 767;
        
        if (this.isMobile) {
            document.body.classList.add('mobile-view');
        } else {
            document.body.classList.remove('mobile-view');
        }
    }

    async loadServiceData() {
        try {
            // Service data for your 4 services
            this.serviceData = {
                listing: {
                    id: 'listing',
                    title: 'Property Listing Services',
                    icon: 'fa-home',
                    description: 'Maximize your property\'s visibility and value with our comprehensive listing services.',
                    features: [
                        {
                            icon: 'fa-camera',
                            title: 'Professional Photography',
                            description: 'High-quality photos and virtual tours'
                        },
                        {
                            icon: 'fa-bullhorn',
                            title: 'Targeted Marketing',
                            description: 'Strategic advertising across multiple platforms'
                        },
                        {
                            icon: 'fa-chart-line',
                            title: 'Market Analysis',
                            description: 'Comprehensive pricing strategy'
                        }
                    ]
                },
                maintenance: {
                    id: 'maintenance',
                    title: 'Property Maintenance',
                    icon: 'fa-tools',
                    description: 'Keep your property in perfect condition with our maintenance plans.',
                    features: [
                        {
                            icon: 'fa-calendar-check',
                            title: 'Preventive Maintenance',
                            description: 'Scheduled inspections and maintenance'
                        },
                        {
                            icon: 'fa-bolt',
                            title: 'Emergency Repairs',
                            description: '24/7 emergency repair services'
                        },
                        {
                            icon: 'fa-seedling',
                            title: 'Seasonal Services',
                            description: 'Specialized services for each season'
                        }
                    ]
                },
                logistics: {
                    id: 'logistics',
                    title: 'Moving & Logistics Services',
                    icon: 'fa-truck-moving',
                    description: 'Stress-free moving with our complete logistics solutions.',
                    features: [
                        {
                            icon: 'fa-box-open',
                            title: 'Complete Packing',
                            description: 'Professional packing using high-quality materials'
                        },
                        {
                            icon: 'fa-people-carry',
                            title: 'Furniture Handling',
                            description: 'Safe disassembly, transport, and reassembly'
                        },
                        {
                            icon: 'fa-warehouse',
                            title: 'Storage Solutions',
                            description: 'Secure short-term and long-term storage options'
                        }
                    ]
                },
                handyman: {
                    id: 'handyman',
                    title: 'Handyman Services',
                    icon: 'fa-hammer',
                    description: 'Reliable handyman services for all your home repair needs.',
                    features: [
                        {
                            icon: 'fa-wrench',
                            title: 'Home Repairs',
                            description: 'Fixing leaky faucets, repairing drywall'
                        },
                        {
                            icon: 'fa-paint-roller',
                            title: 'Installations',
                            description: 'Installing shelves, curtain rods, appliances'
                        },
                        {
                            icon: 'fa-couch',
                            title: 'Assembly Services',
                            description: 'Professional assembly of furniture'
                        }
                    ]
                }
            };
            
            console.log('Service data loaded:', this.serviceData);
            
        } catch (error) {
            console.error('Error loading service data:', error);
            this.showError('Unable to load service information.');
        }
    }

    setupEventListeners() {
        // Service tabs
        document.querySelectorAll('.service-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const service = e.currentTarget.dataset.service;
                if (service && this.serviceData[service]) {
                    this.switchService(service);
                }
            });
        });

        // Book service buttons
        document.querySelectorAll('[data-service][data-package]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const service = e.currentTarget.dataset.service;
                const packageName = e.currentTarget.dataset.package;
                if (service && this.serviceData[service]) {
                    this.bookService(service, packageName);
                }
            });
        });

        // FAQ toggles
        document.querySelectorAll('.faq-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const faqItem = e.currentTarget.closest('.faq-item');
                if (faqItem) {
                    this.toggleFaq(faqItem);
                }
            });
        });

        // Header scroll effect
        window.addEventListener('scroll', this.handleScroll.bind(this));

        // Window resize
        window.addEventListener('resize', debounce(() => {
            const wasMobile = this.isMobile;
            this.detectDevice();
            
            if (wasMobile !== this.isMobile) {
                if (this.isMobile) {
                    this.setupMobileServiceCards();
                }
            }
        }, 250));
    }

    setupServiceNavigation() {
        // Handle hash in URL
        if (window.location.hash) {
            const serviceId = window.location.hash.substring(1);
            if (this.serviceData && this.serviceData[serviceId]) {
                this.switchService(serviceId);
            }
        }

        // Update active tab based on scroll (desktop only)
        if (!this.isMobile) {
            window.addEventListener('scroll', debounce(() => {
                this.updateActiveTabOnScroll();
            }, 100));
        }
    }

    updateActiveTabOnScroll() {
        if (this.isMobile || !this.initialized) return;

        const serviceSections = document.querySelectorAll('.service-section');
        const tabs = document.querySelectorAll('.service-tab');
        const scrollPosition = window.scrollY + 100;

        let currentService = 'listing';

        serviceSections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentService = section.id;
            }
        });

        if (currentService !== this.currentService) {
            this.currentService = currentService;
            this.updateActiveTab();
        }
    }

    handleInitialState() {
        if (!this.serviceData) return;
        
        // Update active tab
        this.updateActiveTab();
        
        // Show first service section (others are hidden on mobile)
        if (this.isMobile) {
            this.showMobileService(this.currentService);
        }
    }

    setupMobileServiceCards() {
        const container = document.querySelector('.mobile-service-cards');
        if (!container || !this.serviceData) return;

        try {
            // Clear existing content
            container.innerHTML = '';
            
            // Create cards for each service
            Object.values(this.serviceData).forEach(service => {
                if (!service) return;
                
                const card = document.createElement('div');
                card.className = 'mobile-service-card';
                card.dataset.service = service.id;
                
                card.innerHTML = `
                    <div class="mobile-service-header">
                        <div class="mobile-service-icon">
                            <i class="fas ${service.icon}"></i>
                        </div>
                        <h3>${service.title}</h3>
                    </div>
                    <p>${service.description}</p>
                    <button class="btn btn-outline btn-full" data-service="${service.id}">
                        Learn More
                    </button>
                `;
                
                container.appendChild(card);
            });

            // Add event listeners to mobile service card buttons
            container.querySelectorAll('.btn[data-service]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const service = btn.dataset.service;
                    if (service && this.serviceData[service]) {
                        this.switchService(service);
                        
                        // Scroll to top of service
                        const targetSection = document.getElementById(service);
                        if (targetSection) {
                            window.scrollTo({
                                top: targetSection.offsetTop - 80,
                                behavior: 'smooth'
                            });
                        }
                    }
                });
            });
            
            console.log('Mobile service cards setup complete');
            
        } catch (error) {
            console.error('Error setting up mobile service cards:', error);
        }
    }

    showMobileService(serviceId) {
        if (!this.serviceData || !this.serviceData[serviceId]) return;
        
        // Hide all service sections
        document.querySelectorAll('.service-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show selected service section
        const targetSection = document.getElementById(serviceId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
    }

    switchService(serviceId) {
        if (!this.serviceData || !this.serviceData[serviceId] || serviceId === this.currentService) return;

        this.currentService = serviceId;
        
        // Update URL hash
        history.replaceState(null, null, `#${serviceId}`);
        
        // Update active tab
        this.updateActiveTab();
        
        // Scroll to service section
        this.scrollToService(serviceId);
        
        // Update mobile view if needed
        if (this.isMobile) {
            this.showMobileService(serviceId);
        }
    }

    updateActiveTab() {
        if (!this.initialized) return;
        
        // Update tab buttons
        document.querySelectorAll('.service-tab').forEach(tab => {
            const isActive = tab.dataset.service === this.currentService;
            tab.classList.toggle('active', isActive);
        });
    }

    scrollToService(serviceId) {
        const targetSection = document.getElementById(serviceId);
        if (!targetSection) return;

        if (this.isMobile) {
            // For mobile, just ensure the service is visible
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // For desktop, scroll to the service section
            const headerOffset = 100;
            const elementPosition = targetSection.offsetTop;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    bookService(serviceId, packageName) {
        if (!this.serviceData || !this.serviceData[serviceId]) return;

        const service = this.serviceData[serviceId];
        
        // Store booking information in localStorage
        const bookingInfo = {
            service: serviceId,
            serviceName: service.title,
            package: packageName,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        try {
            localStorage.setItem('primer_service_booking', JSON.stringify(bookingInfo));
            
            // Show confirmation
            this.showNotification(`Added ${packageName} package for ${service.title} to your booking`);
            
            // Redirect to booking page after delay
            setTimeout(() => {
                window.location.href = 'book-service.html';
            }, 1500);
        } catch (error) {
            console.error('Error saving booking:', error);
            this.showError('Unable to save booking. Please try again.');
        }
    }

    toggleFaq(faqItem) {
        if (!faqItem) return;
        
        const isActive = faqItem.classList.contains('active');
        
        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Open clicked item if it wasn't active
        if (!isActive) {
            faqItem.classList.add('active');
        }
    }

    handleScroll() {
        const header = document.getElementById('mainHeader');
        if (!header) return;
        
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10B981' : 
                        type === 'error' ? '#EF4444' : '#3B82F6'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            max-width: 400px;
            word-wrap: break-word;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                             type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
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

    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Utility function for debouncing
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

// Add CSS animations for notifications if they don't exist
if (!document.querySelector('#notification-styles')) {
    const notificationStyles = document.createElement('style');
    notificationStyles.id = 'notification-styles';
    notificationStyles.textContent = `
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
    `;
    document.head.appendChild(notificationStyles);
}

// Initialize the services page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        const servicesPage = new ServicesPage();
        
        // Make it available globally for debugging
        window.servicesPage = servicesPage;
        
        console.log('Services page initialized successfully');
    } catch (error) {
        console.error('Failed to initialize services page:', error);
    }
});