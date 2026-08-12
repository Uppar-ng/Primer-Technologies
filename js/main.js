// ============================================================
// ZAURE - Complete Main JavaScript File
// ============================================================
// 
// WEB APP URL: https://script.google.com/macros/s/AKfycbxAvdTHKpX9Zwgy3NAqQH9OvH2br7bUgv6mpgYAE35yU01VwnOkUCJPz1AUiru6Q-FEVw/exec
// SPREADSHEET ID: 17fw2y7VQw2Z_IOVhBi4UQlxI2n3320Sn1v_7iek1YwM
// IMGBB API KEY: fe8f7a672963dc48c9aa825db42aa216
// ============================================================

// ============================================================
// API CONFIGURATION
// ============================================================

const API_BASE = 'https://script.google.com/macros/s/AKfycbxAvdTHKpX9Zwgy3NAqQH9OvH2br7bUgv6mpgYAE35yU01VwnOkUCJPz1AUiru6Q-FEVw/exec';
const IMGBB_API_KEY = 'fe8f7a672963dc48c9aa825db42aa216';

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
// API HELPER
// ============================================================
async function apiCall(action, data = {}, method = 'POST') {
  const url = method === 'GET' 
    ? `${API_BASE}?${new URLSearchParams({ action, ...data })}`
    : API_BASE;
  
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (method === 'POST') {
    options.body = JSON.stringify({ action, ...data });
  }
  
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API Error:', error);
    return { error: error.message };
  }
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
    background: ${type === 'success' ? '#1a3650' : '#e74c3c'}; 
    color: white; padding: 12px 24px; border-radius: 12px;
    font-size: 0.9rem; box-shadow: 0 8px 24px rgba(0,0,0,0.15); 
    z-index: 9999; opacity: 0; transition: opacity 0.3s ease;
    max-width: 90%; text-align: center;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// IMAGE UPLOAD TO IMGBB
// ============================================================
async function uploadImage(file) {
  if (!IMGBB_API_KEY) {
    showToast('Image upload service not configured', 'error');
    return null;
  }
  
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    if (result.success) {
      return result.data.url;
    }
    console.error('Upload failed:', result.error);
    return null;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

async function uploadMultipleImages(files) {
  const urls = [];
  const maxFiles = 5;
  const toUpload = files.slice(0, maxFiles);
  
  for (const file of toUpload) {
    try {
      const url = await uploadImage(file);
      if (url) {
        urls.push(url);
        showToast(`Uploaded ${urls.length}/${toUpload.length} images`);
      }
    } catch (e) {
      console.error('Upload failed for:', file.name);
    }
  }
  return urls;
}

// ============================================================
// USER MANAGEMENT
// ============================================================
let currentUser = null;

function getCurrentUser() {
  if (currentUser) return currentUser;
  const saved = localStorage.getItem('zaure_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      return currentUser;
    } catch (e) {}
  }
  return null;
}

async function loadUser() {
  const saved = localStorage.getItem('zaure_user');
  if (!saved) {
    currentUser = null;
    renderUserArea();
    return null;
  }
  
  try {
    const user = JSON.parse(saved);
    // Verify user exists in sheet
    const result = await apiCall('getUser', { phone: user.phone }, 'GET');
    if (result.user) {
      currentUser = result.user;
      localStorage.setItem('zaure_user', JSON.stringify(currentUser));
    } else {
      // User not found, clear session
      localStorage.removeItem('zaure_user');
      currentUser = null;
    }
  } catch (e) {
    currentUser = null;
  }
  
  renderUserArea();
  return currentUser;
}

async function signupUser(name, phone, state) {
  const result = await apiCall('signup', {
    name,
    phone,
    state,
    email: '',
    bio: '',
  });
  
  if (result.success && result.user) {
    localStorage.setItem('zaure_user', JSON.stringify(result.user));
    currentUser = result.user;
    renderUserArea();
    updateFavoriteBadge();
    return result.user;
  }
  
  throw new Error(result.error || 'Signup failed');
}

async function updateUserProfile(data) {
  const user = getCurrentUser();
  if (!user) return { error: 'Not logged in' };
  
  const result = await apiCall('updateUser', {
    ...data,
    phone: user.phone
  });
  
  if (result.success && result.user) {
    localStorage.setItem('zaure_user', JSON.stringify(result.user));
    currentUser = result.user;
    renderUserArea();
    return result.user;
  }
  
  throw new Error(result.error || 'Update failed');
}

function renderUserArea() {
  const headerUserArea = document.getElementById('headerUserArea');
  if (!headerUserArea) return;
  
  if (currentUser) {
    headerUserArea.innerHTML = `
      <a href="/profile.html" class="user-greeting" style="text-decoration:none;display:flex;align-items:center;gap:6px;color:var(--text);font-weight:500;">
        <i class="fas fa-user"></i> ${currentUser.name.split(' ')[0]}
      </a>
    `;
  } else {
    headerUserArea.innerHTML = `
      <div class="avatar" id="userAvatar" onclick="openSignup()" style="cursor:pointer;width:36px;height:36px;border-radius:50%;background:#1a3650;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;">
        ZA
      </div>
    `;
  }
}

window.openSignup = function() {
  const modal = document.getElementById('signupModal');
  if (modal) modal.classList.add('active');
};

// ============================================================
// PRODUCT FUNCTIONS
// ============================================================

async function loadProducts(category = '', limit = 50) {
  const result = await apiCall('getProducts', { category, limit }, 'GET');
  if (result.products) {
    localStorage.setItem('zaure_products_cache', JSON.stringify(result.products));
    return result.products;
  }
  return [];
}

async function loadProductById(id) {
  const result = await apiCall('getProduct', { id }, 'GET');
  return result.product || null;
}

async function loadProductBySlug(slug) {
  const result = await apiCall('getProductBySlug', { slug }, 'GET');
  return result.product || null;
}

async function loadUserProducts(userId) {
  const result = await apiCall('getUserProducts', { userId }, 'GET');
  return result.products || [];
}

async function addProductToSheet(data) {
  const user = getCurrentUser();
  if (!user) return { error: 'Not logged in' };
  
  const result = await apiCall('addProduct', {
    ...data,
    sellerId: user.id,
    sellerName: user.name,
    sellerPhone: user.phone,
  });
  
  if (result.success) {
    // Add activity
    await apiCall('addActivity', {
      userId: user.id,
      action: 'post_product',
      productId: result.productId,
      details: `Posted: ${data.title}`
    });
  }
  
  return result;
}

async function updateProductInSheet(data) {
  const result = await apiCall('updateProduct', data);
  return result;
}

async function deleteProductFromSheet(id) {
  const result = await apiCall('deleteProduct', { id });
  return result;
}

async function searchProducts(query) {
  const result = await apiCall('search', { q: query }, 'GET');
  return result.products || [];
}

async function getUserActivities() {
  const user = getCurrentUser();
  if (!user) return [];
  const result = await apiCall('getActivities', { userId: user.id }, 'GET');
  return result.activities || [];
}

// ============================================================
// FAVORITES
// ============================================================

function getFavorites() {
  const saved = localStorage.getItem('zaure_favorites');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { return []; }
  }
  return [];
}

async function toggleFavorite(productId) {
  const user = getCurrentUser();
  if (!user) {
    openSignup();
    return false;
  }
  
  const result = await apiCall('toggleFavorite', {
    userId: user.id,
    productId
  });
  
  if (result.success) {
    localStorage.setItem('zaure_favorites', JSON.stringify(result.favorites));
    updateFavoriteBadge();
    return true;
  }
  return false;
}

function isFavorite(productId) {
  return getFavorites().includes(parseInt(productId));
}

function getFavoriteCount() {
  return getFavorites().length;
}

function updateFavoriteBadge() {
  const count = getFavoriteCount();
  document.querySelectorAll('#favBadge').forEach(badge => {
    badge.textContent = count > 0 ? count : '';
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  });
}

// ============================================================
// RENDER LISTINGS
// ============================================================

function renderListings(products, containerId) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  
  if (!products || products.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-secondary);">
      <i class="fas fa-box" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
      No items found. Be the first to post!
    </div>`;
    return;
  }
  
  grid.innerHTML = products.map(p => {
    let badges = '';
    if (p.boosted === 'true' || p.boosted === true) badges += `<span class="badge-boosted"><i class="fas fa-bolt"></i> Boosted</span>`;
    if (p.featured === 'true' || p.featured === true) badges += `<span class="badge-featured">Featured</span>`;
    
    const price = parseFloat(p.price) >= 1000000 
      ? `₦${(parseFloat(p.price)/1000000).toFixed(1)}M` 
      : `₦${parseFloat(p.price).toLocaleString()}`;
    
    const images = p.images ? p.images.split(',').filter(Boolean) : [];
    const firstImage = images.length > 0 ? images[0] : null;
    
    const imageHtml = firstImage 
      ? `<img src="${firstImage}" alt="${p.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'fas fa-box\\' style=\\'font-size:2.5rem;color:var(--text-secondary);\\'></i>';">`
      : `<i class="fas fa-box" style="font-size:2.5rem;color:var(--text-secondary);"></i>`;
    
    const isFav = isFavorite(parseInt(p.id));
    const heartIcon = isFav ? 'fas fa-heart' : 'far fa-heart';
    const heartColor = isFav ? 'color:#e74c3c;' : '';
    
    const slug = p.slug || p.id;
    
    return `
      <div class="listing-card" data-id="${p.id}" style="cursor:pointer;border-radius:16px;overflow:hidden;background:var(--surface);border:1px solid var(--border);transition:transform 0.2s,box-shadow 0.2s;position:relative;">
        <button class="fav-btn" onclick="event.stopPropagation(); toggleFavoriteCard(${p.id}, this)" 
                style="position:absolute;top:12px;right:12px;z-index:2;background:rgba(255,255,255,0.9);border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.1);${heartColor}">
          <i class="${heartIcon}"></i>
        </button>
        <div class="listing-img" style="height:180px;background:var(--surface-alt);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;" onclick="viewProduct('${slug}')">
          ${imageHtml}
          <div style="position:absolute;top:12px;left:12px;display:flex;gap:6px;flex-wrap:wrap;">
            ${badges}
          </div>
        </div>
        <div class="listing-body" style="padding:12px 14px 14px;" onclick="viewProduct('${slug}')">
          <div class="price" style="font-weight:700;font-size:1.1rem;color:var(--text);">${price}</div>
          <div class="title" style="font-weight:600;font-size:0.9rem;margin:4px 0;color:var(--text);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${p.title}</div>
          <div class="meta" style="display:flex;gap:12px;font-size:0.7rem;color:var(--text-secondary);margin-top:4px;">
            <span><i class="fas fa-map-pin"></i> ${p.location || 'Nigeria'}</span>
            <span><i class="far fa-clock"></i> ${p.date || 'Recently'}</span>
          </div>
          <div class="listing-footer" style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-secondary);margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
            <span><i class="fas fa-store"></i> ${p.sellerName || 'Unknown'}</span>
            <span><i class="far fa-eye"></i> ${p.views || 0} views</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// NAVIGATION
// ============================================================

window.viewProduct = function(slug) {
  window.location.href = `/p/${slug}`;
};

window.loadCategory = function(slug) {
  window.location.href = `/category.html?slug=${slug}`;
};

window.toggleFavoriteCard = async function(productId, button) {
  event.stopPropagation();
  if (!getCurrentUser()) {
    openSignup();
    return;
  }
  
  const result = await toggleFavorite(productId);
  if (result) {
    const icon = button.querySelector('i');
    if (isFavorite(productId)) {
      icon.className = 'fas fa-heart';
      button.style.color = '#e74c3c';
    } else {
      icon.className = 'far fa-heart';
      button.style.color = '';
    }
    updateFavoriteBadge();
  }
};

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
// LOAD CATEGORIES
// ============================================================

async function loadCategories() {
  try {
    const response = await fetch('/data/categories.json');
    if (!response.ok) throw new Error('Categories not found');
    const categories = await response.json();
    
    const products = await loadProducts();
    return categories.map(cat => ({
      ...cat,
      count: products.filter(p => p.category === cat.slug).length
    }));
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

// ============================================================
// SEARCH HANDLER
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const searchWrapper = document.getElementById('searchWrapper');
  const acDropdown = document.getElementById('acDropdown');
  const searchBtn = document.getElementById('searchBtn');

  if (searchInput && searchWrapper) {
    let searchTimeout;
    
    searchInput.addEventListener('input', async function() {
      const query = this.value.trim();
      clearTimeout(searchTimeout);
      
      if (query.length < 2) {
        acDropdown.innerHTML = '';
        searchWrapper.classList.remove('show-autocomplete');
        return;
      }
      
      searchTimeout = setTimeout(async () => {
        const results = await searchProducts(query);
        const products = results.slice(0, 5);
        
        if (products.length === 0) {
          acDropdown.innerHTML = `<div class="ac-item" style="justify-content:center;color:var(--text-secondary);">No results found</div>`;
        } else {
          acDropdown.innerHTML = products.map(p => {
            const images = p.images ? p.images.split(',').filter(Boolean) : [];
            const firstImage = images.length > 0 ? images[0] : null;
            const slug = p.slug || p.id;
            return `
              <div class="ac-item" onclick="viewProduct('${slug}')" style="display:flex;align-items:center;gap:12px;padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);transition:background 0.2s;">
                <img src="${firstImage || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect width=%2240%22 height=%2240%22 fill=%22%23d6e1ed%22/%3E%3Ctext x=%228%22 y=%2228%22 font-size=%2220%22%3E📦%3C/text%3E%3C/svg%3E'}" alt="" style="width:40px;height:40px;border-radius:8px;object-fit:cover;">
                <div style="flex:1;">
                  <div style="font-weight:500;color:var(--text);">${p.title}</div>
                  <div style="font-size:0.7rem;color:var(--text-secondary);">${p.category || 'General'} · ${p.location || 'Nigeria'}</div>
                </div>
                <div style="font-weight:600;color:#1a3650;">₦${parseFloat(p.price).toLocaleString()}</div>
              </div>
            `;
          }).join('');
        }
        searchWrapper.classList.add('show-autocomplete');
      }, 300);
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
          window.location.href = `/category.html?slug=all&search=${encodeURIComponent(q)}`;
        }
      });
    }
    
    if (searchInput) {
      searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const q = this.value.trim();
          if (q) {
            window.location.href = `/category.html?slug=all&search=${encodeURIComponent(q)}`;
          }
        }
      });
    }
  }
});

// ============================================================
// SIGNUP MODAL HANDLER
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
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const phone = document.getElementById('signupPhone').value.trim();
      const state = document.getElementById('signupState').value;
      
      if (name && phone && state) {
        try {
          await signupUser(name, phone, state);
          signupModal.classList.remove('active');
          signupForm.reset();
          showToast('Account created successfully! 🎉');
          setTimeout(() => location.reload(), 1000);
        } catch (error) {
          showToast(error.message, 'error');
        }
      }
    });
  }
});

// ============================================================
// POST AD BUTTONS
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
  const postAdCta = document.getElementById('postAdCta');
  const fabPostAd = document.getElementById('fabPostAd');
  
  const postAction = () => {
    if (!getCurrentUser()) {
      openSignup();
    } else {
      window.location.href = '/post.html';
    }
  };
  
  if (postAdCta) postAdCta.addEventListener('click', postAction);
  if (fabPostAd) fabPostAd.addEventListener('click', postAction);
});

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', async function() {
  await loadUser();
  initTheme();
  updateFavoriteBadge();
});

// ============================================================
// EXPOSE GLOBAL FUNCTIONS
// ============================================================

window.apiCall = apiCall;
window.getCurrentUser = getCurrentUser;
window.loadUser = loadUser;
window.signupUser = signupUser;
window.updateUserProfile = updateUserProfile;
window.loadProducts = loadProducts;
window.loadProductById = loadProductById;
window.loadProductBySlug = loadProductBySlug;
window.loadUserProducts = loadUserProducts;
window.addProductToSheet = addProductToSheet;
window.updateProductInSheet = updateProductInSheet;
window.deleteProductFromSheet = deleteProductFromSheet;
window.searchProducts = searchProducts;
window.getUserActivities = getUserActivities;
window.toggleFavorite = toggleFavorite;
window.isFavorite = isFavorite;
window.getFavorites = getFavorites;
window.getFavoriteCount = getFavoriteCount;
window.updateFavoriteBadge = updateFavoriteBadge;
window.renderListings = renderListings;
window.uploadImage = uploadImage;
window.uploadMultipleImages = uploadMultipleImages;
window.showToast = showToast;
window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
window.loadCategories = loadCategories;
window.viewProduct = viewProduct;
window.loadCategory = loadCategory;
window.openSignup = openSignup;
window.toggleFavoriteCard = toggleFavoriteCard;

console.log('Zaure – Nigeria\'s trusted classified marketplace.');
console.log('✅ API URL:', API_BASE);
console.log('📊 Spreadsheet ID: 17fw2y7VQw2Z_IOVhBi4UQlxI2n3320Sn1v_7iek1YwM');
console.log('🖼️ ImgBB API Key: configured ✓');
