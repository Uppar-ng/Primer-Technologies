// js/property.js

class PropertyDetail {
    constructor() {
        this.propertyId = null;
        this.propertyData = null;
        this.images = [];
        this.currentImageIndex = 0;
        this.isFavorite = false;
        this.similarProperties = [];
        this.phoneNumber = "+2348123456789";
        this.whatsappNumber = "+2348123456789";
        
        this.init();
    }

    async init() {
        // Get property ID from URL
        this.propertyId = this.getPropertyIdFromUrl();
        
        if (!this.propertyId) {
            this.showError('Property not found');
            return;
        }

        await this.loadPropertyData();
        this.setupEventListeners();
        this.setupMobileGestures();
        this.renderPropertyDetails();
        this.loadSimilarProperties();
        this.checkFavoriteStatus();
    }

    getPropertyIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        return id ? parseInt(id) : null;
    }

    async loadPropertyData() {
        try {
            const response = await fetch('data/properties.json');
            const data = await response.json();
            
            // Find the property by ID
            this.propertyData = data.properties.find(p => p.id === this.propertyId);
            
            if (!this.propertyData) {
                throw new Error('Property not found');
            }

            // Process images
            this.images = this.propertyData.images || ['images/3.jpg'];
            
            // Get similar properties (same type, excluding current)
            this.similarProperties = data.properties
                .filter(p => p.id !== this.propertyId && p.propertyType === this.propertyData.propertyType)
                .slice(0, 3);

        } catch (error) {
            console.error('Error loading property data:', error);
            this.showError('Unable to load property details. Please try again later.');
        }
    }

    setupEventListeners() {
        // Gallery navigation
        const prevBtn = document.getElementById('prevImage');
        const nextBtn = document.getElementById('nextImage');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigateGallery(-1));
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigateGallery(1));
        }

        // Thumbnail clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.thumbnail')) {
                const thumbnail = e.target.closest('.thumbnail');
                const index = parseInt(thumbnail.dataset.index);
                this.showImage(index);
            }
        });

        // Lightbox
        const lightbox = document.getElementById('lightbox');
        const lightboxClose = document.getElementById('lightboxClose');
        const lightboxPrev = document.getElementById('lightboxPrev');
        const lightboxNext = document.getElementById('lightboxNext');
        const mainImage = document.getElementById('mainImage');

        if (mainImage) {
            mainImage.addEventListener('click', () => this.openLightbox(this.currentImageIndex));
        }

        if (lightboxClose) {
            lightboxClose.addEventListener('click', () => this.closeLightbox());
        }

        if (lightboxPrev) {
            lightboxPrev.addEventListener('click', () => this.navigateLightbox(-1));
        }

        if (lightboxNext) {
            lightboxNext.addEventListener('click', () => this.navigateLightbox(1));
        }

        // Close lightbox on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                this.closeLightbox();
            }
        });

        // Close lightbox on outside click
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                this.closeLightbox();
            }
        });

        // Lightbox keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            
            if (e.key === 'ArrowLeft') {
                this.navigateLightbox(-1);
            } else if (e.key === 'ArrowRight') {
                this.navigateLightbox(1);
            }
        });

        // Schedule viewing form
        const viewingForm = document.getElementById('viewingForm');
        if (viewingForm) {
            viewingForm.addEventListener('submit', (e) => this.handleViewingForm(e));
        }

        // Mobile action buttons
        const mobileFavoriteBtn = document.getElementById('mobileFavoriteBtn');
        const mobileShareBtn = document.getElementById('mobileShareBtn');
        const mobileWhatsAppBtn = document.getElementById('mobileWhatsAppBtn');
        const mobileCallBtn = document.getElementById('mobileCallBtn');

        if (mobileFavoriteBtn) {
            mobileFavoriteBtn.addEventListener('click', () => this.toggleFavorite());
        }

        if (mobileShareBtn) {
            mobileShareBtn.addEventListener('click', () => this.shareProperty());
        }

        if (mobileWhatsAppBtn) {
            mobileWhatsAppBtn.addEventListener('click', () => this.openWhatsApp());
        }

        if (mobileCallBtn) {
            mobileCallBtn.addEventListener('click', () => this.makePhoneCall());
        }

        // Accordion for mobile
        this.setupAccordion();

        // Header scroll effect
        window.addEventListener('scroll', this.handleScroll.bind(this));

        // Update today's date as min date for scheduling
        this.setMinScheduleDate();
    }

    setupMobileGestures() {
        if (!this.isMobile()) return;

        let startX, startY;
        let isScrolling;

        // Swipe gestures for image gallery
        const mainImageContainer = document.querySelector('.main-image-container');
        if (mainImageContainer) {
            mainImageContainer.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isScrolling = undefined;
            }, { passive: true });

            mainImageContainer.addEventListener('touchmove', (e) => {
                if (!startX || !startY) return;

                const xDiff = e.touches[0].clientX - startX;
                const yDiff = e.touches[0].clientY - startY;

                if (isScrolling === undefined) {
                    isScrolling = Math.abs(xDiff) < Math.abs(yDiff);
                }

                if (!isScrolling) {
                    e.preventDefault();
                }
            }, { passive: false });

            mainImageContainer.addEventListener('touchend', (e) => {
                if (!startX || !startY) return;

                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;

                const xDiff = endX - startX;
                const yDiff = endY - startY;

                if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 50) {
                    if (xDiff > 0) {
                        // Swipe right - previous image
                        this.navigateGallery(-1);
                    } else {
                        // Swipe left - next image
                        this.navigateGallery(1);
                    }
                }

                startX = null;
                startY = null;
            });
        }

        // Double tap to zoom (simulated with lightbox)
        let lastTap = 0;
        if (mainImageContainer) {
            mainImageContainer.addEventListener('touchend', (e) => {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                
                if (tapLength < 300 && tapLength > 0) {
                    // Double tap detected
                    this.openLightbox(this.currentImageIndex);
                }
                
                lastTap = currentTime;
            });
        }
    }

    setupAccordion() {
        const accordionItems = document.querySelectorAll('.accordion-item');
        
        accordionItems.forEach(item => {
            const header = item.querySelector('.accordion-header');
            if (header) {
                header.addEventListener('click', () => {
                    const isActive = item.classList.contains('active');
                    
                    // Close all items
                    accordionItems.forEach(i => i.classList.remove('active'));
                    
                    // Open clicked item if it wasn't active
                    if (!isActive) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }

    handleScroll() {
        const header = document.getElementById('mainHeader');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    renderPropertyDetails() {
        if (!this.propertyData) return;

        // Update property header
        document.getElementById('propertyTitle').textContent = this.propertyData.title;
        document.getElementById('propertyAddress').textContent = 
            `${this.propertyData.address}, ${this.propertyData.city}, ${this.propertyData.state}`;
        
        // Format price with ₦ symbol
        const formattedPrice = this.formatPrice(this.propertyData.price);
        document.getElementById('propertyPrice').textContent = formattedPrice;
        
        document.getElementById('propertyStatus').textContent = 
            this.propertyData.type === 'sale' ? 'For Sale' : 'For Rent';
        
        // Update mobile action bar price
        const actionBarPrice = document.getElementById('actionBarPrice');
        if (actionBarPrice) {
            actionBarPrice.textContent = formattedPrice;
        }

        // Update property features
        document.getElementById('bedrooms').textContent = this.propertyData.bedrooms;
        document.getElementById('bathrooms').textContent = this.propertyData.bathrooms;
        document.getElementById('squareFeet').textContent = this.propertyData.squareFeet.toLocaleString();

        // Update description
        const description = document.getElementById('propertyDescription');
        const mobileDescription = document.getElementById('mobileDescription');
        if (description) description.textContent = this.propertyData.description;
        if (mobileDescription) mobileDescription.textContent = this.propertyData.description;

        // Update amenities
        this.renderAmenities();

        // Render image gallery
        this.renderImageGallery();

        // Update page title
        document.title = `${this.propertyData.title} | Primer Technologies`;
    }

    renderAmenities() {
        const amenitiesGrid = document.getElementById('amenitiesGrid');
        const mobileAmenities = document.getElementById('mobileAmenities');
        
        if (!this.propertyData.amenities || this.propertyData.amenities.length === 0) {
            if (amenitiesGrid) amenitiesGrid.innerHTML = '<p>No amenities listed</p>';
            if (mobileAmenities) mobileAmenities.innerHTML = '<p>No amenities listed</p>';
            return;
        }

        const amenitiesHTML = this.propertyData.amenities.map(amenity => `
            <div class="amenity-item">
                <i class="fas fa-check"></i>
                <span>${amenity}</span>
            </div>
        `).join('');

        if (amenitiesGrid) amenitiesGrid.innerHTML = amenitiesHTML;
        if (mobileAmenities) mobileAmenities.innerHTML = amenitiesHTML;
    }

    renderImageGallery() {
        const mainImage = document.getElementById('mainImage');
        const thumbnailStrip = document.getElementById('thumbnailStrip');
        
        if (!mainImage || !thumbnailStrip) return;

        // Set main image
        if (this.images.length > 0) {
            mainImage.src = this.images[0];
            mainImage.alt = `${this.propertyData.title} - Main Image`;
        }

        // Render thumbnails
        thumbnailStrip.innerHTML = this.images.map((image, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                <img src="${image}" alt="${this.propertyData.title} - Image ${index + 1}" loading="lazy">
            </div>
        `).join('');

        // Update gallery controls
        this.updateGalleryControls();
    }

    updateGalleryControls() {
        const prevBtn = document.getElementById('prevImage');
        const nextBtn = document.getElementById('nextImage');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentImageIndex === 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentImageIndex === this.images.length - 1;
        }
    }

    navigateGallery(direction) {
        const newIndex = this.currentImageIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.images.length) {
            this.showImage(newIndex);
        }
    }

    showImage(index) {
        if (index < 0 || index >= this.images.length) return;

        this.currentImageIndex = index;
        
        // Update main image
        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
            mainImage.src = this.images[index];
            mainImage.alt = `${this.propertyData.title} - Image ${index + 1}`;
        }

        // Update active thumbnail
        document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });

        // Update gallery controls
        this.updateGalleryControls();

        // Scroll thumbnail into view if needed
        const activeThumb = document.querySelector(`.thumbnail[data-index="${index}"]`);
        if (activeThumb) {
            activeThumb.scrollIntoView({
                behavior: 'smooth',
                inline: 'center'
            });
        }
    }

    openLightbox(index) {
        const lightbox = document.getElementById('lightbox');
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxCounter = document.getElementById('lightboxCounter');
        
        if (!lightbox || !lightboxImage) return;

        this.currentImageIndex = index;
        lightboxImage.src = this.images[index];
        lightboxImage.alt = `${this.propertyData.title} - Image ${index + 1}`;
        lightboxCounter.textContent = `${index + 1} / ${this.images.length}`;
        
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    navigateLightbox(direction) {
        const newIndex = this.currentImageIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.images.length) {
            this.openLightbox(newIndex);
        }
    }

    async loadSimilarProperties() {
        const container = document.getElementById('similarProperties');
        if (!container) return;

        if (this.similarProperties.length === 0) {
            container.innerHTML = '<p class="text-center" style="grid-column: 1 / -1; color: var(--text-secondary);">No similar properties found</p>';
            return;
        }

        container.innerHTML = this.similarProperties.map(property => `
            <article class="property-card">
                <div class="property-card-image">
                    <img src="${property.images[0] || 'images/property-placeholder.jpg'}" 
                         alt="${property.title}" 
                         loading="lazy">
                </div>
                <div class="property-card-content">
                    <div class="property-card-price">${this.formatPrice(property.price)}</div>
                    <h3 class="property-card-title">${property.title}</h3>
                    <p class="property-card-address">
                        ${property.address}, ${property.city}, ${property.state}
                    </p>
                    <div class="property-card-features">
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
                    <button class="btn btn-outline btn-full view-similar-btn" 
                            style="margin-top: var(--spacing-md);"
                            data-id="${property.id}">
                        View Details
                    </button>
                </div>
            </article>
        `).join('');

        // Add event listeners to similar property buttons
        document.querySelectorAll('.view-similar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const propertyId = parseInt(btn.dataset.id);
                window.location.href = `property.html?id=${propertyId}`;
            });
        });
    }

    checkFavoriteStatus() {
        const favorites = JSON.parse(localStorage.getItem('primer_favorites')) || [];
        this.isFavorite = favorites.includes(this.propertyId);
        
        // Update favorite button state
        const mobileFavoriteBtn = document.getElementById('mobileFavoriteBtn');
        if (mobileFavoriteBtn) {
            const icon = mobileFavoriteBtn.querySelector('i');
            if (icon) {
                icon.className = this.isFavorite ? 'fas fa-heart' : 'far fa-heart';
            }
        }
    }

    toggleFavorite() {
        let favorites = JSON.parse(localStorage.getItem('primer_favorites')) || [];
        
        if (this.isFavorite) {
            // Remove from favorites
            favorites = favorites.filter(id => id !== this.propertyId);
            this.isFavorite = false;
            this.showNotification('Removed from favorites');
        } else {
            // Add to favorites
            favorites.push(this.propertyId);
            this.isFavorite = true;
            this.showNotification('Added to favorites');
        }
        
        localStorage.setItem('primer_favorites', JSON.stringify(favorites));
        
        // Update button
        const mobileFavoriteBtn = document.getElementById('mobileFavoriteBtn');
        if (mobileFavoriteBtn) {
            const icon = mobileFavoriteBtn.querySelector('i');
            if (icon) {
                icon.className = this.isFavorite ? 'fas fa-heart' : 'far fa-heart';
            }
        }
    }

    shareProperty() {
        if (navigator.share) {
            // Use Web Share API if available
            navigator.share({
                title: this.propertyData.title,
                text: `Check out this ${this.propertyData.type === 'sale' ? 'property for sale' : 'rental property'} on Primer Technologies`,
                url: window.location.href
            })
            .then(() => this.showNotification('Property shared successfully'))
            .catch(error => console.log('Error sharing:', error));
        } else {
            // Fallback: copy to clipboard
            this.copyToClipboard(window.location.href);
            this.showNotification('Link copied to clipboard');
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }

    makePhoneCall() {
        // Remove all non-numeric characters except +
        const cleanNumber = this.phoneNumber.replace(/[^\d+]/g, '');
        
        // Create the tel: link
        const telLink = `tel:${cleanNumber}`;
        
        // Use window.location for better cross-device compatibility
        window.location.href = telLink;
        
        // Fallback: create and click a link
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = telLink;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, 100);
    }

    openWhatsApp() {
        // Get property details for WhatsApp message
        const propertyTitle = this.propertyData.title;
        const propertyPrice = this.formatPrice(this.propertyData.price);
        const propertyUrl = window.location.href;
        
        // Create WhatsApp message
        const message = `Hello, I'm interested in this property:\n\n` +
                       `Property: ${propertyTitle}\n` +
                       `Price: ${propertyPrice}\n` +
                       `Link: ${propertyUrl}\n\n` +
                       `Please contact me with more details.`;
        
        // Encode the message for URL
        const encodedMessage = encodeURIComponent(message);
        
        // Create WhatsApp URL
        const whatsappUrl = `https://wa.me/${this.whatsappNumber.replace(/[^\d]/g, '')}?text=${encodedMessage}`;
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
    }

    async handleViewingForm(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = '<div class="loading"></div>';
        submitBtn.disabled = true;
        
        // Get form data
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            preferredDate: document.getElementById('preferredDate').value,
            message: document.getElementById('message').value,
            propertyId: this.propertyId,
            propertyTitle: this.propertyData.title,
            timestamp: new Date().toISOString()
        };
        
        // Validate form
        if (!this.validateForm(formData)) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        // Simulate API call
        try {
            await this.submitViewingRequest(formData);
            
            // Show success message
            this.showNotification('Viewing request submitted successfully! We\'ll contact you soon.', 'success');
            
            // Reset form
            form.reset();
            
            // Store in localStorage (for demo purposes)
            this.storeViewingRequest(formData);
            
        } catch (error) {
            this.showNotification('Failed to submit request. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    validateForm(data) {
        // Basic validation
        if (!data.name.trim()) {
            this.showNotification('Please enter your name', 'error');
            return false;
        }
        
        if (!data.email.trim() || !this.isValidEmail(data.email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return false;
        }
        
        if (!data.phone.trim()) {
            this.showNotification('Please enter your phone number', 'error');
            return false;
        }
        
        return true;
    }

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    async submitViewingRequest(data) {
        // Simulate API delay
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Viewing request submitted:', data);
                resolve({ success: true, message: 'Request submitted' });
            }, 1000);
        });
    }

    storeViewingRequest(data) {
        // Store in localStorage for demo purposes
        const requests = JSON.parse(localStorage.getItem('primer_viewing_requests')) || [];
        requests.push(data);
        localStorage.setItem('primer_viewing_requests', JSON.stringify(requests));
    }

    setMinScheduleDate() {
        const dateInput = document.getElementById('preferredDate');
        if (dateInput) {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const minDate = tomorrow.toISOString().split('T')[0];
            dateInput.min = minDate;
            
            // Set default to 3 days from now
            const defaultDate = new Date(today);
            defaultDate.setDate(defaultDate.getDate() + 3);
            dateInput.value = defaultDate.toISOString().split('T')[0];
        }
    }

    formatPrice(price) {
        // Format price in Nigerian Naira
        if (price >= 1000000) {
            return `₦${(price / 1000000).toFixed(1)}M`;
        } else if (price >= 1000) {
            return `₦${(price / 1000).toFixed(0)}K`;
        } else {
            return `₦${price.toLocaleString()}`;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--secondary-green)' : 
                        type === 'error' ? 'var(--error)' : 'var(--primary-blue)'};
            color: white;
            padding: var(--spacing-md) var(--spacing-lg);
            border-radius: var(--border-radius-md);
            box-shadow: var(--shadow-lg);
            z-index: var(--z-index-tooltip);
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
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
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
        
        // Redirect to browse page after error
        setTimeout(() => {
            window.location.href = 'browse.html';
        }, 3000);
    }

    isMobile() {
        return window.innerWidth <= 767;
    }
}

// Add CSS animations for notifications
const notificationStyles = document.createElement('style');
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

// Initialize the property detail page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const propertyDetail = new PropertyDetail();
    
    // Make it available globally for debugging
    window.propertyDetail = propertyDetail;
});