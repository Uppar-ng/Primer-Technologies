// js/browse.js

class PropertyBrowser {
    constructor() {
        this.properties = [];
        this.filteredProperties = [];
        this.currentView = 'grid'; // 'grid' or 'list'
        this.currentSort = 'price-low';
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.activeFilters = {
            propertyType: [],
            priceRange: { min: 0, max: 2000000 },
            bedrooms: [],
            bathrooms: [],
            amenities: [],
            searchQuery: ''
        };
        
        // Track search state
        this.isSearching = false;
        this.searchTimeout = null;
        this.suggestionsTimeout = null;
        
        // Parse URL parameters on initialization
        this.urlParams = new URLSearchParams(window.location.search);
        
        this.init();
    }

    async init() {
        await this.loadProperties();
        this.setupEventListeners();
        this.setupSearchSuggestions();
        this.applyUrlFilters();
        this.renderProperties();
        this.updateFilterCount();
        this.updateBrowseMessage();
        this.handleScroll();
        window.addEventListener('scroll', this.handleScroll.bind(this));
    }

    async loadProperties() {
        try {
            // Load from properties.json
            const response = await fetch('data/properties.json');
            if (!response.ok) {
                throw new Error('Failed to load properties');
            }
            
            const data = await response.json();
            this.properties = data.properties;
            this.filteredProperties = [...this.properties];
            this.updateResultsCount();
        } catch (error) {
            console.error('Error loading properties:', error);
            this.showError('Unable to load properties. Please try again later.');
        }
    }

    applyUrlFilters() {
        // Get URL parameters
        const location = this.urlParams.get('location');
        const type = this.urlParams.get('type');
        const minPrice = this.urlParams.get('minPrice');
        const maxPrice = this.urlParams.get('maxPrice');
        
        // Apply location search
        if (location) {
            this.activeFilters.searchQuery = location;
            this.isSearching = true;
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = location;
        }
        
        // Apply property type filter
        if (type) {
            this.activeFilters.propertyType = [type];
            // Update UI checkboxes
            document.querySelectorAll(`.filter-checkbox[name="propertyType"][value="${type}"]`).forEach(checkbox => {
                checkbox.checked = true;
            });
        }
        
        // Apply price filters
        if (minPrice) {
            this.activeFilters.priceRange.min = parseInt(minPrice) || 0;
            const priceMinInput = document.getElementById('priceMin');
            if (priceMinInput) priceMinInput.value = minPrice;
        }
        
        if (maxPrice) {
            this.activeFilters.priceRange.max = parseInt(maxPrice) || 2000000;
            const priceMaxInput = document.getElementById('priceMax');
            const priceSlider = document.getElementById('priceSlider');
            const maxPriceLabel = document.getElementById('maxPriceLabel');
            
            if (priceMaxInput) priceMaxInput.value = maxPrice;
            if (priceSlider) priceSlider.value = maxPrice;
            if (maxPriceLabel) maxPriceLabel.textContent = this.formatPrice(parseInt(maxPrice));
        }
        
        // Check for favorites parameter
        const favorites = this.urlParams.get('favorites');
        if (favorites === 'true') {
            this.applyFavoritesFilter();
            return; // Don't apply other filters if showing favorites
        }
        
        // Apply all filters
        this.applyFilters();
        this.updateBrowseMessage();
    }

    applyFavoritesFilter() {
        const favorites = JSON.parse(localStorage.getItem('primer_favorites')) || [];
        if (favorites.length > 0) {
            this.filteredProperties = this.properties.filter(property => 
                favorites.includes(property.id)
            );
        } else {
            this.filteredProperties = [];
        }
        
        // Update UI
        this.renderProperties();
        this.updateResultsCount();
        this.updateBrowseMessage();
    }

    setupEventListeners() {
        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.toggleView(view);
            });
        });

        // Sort dropdown
        const sortToggle = document.getElementById('sortToggle');
        const sortMenu = document.getElementById('sortMenu');
        
        if (sortToggle) {
            sortToggle.addEventListener('click', () => {
                sortMenu.classList.toggle('active');
            });
        }

        if (sortMenu) {
            document.querySelectorAll('.sort-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    const sort = e.currentTarget.dataset.sort;
                    this.setSort(sort);
                    sortMenu.classList.remove('active');
                });
            });
        }

        // Close sort menu when clicking outside
        document.addEventListener('click', (e) => {
            if (sortToggle && !sortToggle.contains(e.target) && sortMenu && !sortMenu.contains(e.target)) {
                sortMenu.classList.remove('active');
            }
        });

        // Price range slider
        const priceSlider = document.getElementById('priceSlider');
        const priceMin = document.getElementById('priceMin');
        const priceMax = document.getElementById('priceMax');
        const minPriceLabel = document.getElementById('minPriceLabel');
        const maxPriceLabel = document.getElementById('maxPriceLabel');

        if (priceSlider) {
            priceSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (maxPriceLabel) maxPriceLabel.textContent = this.formatPrice(value);
                if (priceMax) priceMax.value = value;
                this.activeFilters.priceRange.max = value;
            });
        }

        // Price input fields
        if (priceMin && priceMax) {
            priceMin.addEventListener('change', (e) => {
                const value = parseInt(e.target.value) || 0;
                this.activeFilters.priceRange.min = value;
            });

            priceMax.addEventListener('change', (e) => {
                const value = parseInt(e.target.value) || 2000000;
                this.activeFilters.priceRange.max = value;
                if (priceSlider) priceSlider.value = value;
            });
        }

        // Filter checkboxes
        document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleFilterChange(e.target);
            });
        });

        // Apply filters button
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }

        // Clear filters
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Search form
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearch();
            });
        }

        // Search input with debounce
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });
        }

        // Clear search button
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Show all properties button
        const showAllBtn = document.getElementById('showAllProperties');
        if (showAllBtn) {
            showAllBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Map toggle
        const mapToggle = document.getElementById('mapToggle');
        if (mapToggle) {
            mapToggle.addEventListener('click', () => {
                this.toggleMapView();
            });
        }

        // Pagination
        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');
        
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.goToPage(this.currentPage - 1);
                }
            });
        }

        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredProperties.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.goToPage(this.currentPage + 1);
                }
            });
        }

        // Page number buttons
        document.querySelectorAll('.page-btn:not(#prevPage):not(#nextPage)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pageText = e.currentTarget.textContent;
                if (pageText && !isNaN(pageText)) {
                    const page = parseInt(pageText);
                    this.goToPage(page);
                }
            });
        });

        // Reset filters (no results state)
        const resetFiltersBtn = document.getElementById('resetFilters');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Mobile filter sheet
        const mobileFilterBtn = document.getElementById('mobileFilterBtn');
        const filterSheet = document.getElementById('filterSheet');
        const closeFilterSheet = document.getElementById('closeFilterSheet');
        const applyMobileFilters = document.getElementById('applyMobileFilters');
        const clearMobileFilters = document.getElementById('clearMobileFilters');

        if (mobileFilterBtn) {
            mobileFilterBtn.addEventListener('click', () => {
                if (filterSheet) {
                    filterSheet.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });
        }

        if (closeFilterSheet) {
            closeFilterSheet.addEventListener('click', () => {
                this.closeFilterSheet();
            });
        }

        if (applyMobileFilters) {
            applyMobileFilters.addEventListener('click', () => {
                this.applyFilters();
                this.closeFilterSheet();
            });
        }

        if (clearMobileFilters) {
            clearMobileFilters.addEventListener('click', () => {
                this.clearFilters();
                this.closeFilterSheet();
            });
        }

        // Close filter sheet on outside click
        if (filterSheet) {
            filterSheet.addEventListener('click', (e) => {
                if (e.target === filterSheet) {
                    this.closeFilterSheet();
                }
            });
        }

        // Close filter sheet on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && filterSheet && filterSheet.classList.contains('active')) {
                this.closeFilterSheet();
            }
        });
    }

    setupSearchSuggestions() {
        const searchInput = document.getElementById('searchInput');
        const suggestionsContainer = document.getElementById('autocompleteResults');
        
        if (!searchInput || !suggestionsContainer) return;
        
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.length >= 2) {
                this.showSearchSuggestions(searchInput.value, suggestionsContainer);
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
            }
        });
    }

    handleScroll() {
        const header = document.getElementById('mainHeader');
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    }

    toggleView(view) {
        if (this.currentView === view) return;

        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });

        // Update grid class
        const propertiesGrid = document.getElementById('propertiesGrid');
        if (propertiesGrid) {
            propertiesGrid.classList.remove('grid-view', 'list-view');
            propertiesGrid.classList.add(`${view}-view`);
        }

        // Update property cards
        document.querySelectorAll('.property-card').forEach(card => {
            card.classList.remove('grid-view', 'list-view');
            card.classList.add(`${view}-view`);
        });
    }

    setSort(sort) {
        this.currentSort = sort;
        
        // Update UI
        const sortToggle = document.getElementById('sortToggle');
        if (sortToggle) {
            const sortOption = document.querySelector(`.sort-option[data-sort="${sort}"]`);
            if (sortOption) {
                const sortText = sortOption.textContent;
                const span = sortToggle.querySelector('span');
                if (span) span.textContent = `Sort: ${sortText}`;
            }
        }
        
        // Update active option
        document.querySelectorAll('.sort-option').forEach(option => {
            option.classList.remove('active');
            if (option.dataset.sort === sort) {
                option.classList.add('active');
            }
        });

        // Apply sort
        this.applySort();
        this.renderProperties();
    }

    applySort() {
        switch (this.currentSort) {
            case 'price-low':
                this.filteredProperties.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                this.filteredProperties.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                this.filteredProperties.sort((a, b) => new Date(b.listedDate) - new Date(a.listedDate));
                break;
            case 'popular':
                this.filteredProperties.sort((a, b) => b.id - a.id);
                break;
        }
    }

    handleFilterChange(checkbox) {
        const filterType = checkbox.name;
        const value = checkbox.value;
        const isChecked = checkbox.checked;

        // Update active filters
        if (isChecked) {
            if (!this.activeFilters[filterType].includes(value)) {
                this.activeFilters[filterType].push(value);
            }
        } else {
            this.activeFilters[filterType] = this.activeFilters[filterType].filter(v => v !== value);
        }

        this.updateFilterCount();
    }

    applyFilters() {
        this.filteredProperties = this.properties.filter(property => {
            // Search query filter (only apply if user is actively searching)
            if (this.isSearching && this.activeFilters.searchQuery) {
                const searchLower = this.activeFilters.searchQuery.toLowerCase();
                const propertyText = `
                    ${property.title} 
                    ${property.address} 
                    ${property.city} 
                    ${property.state} 
                    ${property.description || ''}
                    ${property.propertyType || ''}
                    ${property.neighborhood || ''}
                `.toLowerCase();
                
                if (!propertyText.includes(searchLower)) {
                    return false;
                }
            }
            
            // Property type filter
            if (this.activeFilters.propertyType.length > 0) {
                if (!this.activeFilters.propertyType.includes(property.propertyType)) {
                    return false;
                }
            }

            // Price range filter
            if (property.price < this.activeFilters.priceRange.min || 
                property.price > this.activeFilters.priceRange.max) {
                return false;
            }

            // Bedrooms filter
            if (this.activeFilters.bedrooms.length > 0) {
                let matches = false;
                this.activeFilters.bedrooms.forEach(bed => {
                    if (bed === '4' && property.bedrooms >= 4) matches = true;
                    else if (property.bedrooms === parseInt(bed)) matches = true;
                });
                if (!matches) return false;
            }

            // Bathrooms filter
            if (this.activeFilters.bathrooms.length > 0) {
                let matches = false;
                this.activeFilters.bathrooms.forEach(bath => {
                    if (bath === '3' && property.bathrooms >= 3) matches = true;
                    else if (property.bathrooms === parseInt(bath)) matches = true;
                });
                if (!matches) return false;
            }

            // Amenities filter
            if (this.activeFilters.amenities.length > 0) {
                let hasAllAmenities = true;
                this.activeFilters.amenities.forEach(amenity => {
                    if (!property.amenities || !property.amenities.includes(this.formatAmenity(amenity))) {
                        hasAllAmenities = false;
                    }
                });
                if (!hasAllAmenities) return false;
            }

            return true;
        });

        // Apply current sort
        this.applySort();
        
        // Reset to first page
        this.currentPage = 1;
        
        // Render results
        this.renderProperties();
        this.updateResultsCount();
        this.updateFilterCount();
        this.updateBrowseMessage();
        this.updateSearchStatus();
    }

    clearFilters() {
        // Clear search first
        this.clearSearch();
        
        // Reset active filters
        this.activeFilters = {
            propertyType: [],
            priceRange: { min: 0, max: 2000000 },
            bedrooms: [],
            bathrooms: [],
            amenities: [],
            searchQuery: ''
        };

        // Reset UI checkboxes
        document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Reset price slider and inputs
        const priceSlider = document.getElementById('priceSlider');
        const priceMin = document.getElementById('priceMin');
        const priceMax = document.getElementById('priceMax');
        const minPriceLabel = document.getElementById('minPriceLabel');
        const maxPriceLabel = document.getElementById('maxPriceLabel');

        if (priceSlider) priceSlider.value = 1000000;
        if (priceMin) priceMin.value = '';
        if (priceMax) priceMax.value = '';
        if (minPriceLabel) minPriceLabel.textContent = '₦0';
        if (maxPriceLabel) maxPriceLabel.textContent = '₦2M';

        // Apply filters (which will reset to all properties)
        this.applyFilters();
    }

    handleSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const query = searchInput.value.trim();
            
            if (query === '') {
                // Clear search and show all properties
                this.clearSearch();
                return;
            }
            
            this.activeFilters.searchQuery = query;
            this.isSearching = true;
            this.applyFilters();
            this.updateSearchStatus();
            this.hideSuggestions();
        }
    }

    handleSearchInput(query) {
        const suggestionsContainer = document.getElementById('autocompleteResults');
        
        if (query.trim() === '') {
            this.isSearching = false;
            this.hideSuggestions();
            return;
        }
        
        this.activeFilters.searchQuery = query;
        this.isSearching = true;
        
        // Show suggestions as user types
        clearTimeout(this.suggestionsTimeout);
        this.suggestionsTimeout = setTimeout(() => {
            if (suggestionsContainer && query.length >= 2) {
                this.showSearchSuggestions(query, suggestionsContainer);
            }
        }, 300);
        
        // Apply filters after delay with debouncing
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.applyFilters();
            this.updateSearchStatus();
        }, 500);
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        
        this.activeFilters.searchQuery = '';
        this.isSearching = false;
        this.applyFilters();
        this.updateSearchStatus();
        this.hideSuggestions();
        
        // Show notification that search was cleared
        this.showNotification('Showing all properties', 'info');
    }

    updateSearchStatus() {
        const searchStatus = document.getElementById('searchStatus');
        
        if (this.isSearching && this.activeFilters.searchQuery) {
            if (!searchStatus) {
                this.createSearchStatusElement();
            } else {
                this.updateSearchStatusElement(searchStatus);
            }
        } else if (searchStatus) {
            searchStatus.style.display = 'none';
        }
    }

    createSearchStatusElement() {
        const resultsInfo = document.querySelector('.results-info');
        if (!resultsInfo) return;
        
        const container = document.createElement('div');
        container.id = 'searchStatus';
        container.className = 'search-status';
        container.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--background-dark);
            border-radius: var(--border-radius-md);
            padding: var(--spacing-sm) var(--spacing-md);
            margin-top: var(--spacing-md);
            animation: slideDown 0.3s ease;
        `;
        
        const searchText = document.createElement('span');
        searchText.textContent = `Showing results for: "${this.activeFilters.searchQuery}"`;
        searchText.style.cssText = 'flex: 1; font-size: var(--font-size-sm);';
        
        const clearBtn = document.createElement('button');
        clearBtn.id = 'clearSearchBtn';
        clearBtn.innerHTML = '<i class="fas fa-times"></i> Clear Search';
        clearBtn.style.cssText = `
            background: none;
            border: none;
            color: var(--primary-blue);
            cursor: pointer;
            font-size: var(--font-size-sm);
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--border-radius-sm);
            transition: background-color var(--transition-fast) ease;
        `;
        clearBtn.addEventListener('mouseenter', () => {
            clearBtn.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
        });
        clearBtn.addEventListener('mouseleave', () => {
            clearBtn.style.backgroundColor = 'transparent';
        });
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.clearSearch();
        });
        
        container.appendChild(searchText);
        container.appendChild(clearBtn);
        resultsInfo.parentNode.insertBefore(container, resultsInfo.nextSibling);
    }

    updateSearchStatusElement(container) {
        container.style.display = 'flex';
        const searchText = container.querySelector('span');
        if (searchText) {
            searchText.textContent = `Showing results for: "${this.activeFilters.searchQuery}"`;
        }
    }

    updateBrowseMessage() {
        const browseMessage = document.getElementById('browseMessage');
        const showAllBtn = document.getElementById('showAllProperties');
        const searchTips = document.getElementById('searchTips');
        
        if (this.isSearching) {
            if (browseMessage) {
                browseMessage.innerHTML = `
                    <i class="fas fa-search"></i>
                    <span>Searching for "${this.activeFilters.searchQuery}". <a href="#" id="clearSearchLink" style="color: var(--primary-blue); text-decoration: underline; cursor: pointer;">Clear search</a> to browse all properties.</span>
                `;
                
                // Add click handler for clear search link
                const clearLink = browseMessage.querySelector('#clearSearchLink');
                if (clearLink) {
                    clearLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.clearSearch();
                    });
                }
            }
            if (showAllBtn) showAllBtn.style.display = 'flex';
            if (searchTips) searchTips.style.display = 'none';
        } else {
            if (browseMessage) {
                browseMessage.innerHTML = `
                    <i class="fas fa-compass"></i>
                    <span>Browse through all our properties. Use search for specific locations.</span>
                `;
            }
            if (showAllBtn) showAllBtn.style.display = 'none';
            if (searchTips) searchTips.style.display = 'flex';
        }
    }

    showSearchSuggestions(query, container) {
        const suggestions = this.getSearchSuggestions(query);
        
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        let html = '<div class="suggestions-list">';
        
        suggestions.forEach((suggestion, index) => {
            html += `
                <div class="suggestion-item ${index === 0 ? 'active' : ''}" 
                     data-value="${this.escapeHtml(suggestion.value)}"
                     data-type="${suggestion.type}">
                    <i class="fas fa-${suggestion.icon}"></i>
                    <div>
                        <div class="suggestion-text">${this.escapeHtml(suggestion.text)}</div>
                        <div class="suggestion-type">${suggestion.typeLabel}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        container.style.display = 'block';
        
        // Add click handlers
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = item.dataset.value;
                    this.handleSearch();
                    container.style.display = 'none';
                }
            });
            
            item.addEventListener('mouseenter', (e) => {
                container.querySelectorAll('.suggestion-item').forEach(i => {
                    i.classList.remove('active');
                });
                item.classList.add('active');
            });
        });
    }

    getSearchSuggestions(query) {
        const suggestions = [];
        const queryLower = query.toLowerCase();
        
        // Extract unique cities, states, property types
        const uniqueCities = [...new Set(this.properties.map(p => p.city))];
        const uniqueStates = [...new Set(this.properties.map(p => p.state))];
        const uniqueTypes = [...new Set(this.properties.map(p => p.propertyType))];
        
        // Match cities
        uniqueCities.forEach(city => {
            if (city.toLowerCase().includes(queryLower)) {
                suggestions.push({
                    text: city,
                    value: city,
                    type: 'city',
                    typeLabel: 'City',
                    icon: 'map-marker-alt'
                });
            }
        });
        
        // Match states
        uniqueStates.forEach(state => {
            if (state.toLowerCase().includes(queryLower)) {
                suggestions.push({
                    text: state,
                    value: state,
                    type: 'state',
                    typeLabel: 'State',
                    icon: 'map'
                });
            }
        });
        
        // Match property types
        uniqueTypes.forEach(type => {
            if (type.toLowerCase().includes(queryLower)) {
                suggestions.push({
                    text: type.charAt(0).toUpperCase() + type.slice(1),
                    value: type,
                    type: 'propertyType',
                    typeLabel: 'Property Type',
                    icon: 'building'
                });
            }
        });
        
        // Match neighborhoods (if available)
        this.properties.forEach(property => {
            if (property.neighborhood && 
                property.neighborhood.toLowerCase().includes(queryLower) &&
                !suggestions.some(s => s.value === property.neighborhood)) {
                suggestions.push({
                    text: property.neighborhood,
                    value: property.neighborhood,
                    type: 'neighborhood',
                    typeLabel: 'Neighborhood',
                    icon: 'location-dot'
                });
            }
        });
        
        // Add some popular searches
        if (suggestions.length < 5) {
            const popularSearches = [
                { text: 'Apartments with pool', value: 'apartment pool', type: 'popular', typeLabel: 'Popular Search', icon: 'fire' },
                { text: 'Houses with garden', value: 'house garden', type: 'popular', typeLabel: 'Popular Search', icon: 'fire' },
                { text: 'Modern condos', value: 'modern condo', type: 'popular', typeLabel: 'Popular Search', icon: 'fire' }
            ];
            
            popularSearches.forEach(popular => {
                if (popular.text.toLowerCase().includes(queryLower) && 
                    !suggestions.some(s => s.value === popular.value)) {
                    suggestions.push(popular);
                }
            });
        }
        
        // Limit to 8 suggestions
        return suggestions.slice(0, 8);
    }

    hideSuggestions() {
        const suggestionsContainer = document.getElementById('autocompleteResults');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toggleMapView() {
        // This would toggle to a map view in a real implementation
        const mapToggle = document.getElementById('mapToggle');
        if (!mapToggle) return;
        
        const isMapView = mapToggle.classList.contains('active');
        
        if (isMapView) {
            // Switch back to list view
            mapToggle.classList.remove('active');
            mapToggle.innerHTML = '<i class="fas fa-map"></i><span>Map View</span>';
            const propertiesGrid = document.getElementById('propertiesGrid');
            if (propertiesGrid) propertiesGrid.style.display = 'grid';
            // Hide map (if implemented)
        } else {
            // Switch to map view
            mapToggle.classList.add('active');
            mapToggle.innerHTML = '<i class="fas fa-list"></i><span>List View</span>';
            const propertiesGrid = document.getElementById('propertiesGrid');
            if (propertiesGrid) propertiesGrid.style.display = 'none';
            // Show map (if implemented)
            this.showNotification('Map view coming soon!');
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderProperties();
        this.updatePagination();
        
        // Scroll to top of properties
        const propertiesGrid = document.getElementById('propertiesGrid');
        if (propertiesGrid) {
            propertiesGrid.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    updatePagination() {
        const totalItems = this.filteredProperties.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        // Update button states
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
        }

        // Update page numbers (simplified for demo)
        const pagination = document.getElementById('pagination');
        if (pagination) {
            if (totalPages <= 1) {
                pagination.style.display = 'none';
            } else {
                pagination.style.display = 'flex';
            }
        }
    }

    renderProperties() {
        const container = document.getElementById('propertiesGrid');
        const noResults = document.getElementById('noResults');
        
        if (!container) return;
        
        if (this.filteredProperties.length === 0) {
            container.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            return;
        }
        
        if (noResults) noResults.style.display = 'none';

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageProperties = this.filteredProperties.slice(startIndex, endIndex);

        // Generate HTML
        const propertiesHTML = pageProperties.map(property => this.createPropertyCard(property)).join('');
        
        container.innerHTML = propertiesHTML;

        // Add event listeners to new cards
        this.setupPropertyCardEvents();
        
        // Update pagination
        this.updatePagination();
    }

    createPropertyCard(property) {
        const isFavorite = this.isPropertyFavorite(property.id);
        const priceFormatted = this.formatPrice(property.price);
        
        return `
            <article class="property-card ${this.currentView}-view" data-id="${property.id}">
                <div class="property-image">
                    <img src="${property.images[0] || 'images/4.jpg'}" 
                         alt="${property.title}" 
                         loading="lazy">
                    <span class="property-badge">${property.type === 'sale' ? 'For Sale' : 'For Rent'}</span>
                    <button class="property-favorite ${isFavorite ? 'active' : ''}" 
                            aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
                            data-id="${property.id}">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
                <div class="property-content">
                    <div class="property-price">${priceFormatted}</div>
                    <h3 class="property-title">${property.title}</h3>
                    <p class="property-address">
                        <i class="fas fa-map-marker-alt" style="margin-right: 0.5rem; color: var(--text-tertiary);"></i>
                        ${property.address}, ${property.city}, ${property.state}
                    </p>
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
                    <button class="btn btn-outline btn-full view-details-btn" 
                            style="margin-top: var(--spacing-md);"
                            data-id="${property.id}">
                        View Details
                    </button>
                </div>
            </article>
        `;
    }

    setupPropertyCardEvents() {
        // Favorite buttons
        document.querySelectorAll('.property-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const propertyId = parseInt(btn.dataset.id);
                this.toggleFavorite(propertyId, btn);
            });
        });

        // View details buttons
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const propertyId = parseInt(btn.dataset.id);
                this.viewPropertyDetails(propertyId);
            });
        });

        // Property card click
        document.querySelectorAll('.property-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.property-favorite') && !e.target.closest('.view-details-btn')) {
                    const propertyId = parseInt(card.dataset.id);
                    this.viewPropertyDetails(propertyId);
                }
            });
        });
    }

    toggleFavorite(propertyId, button) {
        let favorites = JSON.parse(localStorage.getItem('primer_favorites')) || [];
        const index = favorites.indexOf(propertyId);
        
        if (index > -1) {
            // Remove from favorites
            favorites.splice(index, 1);
            button.classList.remove('active');
            button.innerHTML = '<i class="far fa-heart"></i>';
            button.setAttribute('aria-label', 'Add to favorites');
            this.showNotification('Removed from favorites');
        } else {
            // Add to favorites
            favorites.push(propertyId);
            button.classList.add('active');
            button.innerHTML = '<i class="fas fa-heart"></i>';
            button.setAttribute('aria-label', 'Remove from favorites');
            this.showNotification('Added to favorites');
        }
        
        localStorage.setItem('primer_favorites', JSON.stringify(favorites));
    }

    isPropertyFavorite(propertyId) {
        const favorites = JSON.parse(localStorage.getItem('primer_favorites')) || [];
        return favorites.includes(propertyId);
    }

    viewPropertyDetails(propertyId) {
        window.location.href = `property.html?id=${propertyId}`;
    }

    updateResultsCount() {
        const showingCount = document.getElementById('showingCount');
        const totalCount = document.getElementById('totalCount');
        
        const showing = Math.min(this.filteredProperties.length, this.itemsPerPage * this.currentPage);
        const total = this.filteredProperties.length;
        
        if (showingCount) {
            showingCount.textContent = showing > total ? total : showing;
        }
        
        if (totalCount) {
            totalCount.textContent = total;
        }
    }

    updateFilterCount() {
        const filterCount = document.getElementById('filterCount');
        if (!filterCount) return;

        let count = 0;
        
        // Count active filters (excluding search and default values)
        if (this.activeFilters.propertyType.length > 0) count += this.activeFilters.propertyType.length;
        if (this.activeFilters.bedrooms.length > 0) count += this.activeFilters.bedrooms.length;
        if (this.activeFilters.bathrooms.length > 0) count += this.activeFilters.bathrooms.length;
        if (this.activeFilters.amenities.length > 0) count += this.activeFilters.amenities.length;
        if (this.activeFilters.priceRange.min > 0 || this.activeFilters.priceRange.max < 2000000) count += 1;
        if (this.activeFilters.searchQuery && this.isSearching) count += 1;

        if (count > 0) {
            filterCount.textContent = count;
            filterCount.style.display = 'flex';
        } else {
            filterCount.style.display = 'none';
        }
    }

    formatPrice(price) {
        if (price >= 1000000) {
            return `₦${(price / 1000000).toFixed(1)}M`;
        } else if (price >= 1000) {
            return `₦${(price / 1000).toFixed(0)}K`;
        } else {
            return `₦${price.toLocaleString()}`;
        }
    }

    formatAmenity(amenityKey) {
        const mapping = {
            'parking': 'Parking',
            'pool': 'Pool',
            'garden': 'Garden',
            'garage': 'Garage',
            'pets': 'Pets Allowed',
            'furnished': 'Furnished'
        };
        return mapping[amenityKey] || amenityKey;
    }

    closeFilterSheet() {
        const filterSheet = document.getElementById('filterSheet');
        if (filterSheet) {
            filterSheet.classList.remove('active');
            document.body.style.overflow = '';
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
            background: ${type === 'success' ? '#10B981' : 
                        type === 'error' ? '#EF4444' : '#2563EB'};
            color: white;
            padding: var(--spacing-md) var(--spacing-lg);
            border-radius: var(--border-radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 1050;
            animation: slideIn 0.3s ease;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                             type === 'error' ? 'exclamation-circle' : 'info-circle'}" 
               style="margin-right: 0.5rem;"></i>
            ${message}
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

    isMobile() {
        return window.innerWidth <= 767;
    }
}

// Initialize the property browser when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const propertyBrowser = new PropertyBrowser();
    
    // Make it available globally for debugging
    window.propertyBrowser = propertyBrowser;
});