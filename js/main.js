// ============================================================
// DEVICE DETECTION
// ============================================================
function detectDevice() {
  const isMobile = window.innerWidth < 1024;
  document.body.classList.remove('device-mobile', 'device-desktop');
  document.body.classList.add(isMobile ? 'device-mobile' : 'device-desktop');
}
detectDevice();
window.addEventListener('resize', detectDevice);

// ============================================================
// THEME MANAGEMENT
// ============================================================
function initTheme() {
  const storedTheme = localStorage.getItem('zaure_theme') || 'light';
  document.documentElement.setAttribute('data-theme', storedTheme);
  
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.innerHTML = storedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }
  
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    if (storedTheme === 'dark') {
      darkModeToggle.classList.add('active');
    } else {
      darkModeToggle.classList.remove('active');
    }
  }
}

window.toggleTheme = function() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('zaure_theme', next);
  
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.innerHTML = next === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }
  
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    if (next === 'dark') {
      darkModeToggle.classList.add('active');
    } else {
      darkModeToggle.classList.remove('active');
    }
  }
};

// ============================================================
// USER MANAGEMENT
// ============================================================
let currentUser = null;

function loadUser() {
  const saved = localStorage.getItem('zaure_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      renderUserArea();
      return true;
    } catch (e) { return false; }
  }
  return false;
}

function renderUserArea() {
  const headerUserArea = document.getElementById('headerUserArea');
  if (!headerUserArea) return;
  
  if (currentUser) {
    headerUserArea.innerHTML = `
      <a href="/profile.html" class="user-greeting" style="text-decoration:none;">
        <i class="fas fa-user"></i> ${currentUser.name.split(' ')[0]}
      </a>
    `;
  } else {
    headerUserArea.innerHTML = `
      <div class="avatar" id="userAvatar" onclick="openSignup()">ZA</div>
    `;
  }
}

window.openSignup = function() {
  const modal = document.getElementById('signupModal');
  if (modal) modal.classList.add('active');
};

// ============================================================
// SIGNUP MODAL
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  const signupModal = document.getElementById('signupModal');
  const closeSignupModalBtn = document.getElementById('closeSignupModalBtn');
  const signupForm = document.getElementById('signupForm');

  if (closeSignupModalBtn) {
    closeSignupModalBtn.addEventListener('click', () => signupModal.classList.remove('active'));
  }
  if (signupModal) {
    signupModal.addEventListener('click', (e) => {
      if (e.target === signupModal) signupModal.classList.remove('active');
    });
  }
  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const phone = document.getElementById('signupPhone').value.trim();
      const state = document.getElementById('signupState').value;
      if (name && phone && state) {
        currentUser = { name, phone, state };
        localStorage.setItem('zaure_user', JSON.stringify(currentUser));
        signupModal.classList.remove('active');
        signupForm.reset();
        renderUserArea();
        updateFavoriteBadge();
        location.reload();
      }
    });
  }
});

// ============================================================
// DATA LOADING - FROM JSON FILES WITH CACHING
// ============================================================

// ----- Load products from JSON with caching -----
async function loadProducts() {
  // First check if we have cached products in localStorage
  const cached = localStorage.getItem('zaure_products_cache');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.length > 0) {
        // Return cached data immediately, but also fetch fresh data in background
        fetchFreshProducts();
        return parsed;
      }
    } catch (e) {}
  }
  
  // If no cache, fetch from JSON
  return fetchFreshProducts();
}

async function fetchFreshProducts() {
  try {
    const response = await fetch('/data/products.json');
    if (!response.ok) throw new Error('Products not found');
    const products = await response.json();
    // Cache for later
    localStorage.setItem('zaure_products_cache', JSON.stringify(products));
    return products;
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

// ----- Load categories from JSON -----
async function loadCategories() {
  try {
    const response = await fetch('/data/categories.json');
    if (!response.ok) throw new Error('Categories not found');
    const categories = await response.json();
    
    // Get products to count items per category
    const products = await loadProducts();
    
    // Update category counts based on products
    const updatedCategories = categories.map(cat => {
      const count = products.filter(p => p.category === cat.slug).length;
      return { ...cat, count: count };
    });
    
    return updatedCategories;
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

// ----- Load sellers from JSON -----
async function loadTopSellers() {
  try {
    const response = await fetch('/data/sellers.json');
    if (!response.ok) throw new Error('Sellers not found');
    return await response.json();
  } catch (error) {
    console.error('Error loading sellers:', error);
    return [];
  }
}

// ----- Load trending keywords from JSON -----
async function loadTrendingKeywords() {
  try {
    const response = await fetch('/data/trending.json');
    if (!response.ok) throw new Error('Trending not found');
    return await response.json();
  } catch (error) {
    console.error('Error loading trending:', error);
    return [];
  }
}

// ----- Synchronous version for pages that need it (Favorites, Profile) -----
function getProductsSync() {
  const cached = localStorage.getItem('zaure_products_cache');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      return [];
    }
  }
  return [];
}

// ============================================================
// FAVORITES MANAGEMENT
// ============================================================

function getFavorites() {
  const saved = localStorage.getItem('zaure_favorites');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  return [];
}

function saveFavorites(favorites) {
  localStorage.setItem('zaure_favorites', JSON.stringify(favorites));
}

function toggleFavorite(productId) {
  if (!currentUser) {
    openSignup();
    return false;
  }
  
  let favorites = getFavorites();
  const index = favorites.indexOf(productId);
  let isFavorite = false;
  
  if (index > -1) {
    favorites.splice(index, 1);
    isFavorite = false;
  } else {
    favorites.push(productId);
    isFavorite = true;
  }
  saveFavorites(favorites);
  updateFavoriteBadge();
  return isFavorite;
}

function isFavorite(productId) {
  const favorites = getFavorites();
  return favorites.includes(productId);
}

function getFavoriteCount() {
  return getFavorites().length;
}

function updateFavoriteBadge() {
  const count = getFavoriteCount();
  const badges = document.querySelectorAll('#favBadge');
  badges.forEach(badge => {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }
  });
}

window.toggleFavoriteCard = function(productId, buttonElement) {
  event.stopPropagation();
  
  if (!currentUser) {
    openSignup();
    return;
  }
  
  const isFav = toggleFavorite(productId);
  const icon = buttonElement.querySelector('i');
  
  if (isFav) {
    icon.className = 'fas fa-heart';
    buttonElement.style.color = '#e74c3c';
  } else {
    icon.className = 'far fa-heart';
    buttonElement.style.color = '';
  }
  updateFavoriteBadge();
};

// ============================================================
// RENDER LISTINGS
// ============================================================
function renderListings(products, containerId) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  
  if (!products || products.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-secondary);">No items found.</div>`;
    return;
  }
  
  grid.innerHTML = products.map(p => {
    let badges = '';
    if (p.boosted) badges += `<span class="badge-boosted"><i class="fas fa-bolt"></i> Boosted</span>`;
    if (p.featured) badges += `<span class="badge-featured">Featured</span>`;
    const price = p.price >= 1e6 ? `₦${(p.price/1e6).toFixed(1)}M` : `₦${p.price.toLocaleString()}`;
    
    const firstImage = p.images && p.images.length > 0 ? p.images[0] : null;
    const imageHtml = firstImage 
      ? `<img src="${firstImage}" alt="${p.title}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'fas fa-box\\' style=\\'font-size:2.5rem;color:var(--text-secondary);\\'></i>';">`
      : `<i class="fas fa-box" style="font-size:2.5rem;color:var(--text-secondary);"></i>`;
    
    const isFav = isFavorite(p.id);
    const heartIcon = isFav ? 'fas fa-heart' : 'far fa-heart';
    const heartColor = isFav ? 'color:#e74c3c;' : '';
    
    return `
      <div class="listing-card" data-id="${p.id}">
        <button class="fav-btn" onclick="event.stopPropagation(); toggleFavoriteCard(${p.id}, this)" 
                style="${heartColor}">
          <i class="${heartIcon}"></i>
        </button>
        <div class="listing-img" style="background:${p.bg || 'var(--surface-alt)'};" onclick="viewProduct(${p.id})">
          ${imageHtml}
          ${badges}
        </div>
        <div class="listing-body" onclick="viewProduct(${p.id})">
          <div class="price">${price}</div>
          <div class="title">${p.title}</div>
          <div class="meta"><span><i class="fas fa-map-pin"></i> ${p.location}</span><span><i class="far fa-clock"></i> ${p.date}</span></div>
          <div class="listing-footer">
            <span><i class="fas fa-store"></i> ${p.seller?.name || 'Unknown'}</span>
            <span><i class="far fa-heart"></i> ${isFav ? 'Saved' : 'Save'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// VIEW PRODUCT
// ============================================================
window.viewProduct = function(productId) {
  window.location.href = `/detail.html?id=${productId}`;
};

// ============================================================
// LOAD CATEGORY
// ============================================================
window.loadCategory = function(slug) {
  window.location.href = `/category.html?slug=${slug}`;
};

// ============================================================
// POST AD BUTTONS
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  const postAdCta = document.getElementById('postAdCta');
  const fabPostAd = document.getElementById('fabPostAd');
  const sellNavBtn = document.getElementById('sellNavBtn');
  
  const postAction = () => {
    if (!currentUser) {
      openSignup();
    } else {
      window.location.href = '/post.html';
    }
  };
  
  if (postAdCta) postAdCta.addEventListener('click', postAction);
  if (fabPostAd) fabPostAd.addEventListener('click', postAction);
  if (sellNavBtn) sellNavBtn.addEventListener('click', postAction);
  
  initTheme();
  updateFavoriteBadge();
});

// ============================================================
// SEARCH HANDLER
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const searchWrapper = document.getElementById('searchWrapper');
  const acDropdown = document.getElementById('acDropdown');
  const searchBtn = document.getElementById('searchBtn');

  if (searchInput && searchWrapper) {
    searchInput.addEventListener('input', async function() {
      const query = this.value.trim();
      if (query.length < 2) {
        acDropdown.innerHTML = '';
        searchWrapper.classList.remove('show-autocomplete');
        return;
      }
      const products = await loadProducts();
      const results = products.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      
      if (results.length === 0) {
        acDropdown.innerHTML = `<div class="ac-item" style="justify-content:center;color:var(--text-secondary);">No results found</div>`;
      } else {
        acDropdown.innerHTML = results.map(p => {
          const firstImage = p.images && p.images.length > 0 ? p.images[0] : null;
          return `
            <div class="ac-item" onclick="viewProduct(${p.id})">
              <img src="${firstImage || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2236%22 height=%2236%22%3E%3Crect width=%2236%22 height=%2236%22 fill=%22%23d6e1ed%22/%3E%3Ctext x=%228%22 y=%2224%22 font-size=%2220%22%3E📦%3C/text%3E%3C/svg%3E'}" alt="">
              <span>${p.title}</span>
              <small>${p.category}</small>
            </div>
          `;
        }).join('');
      }
      searchWrapper.classList.add('show-autocomplete');
    });

    document.addEventListener('click', function(e) {
      if (!searchWrapper.contains(e.target)) {
        searchWrapper.classList.remove('show-autocomplete');
      }
    });

    if (searchBtn) {
      searchBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        const q = searchInput.value.trim();
        if (q) {
          const products = await loadProducts();
          const filtered = products.filter(p => 
            p.title.toLowerCase().includes(q.toLowerCase()) ||
            p.category.toLowerCase().includes(q.toLowerCase()) ||
            p.location.toLowerCase().includes(q.toLowerCase())
          );
          localStorage.setItem('zaure_search_results', JSON.stringify(filtered));
          localStorage.setItem('zaure_search_query', q);
          window.location.href = `/search.html`;
        }
      });
    }
  }
});

// ============================================================
// EXPOSE GLOBAL FUNCTIONS
// ============================================================
window.getFavorites = getFavorites;
window.saveFavorites = saveFavorites;
window.toggleFavorite = toggleFavorite;
window.isFavorite = isFavorite;
window.getFavoriteCount = getFavoriteCount;
window.updateFavoriteBadge = updateFavoriteBadge;
window.toggleFavoriteCard = toggleFavoriteCard;
window.loadProducts = loadProducts;
window.loadCategories = loadCategories;
window.loadTopSellers = loadTopSellers;
window.loadTrendingKeywords = loadTrendingKeywords;
window.renderListings = renderListings;
window.getProductsSync = getProductsSync;
window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
window.loadUser = loadUser;
window.renderUserArea = renderUserArea;

console.log('Zaure – Nigeria\'s trusted classified marketplace.');