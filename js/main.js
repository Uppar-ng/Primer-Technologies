// ============================================================
// ZAURE - Complete Main JavaScript File
// ============================================================

// ============================================================
// SITE-WIDE TRANSLATION BOOTSTRAP (torchv-translate)
// Runs on EVERY page. The profile page wires up a custom UI.
// ============================================================
(function initTranslate() {
  if (window.translate) return;

  const script = document.createElement('script');
  script.src = 'https://cdn.staticfile.net/translate.js/3.18.66/translate.js';
  script.onload = function () {
    translate.language.setLocal('english');
    translate.service.use('client.edge');
    translate.listener.start();
    translate.selectLanguageTag.show = false; // we use our own dropdown

    // Restore the user's previously chosen language (if any)
    const savedLang = localStorage.getItem('zaure_lang');
    if (savedLang && savedLang !== 'english') {
      translate.changeLanguage(savedLang);
    }

    translate.execute();
  };
  document.head.appendChild(script);
})();

// ============================================================
// PROFILE LANGUAGE SWITCHER
// Only activates when #languageSelect exists (profile.html)
// ============================================================
(function initLanguageSwitcher() {
  document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('languageSelect');
    if (!container) return; // not on profile page

    const trigger = document.getElementById('languageTrigger');
    const optionsList = document.getElementById('languageOptions');
    if (!trigger || !optionsList) return;

    // Map display name → torchv-translate language code
    const languageMap = {
      'English': 'english',
      'Arabic':  'arabic',
      'Hausa':   'hausa',
      'Fulani':  'ff',
      'Yoruba':  'yoruba',
      'Igbo':    'igbo'
    };

    function renderOptions() {
      optionsList.innerHTML = Object.entries(languageMap)
        .map(([name, code]) => `<li data-lang="${code}" data-name="${name}">${name}</li>`)
        .join('');

      optionsList.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', function () {
          const code = this.dataset.lang;
          const name = this.dataset.name;

          trigger.querySelector('span').textContent = name;
          container.classList.remove('active');

          localStorage.setItem('zaure_lang', code);

          if (window.translate && typeof translate.changeLanguage === 'function') {
            if (code === 'english') {
              if (typeof translate.reset === 'function') {
                translate.reset();
              } else {
                translate.changeLanguage('english');
              }
            } else {
              translate.changeLanguage(code);
            }
          } else {
            console.warn('translate.changeLanguage not available yet.');
          }
        });
      });
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      container.classList.toggle('active');
    });

    document.addEventListener('click', function (e) {
      if (!container.contains(e.target)) container.classList.remove('active');
    });

    const saved = localStorage.getItem('zaure_lang');
    if (saved) {
      const match = Object.entries(languageMap).find(([_, code]) => code === saved);
      if (match) trigger.querySelector('span').textContent = match[0];
    }

    renderOptions();
  });
})();

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
    themeToggle.innerHTML = storedTheme === 'dark'
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';
  }

  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    if (storedTheme === 'dark') darkModeToggle.classList.add('active');
    else darkModeToggle.classList.remove('active');
  }
}

window.toggleTheme = function() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('zaure_theme', next);

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.innerHTML = next === 'dark'
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';
  }

  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    if (next === 'dark') darkModeToggle.classList.add('active');
    else darkModeToggle.classList.remove('active');
  }
};

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

function signupUser(name, phone, state) {
  currentUser = {
    id: Date.now(),
    name: name,
    phone: phone,
    state: state,
    joined: new Date().toISOString()
  };
  localStorage.setItem('zaure_user', JSON.stringify(currentUser));
  renderUserArea();
  updateFavoriteBadge();
  return currentUser;
}

function updateUserProfile(data) {
  const user = getCurrentUser();
  if (!user) return { error: 'Not logged in' };

  const updatedUser = { ...user, ...data };
  localStorage.setItem('zaure_user', JSON.stringify(updatedUser));
  currentUser = updatedUser;
  renderUserArea();
  return updatedUser;
}

// ============================================================
// RENDER USER AREA
// ============================================================
function renderUserArea() {
  const headerUserArea = document.getElementById('headerUserArea');
  if (!headerUserArea) return;

  const user = getCurrentUser();
  if (user && user.name) {
    headerUserArea.innerHTML = `
      <a href="/profile.html" class="user-greeting">
        <i class="fas fa-user-circle"></i> ${user.name.split(' ')[0]}
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
      const termsChecked = document.getElementById('termsCheckbox')?.checked;

      if (name && phone && state && termsChecked) {
        signupUser(name, phone, state);
        signupModal.classList.remove('active');
        signupForm.reset();
        renderUserArea();
        updateFavoriteBadge();
      } else {
        alert('Please fill all fields and accept the terms.');
      }
    });
  }
});

// ============================================================
// CUSTOM STATE DROPDOWN
// ============================================================
const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

function initStateDropdown() {
  const selectContainer = document.getElementById('stateSelect');
  if (!selectContainer) return;

  const trigger = document.getElementById('stateTrigger');
  const dropdown = document.getElementById('stateDropdown');
  const searchInput = document.getElementById('stateSearchInput');
  const optionsList = document.getElementById('stateOptionsList');
  const hiddenInput = document.getElementById('signupState');

  if (!trigger || !dropdown || !searchInput || !optionsList || !hiddenInput) return;

  function renderOptions(filter = '') {
    const filtered = nigerianStates.filter(state =>
      state.toLowerCase().includes(filter.toLowerCase())
    );
    optionsList.innerHTML = filtered.map(state =>
      `<li data-value="${state}">${state}</li>`
    ).join('');

    optionsList.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', function() {
        const selected = this.dataset.value;
        hiddenInput.value = selected;
        trigger.querySelector('span').textContent = selected;
        selectContainer.classList.remove('active');
        if (searchInput) searchInput.value = '';
        renderOptions();
      });
    });
  }

  renderOptions();

  trigger.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    selectContainer.classList.toggle('active');
    if (selectContainer.classList.contains('active') && searchInput) {
      searchInput.focus();
    }
  });

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      renderOptions(this.value);
    });
    searchInput.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }

  document.addEventListener('click', function(e) {
    if (!selectContainer.contains(e.target)) {
      selectContainer.classList.remove('active');
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      selectContainer.classList.remove('active');
    }
  });
}

// ============================================================
// DATA LOADING — PRODUCTS
// ============================================================
async function loadProducts() {
  const cached = localStorage.getItem('zaure_products_cache');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.length > 0) {
        fetchFreshProducts();
        return parsed;
      }
    } catch (e) {}
  }
  return fetchFreshProducts();
}

async function fetchFreshProducts() {
  try {
    const response = await fetch('/data/products.json');
    if (!response.ok) throw new Error('Products not found');
    const products = await response.json();
    localStorage.setItem('zaure_products_cache', JSON.stringify(products));
    return products;
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

async function loadCategories() {
  try {
    const response = await fetch('/data/categories.json');
    if (!response.ok) throw new Error('Categories not found');
    const categories = await response.json();
    const products = await loadProducts();
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
// DATA LOADING — LAND (mirrors products exactly)
// ============================================================
async function loadLand() {
  const cached = localStorage.getItem('zaure_land_cache');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.length > 0) {
        fetchFreshLand();
        return parsed;
      }
    } catch (e) {}
  }
  return fetchFreshLand();
}

async function fetchFreshLand() {
  try {
    const response = await fetch('/data/land.json');
    if (!response.ok) throw new Error('Land not found');
    const land = await response.json();
    localStorage.setItem('zaure_land_cache', JSON.stringify(land));
    return land;
  } catch (error) {
    console.warn('Land.json not found — falling back to products.json filter.');
    // Fallback: extract land-like items from products.json
    const products = getProductsSync();
    const landFromProducts = products.filter(p => {
      const cat = (p.category || '').toLowerCase();
      const sub = (p.subcategory || '').toLowerCase();
      const type = (p.type || '').toLowerCase();
      return cat.includes('land') || cat.includes('property') ||
             cat.includes('real estate') || cat.includes('plot') ||
             cat.includes('farm') || sub.includes('land') ||
             sub.includes('property') || sub.includes('plot') || sub.includes('farm') ||
             type === 'plot' || type === 'farm';
    });
    localStorage.setItem('zaure_land_cache', JSON.stringify(landFromProducts));
    return landFromProducts;
  }
}

function getLandSync() {
  const cached = localStorage.getItem('zaure_land_cache');
  if (cached) {
    try { return JSON.parse(cached); } catch (e) { return []; }
  }
  return [];
}

// ============================================================
// COMBINED ITEMS (products + land) — used by search, etc.
// ============================================================
async function loadAllItems() {
  const [products, land] = await Promise.all([loadProducts(), loadLand()]);
  return combineItems(products, land);
}

function getAllItemsSync() {
  return combineItems(getProductsSync(), getLandSync());
}

function combineItems(products, land) {
  const seen = new Set();
  const result = [];
  // Land first (preferred data for land items — richer detail)
  (land || []).forEach(item => {
    if (item && item.id != null && !seen.has(String(item.id))) {
      seen.add(String(item.id));
      result.push(item);
    }
  });
  (products || []).forEach(item => {
    if (item && item.id != null && !seen.has(String(item.id))) {
      seen.add(String(item.id));
      result.push(item);
    }
  });
  return result;
}

// ============================================================
// LAND HELPERS — classify / detect
// ============================================================
function isLandItem(item) {
  if (!item) return false;
  const type = (item.type || '').toLowerCase();
  const cat  = (item.category || '').toLowerCase();
  const sub  = (item.subcategory || '').toLowerCase();
  return type === 'plot' || type === 'farm' ||
         cat === 'land' || cat === 'farmland' || cat === 'property' ||
         sub === 'farmland' || sub === 'residential' && cat.includes('land') ||
         cat.includes('land') || cat.includes('farm');
}

function classifyLandItem(item) {
  const hay = [
    item.subcategory, item.category, item.type, item.propertyType, item.title
  ].filter(Boolean).join(' ').toLowerCase();
  if (hay.includes('farm') || hay.includes('agro') || hay.includes('agric') ||
      hay.includes('farmland') || hay.includes('crop')) return 'farm';
  return 'plot';
}

function formatTitleStatus(s) {
  if (!s) return '';
  const map = {
    'excision_completed': 'Excision Completed',
    'excision_in_progress': 'Excision in Progress',
    'c_of_o': 'C of O',
    'governors_consent': "Governor's Consent",
    'registered_deed': 'Registered Deed',
    'survey_plan': 'Survey Plan',
    'family_consent': 'Family Consent'
  };
  return map[s] || String(s).replace(/_/g, ' ');
}

// ============================================================
// ITEM TYPE RESOLUTION (for view routing, hover preview, etc.)
// ============================================================
function getItemType(id) {
  const sid = String(id);
  if (getLandSync().some(l => String(l.id) === sid)) return 'land';
  if (getProductsSync().some(p => String(p.id) === sid)) return 'product';
  return null;
}

function resolveItemById(id) {
  const sid = String(id);
  const landHit = getLandSync().find(l => String(l.id) === sid);
  if (landHit) return landHit;
  const productHit = getProductsSync().find(p => String(p.id) === sid);
  if (productHit) return productHit;
  return null;
}

// ============================================================
// SERVICES (Find a Pro) — ALWAYS FRESH FROM services.json
// ============================================================
async function loadServices() {
  try {
    const response = await fetch('/data/services.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Services not found');
    const services = await response.json();
    localStorage.setItem('zaure_services_cache', JSON.stringify(services));
    return services;
  } catch (error) {
    console.warn('Services fetch failed, falling back to cache:', error);
    const cached = localStorage.getItem('zaure_services_cache');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { return []; }
    }
    return [];
  }
}

async function fetchFreshServices() {
  return loadServices();
}

function getServicesSync() {
  const cached = localStorage.getItem('zaure_services_cache');
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
// SELLER FIELD HELPERS
// ============================================================
function getSellerName(s) {
  if (!s) return 'Zaure Pro';
  if (typeof s.seller === 'string' && s.seller.trim()) return s.seller;
  const seller = (typeof s.seller === 'object' && s.seller) ? s.seller : {};
  return seller.name
      || seller.fullName
      || seller.full_name
      || s.provider
      || s.providerName
      || 'Zaure Pro';
}

function getSellerPic(s) {
  if (!s) return '';
  const seller = (typeof s.seller === 'object' && s.seller) ? s.seller : {};
  let pic = seller.profilePic
         || seller.profile_pic
         || seller.profileImage
         || seller.profile_image
         || seller.avatar
         || seller.avatarUrl
         || seller.avatar_url
         || seller.image
         || seller.img
         || seller.photo
         || seller.photoUrl
         || seller.photo_url
         || seller.picture
         || '';
  if (!pic) {
    pic = s.profilePic
       || s.profile_pic
       || s.avatar
       || s.photo
       || s.providerPic
       || s.providerImage
       || '';
  }
  return pic || '';
}

function getSellerRating(s) {
  if (!s) return '5.0';
  const seller = (typeof s.seller === 'object' && s.seller) ? s.seller : {};
  return seller.rating || s.rating || '5.0';
}

function getSellerInitials(s) {
  const name = getSellerName(s);
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ============================================================
// TRADE MAP
// ============================================================
const TRADE_MAP = {
  'Cleaning': 'Cleaner',
  'Electrical': 'Electrician',
  'Plumbing': 'Plumber',
  'Appliance Repair': 'Appliance Technician',
  'Carpentry': 'Carpenter',
  'Painting': 'Painter',
  'Generator Repair': 'Generator Technician',
  'Interior Design': 'Interior Designer',
  'Solar & Inverter': 'Solar Installer',
  'Tiling': 'Tiler',
  'Event Services': 'Event Planner',
  'Security': 'Security Installer',
  'Masonry': 'Mason',
  'Moving': 'Mover',
  'Landscaping': 'Landscaper',
  'Beauty': 'Beautician',
  'Water Systems': 'Borehole Specialist',
  'Auto Repair': 'Auto Mechanic',
  'Photography': 'Photographer',
  'Satellite': 'Satellite Installer'
};

function getTradeName(category) {
  return TRADE_MAP[category] || category || 'Professional';
}

// ============================================================
// NORMALIZE SERVICE
// ============================================================
function normalizeService(s) {
  return {
    id: s.id != null ? s.id : (s.slug || ''),
    title: s.title || s.name || s.service || s.heading || 'Service',
    location: s.location || s.state || s.city || s.area || s.address || '',
    date: s.date || s.availability || s.hours || 'Available now',
    category: s.category || s.type || s.trade || s.group || 'Service',
    seller: s.seller || {
      name: s.provider || s.providerName || s.name || 'Professional'
    },
    boosted: !!s.boosted,
    featured: !!(s.featured || s.verified),
    rating: s.rating
  };
}

// ============================================================
// RECOMMENDATION ALGORITHM
// ============================================================
function getUserState() {
  const user = getCurrentUser();
  if (user && user.state) {
    return user.state;
  }
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => { resolve('Lagos'); },
        () => { resolve(null); },
        { timeout: 5000 }
      );
    } else {
      resolve(null);
    }
  });
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function recommendProducts(products, state, count) {
  if (!products || products.length === 0) return [];

  let pool = products;
  if (state) {
    const stateFiltered = products.filter(p => p.location && p.location.includes(state));
    if (stateFiltered.length >= count) {
      pool = stateFiltered;
    } else if (stateFiltered.length > 0) {
      const others = products.filter(p => !p.location || !p.location.includes(state));
      pool = [...stateFiltered, ...shuffleArray(others).slice(0, count - stateFiltered.length)];
    }
  }

  return shuffleArray(pool).slice(0, count);
}

function recommendServices(services, state, count) {
  if (!services || services.length === 0) return [];

  let pool = services;
  if (state) {
    const stateFiltered = services.filter(s => s.location && s.location.includes(state));
    if (stateFiltered.length >= count) {
      pool = stateFiltered;
    } else if (stateFiltered.length > 0) {
      const others = services.filter(s => !s.location || !s.location.includes(state));
      pool = [...stateFiltered, ...shuffleArray(others).slice(0, count - stateFiltered.length)];
    }
  }

  return shuffleArray(pool).slice(0, count);
}

// Same algorithm as recommendProducts — mirrors it exactly for land
function recommendLand(land, state, count) {
  if (!land || land.length === 0) return [];

  let pool = land;
  if (state) {
    const stateFiltered = land.filter(l => l.location && l.location.includes(state));
    if (stateFiltered.length >= count) {
      pool = stateFiltered;
    } else if (stateFiltered.length > 0) {
      const others = land.filter(l => !l.location || !l.location.includes(state));
      pool = [...stateFiltered, ...shuffleArray(others).slice(0, count - stateFiltered.length)];
    }
  }

  return shuffleArray(pool).slice(0, count);
}

// ============================================================
// RENDER SERVICES (homepage cards)
// ============================================================
function renderServices(services, containerId) {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  if (!services || services.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-secondary);">
      <i class="fas fa-user-tie" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
      No services found.
    </div>`;
    return;
  }

  grid.innerHTML = services.map(raw => {
    const p = normalizeService(raw);
    const sellerName = getSellerName(raw);
    const profilePic = getSellerPic(raw);
    const initials = getSellerInitials(raw);
    const trade = getTradeName(p.category);

    let badges = '';
    if (p.boosted) badges += `<span class="badge-boosted"><i class="fas fa-bolt"></i> Boosted</span>`;
    if (p.featured) badges += `<span class="badge-featured">Featured</span>`;

    const avatarInner = profilePic
      ? `<img src="${profilePic}" alt="${sellerName}" loading="lazy"
             style="width:100%;height:100%;object-fit:cover;display:block;"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
         <span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;color:#1a3650;font-weight:700;font-size:2rem;">${initials}</span>`
      : `<span style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;color:#1a3650;font-weight:700;font-size:2rem;">${initials}</span>`;

    const isFav = isFavorite(p.id);
    const heartIcon = isFav ? 'fas fa-heart' : 'far fa-heart';
    const heartColor = isFav ? 'color:#e74c3c;' : '';

    return `
      <div class="listing-card" data-id="${p.id}" style="cursor:pointer;border-radius:16px;overflow:hidden;background:var(--surface);border:1px solid var(--border);transition:transform 0.2s,box-shadow 0.2s;position:relative;">
        <button class="fav-btn" onclick="event.stopPropagation(); toggleFavoriteCard('${p.id}', this)"
                style="position:absolute;top:12px;right:12px;z-index:2;background:rgba(255,255,255,0.9);border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.1);${heartColor}">
          <i class="${heartIcon}"></i>
        </button>

        <div class="listing-img" onclick="viewService('${p.id}')"
             style="height:180px;background:linear-gradient(135deg,#1a3650,#0f2940);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
          <div style="position:absolute;inset:0;background:radial-gradient(circle at 30% 25%,rgba(212,184,122,0.16) 0%,transparent 60%);"></div>
          <div style="width:96px;height:96px;border-radius:50%;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(255,255,255,0.15),0 0 0 6px rgba(212,184,122,0.55),0 12px 32px rgba(0,0,0,0.3);position:relative;z-index:1;">
            ${avatarInner}
          </div>
          ${badges}
        </div>

        <div class="listing-body" style="padding:14px 14px 14px;" onclick="viewService('${p.id}')">
          <div class="provider-name" style="font-weight:700;font-size:1rem;color:var(--text);line-height:1.25;letter-spacing:-0.2px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;">${sellerName}</div>
          <div class="provider-trade" style="display:inline-flex;align-items:center;gap:5px;font-size:0.7rem;font-weight:700;color:#B49450;text-transform:uppercase;letter-spacing:1px;margin:4px 0 8px;">
            <i class="fas fa-tag" style="font-size:0.65rem;"></i> ${trade}
          </div>
          <div class="service-title-sub" style="font-weight:500;font-size:0.82rem;color:var(--text-secondary);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${p.title}</div>
          <div class="meta" style="display:flex;gap:12px;font-size:0.7rem;color:var(--text-secondary);margin-top:8px;">
            <span><i class="fas fa-map-pin"></i> ${p.location || 'Nigeria'}</span>
            <span><i class="far fa-clock"></i> ${p.date}</span>
          </div>
          <div class="listing-footer" style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-secondary);margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
            <span><i class="fas fa-star" style="color:#D4B87A;"></i> ${getSellerRating(raw)}</span>
            <span><i class="far fa-heart"></i> ${isFav ? 'Saved' : 'Save'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
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
      badge.textContent = '';
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
// RENDER LISTINGS (products) — reference card layout
// ============================================================
function renderListings(products, containerId) {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  if (!products || products.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-secondary);">
      <i class="fas fa-box" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
      No items found.
    </div>`;
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
      <div class="listing-card" data-id="${p.id}" data-type="product" style="cursor:pointer;border-radius:16px;overflow:hidden;background:var(--surface);border:1px solid var(--border);transition:transform 0.2s,box-shadow 0.2s;position:relative;">
        <button class="fav-btn" onclick="event.stopPropagation(); toggleFavoriteCard('${p.id}', this)"
                style="position:absolute;top:12px;right:12px;z-index:2;background:rgba(255,255,255,0.9);border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.1);${heartColor}">
          <i class="${heartIcon}"></i>
        </button>
        <div class="listing-img" style="height:180px;background:var(--surface-alt);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;" onclick="viewProduct('${p.id}')">
          ${imageHtml}
          ${badges}
        </div>
        <div class="listing-body" style="padding:12px 14px 14px;" onclick="viewProduct('${p.id}')">
          <div class="price" style="font-weight:700;font-size:1.1rem;color:var(--text);">${price}</div>
          <div class="title" style="font-weight:600;font-size:0.9rem;margin:4px 0;color:var(--text);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${p.title}</div>
          <div class="meta" style="display:flex;gap:12px;font-size:0.7rem;color:var(--text-secondary);margin-top:4px;">
            <span><i class="fas fa-map-pin"></i> ${p.location}</span>
            <span><i class="far fa-clock"></i> ${p.date}</span>
          </div>
          <div class="listing-footer" style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-secondary);margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
            <span><i class="fas fa-store"></i> ${p.seller?.name || 'Unknown'}</span>
            <span><i class="far fa-heart"></i> ${isFav ? 'Saved' : 'Save'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// RENDER LAND LISTINGS — identical card structure to products
// ============================================================
function renderLandListings(land, containerId) {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  if (!land || land.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-secondary);">
      <i class="fas fa-map-marked-alt" style="font-size:2rem;display:block;margin-bottom:12px;"></i>
      No land listings found.
    </div>`;
    return;
  }

  grid.innerHTML = land.map(p => {
    const tier = (p.verificationTier || '').toLowerCase();

    // Badges mirror product pattern (boosted/featured)
    let badges = '';
    if (tier === 'guaranteed') {
      badges += `<span class="badge-featured" style="background:#D4B87A;color:#1a3650;"><i class="fas fa-shield-alt"></i> Guaranteed</span>`;
    } else if (tier === 'verified') {
      badges += `<span class="badge-featured"><i class="fas fa-check-circle"></i> Verified</span>`;
    }

    const price = p.price >= 1e6
      ? `₦${(p.price/1e6).toFixed(1)}M`
      : `₦${(Number(p.price) || 0).toLocaleString()}`;

    const firstImage = p.images && p.images.length > 0 ? p.images[0] : (p.image || null);
    const imageHtml = firstImage
      ? `<img src="${firstImage}" alt="${p.title}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'fas fa-map-marked-alt\\' style=\\'font-size:2.5rem;color:var(--text-secondary);\\'></i>';">`
      : `<i class="fas fa-map-marked-alt" style="font-size:2.5rem;color:var(--text-secondary);"></i>`;

    const isFav = isFavorite(p.id);
    const heartIcon = isFav ? 'fas fa-heart' : 'far fa-heart';
    const heartColor = isFav ? 'color:#e74c3c;' : '';

    // Secondary meta mirrors product "date" — land shows plot size or category
    const secondaryMeta = p.plotSize || (classifyLandItem(p) === 'farm' ? 'Farmland' : 'Plot');
    const secondaryIcon = p.plotSize ? 'fa-ruler-combined' : 'fa-tag';

    // Seller line mirrors product pattern — falls back to Zaure for land
    const sellerName = (p.seller && p.seller.name) ? p.seller.name : 'Zaure';

    return `
      <div class="listing-card" data-id="${p.id}" data-type="land" style="cursor:pointer;border-radius:16px;overflow:hidden;background:var(--surface);border:1px solid var(--border);transition:transform 0.2s,box-shadow 0.2s;position:relative;">
        <button class="fav-btn" onclick="event.stopPropagation(); toggleFavoriteCard('${p.id}', this)"
                style="position:absolute;top:12px;right:12px;z-index:2;background:rgba(255,255,255,0.9);border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.1);${heartColor}">
          <i class="${heartIcon}"></i>
        </button>
        <div class="listing-img" style="height:180px;background:var(--surface-alt);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;" onclick="viewLand('${p.id}')">
          ${imageHtml}
          ${badges}
        </div>
        <div class="listing-body" style="padding:12px 14px 14px;" onclick="viewLand('${p.id}')">
          <div class="price" style="font-weight:700;font-size:1.1rem;color:var(--text);">${price}</div>
          <div class="title" style="font-weight:600;font-size:0.9rem;margin:4px 0;color:var(--text);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${p.title || 'Land Plot'}</div>
          <div class="meta" style="display:flex;gap:12px;font-size:0.7rem;color:var(--text-secondary);margin-top:4px;">
            <span><i class="fas fa-map-pin"></i> ${p.location || 'Nigeria'}</span>
            <span><i class="fas ${secondaryIcon}"></i> ${secondaryMeta}</span>
          </div>
          <div class="listing-footer" style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-secondary);margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
            <span><i class="fas fa-store"></i> ${sellerName}</span>
            <span><i class="far fa-heart"></i> ${isFav ? 'Saved' : 'Save'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// VIEW PRODUCT / SERVICE / LAND / CATEGORY / STORE
// ============================================================
window.viewProduct = function(productId) {
  window.location.href = `/detail.html?id=${productId}`;
};

window.viewService = function(serviceId) {
  window.location.href = `/service.html?id=${serviceId}`;
};

window.viewLand = function(landId) {
  window.location.href = `/land-detail.html?id=${landId}`;
};

// Route based on which cache contains the item — for mixed contexts
window.viewAnyItem = function(id) {
  const type = getItemType(id);
  if (type === 'land') return window.viewLand(id);
  return window.viewProduct(id);
};

window.loadCategory = function(slug) {
  window.location.href = `/category.html?slug=${slug}`;
};

window.viewStore = function(sellerId) {
  window.location.href = `/store.html?id=${sellerId}`;
};

// ============================================================
// POST AD BUTTONS
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  const postAdCta = document.getElementById('postAdCta');
  const fabPostAd = document.getElementById('fabPostAd');

  const postAction = () => {
    if (!currentUser) {
      openSignup();
    } else {
      window.location.href = '/post.html';
    }
  };

  if (postAdCta) postAdCta.addEventListener('click', postAction);
  if (fabPostAd) fabPostAd.addEventListener('click', postAction);

  initTheme();
  updateFavoriteBadge();
});

// ============================================================
// SEARCH HANDLER (products + land combined)
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
      const items = await loadAllItems();
      const q = query.toLowerCase();
      const results = items.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q))
      ).slice(0, 5);

      if (results.length === 0) {
        acDropdown.innerHTML = `<div class="ac-item" style="justify-content:center;color:var(--text-secondary);">No results found</div>`;
      } else {
        acDropdown.innerHTML = results.map(p => {
          const firstImage = p.images && p.images.length > 0 ? p.images[0] : null;
          const isLand = isLandItem(p);
          const icon = isLand ? '🏞️' : '📦';
          const fallbackImg = `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2236%22 height=%2236%22%3E%3Crect width=%2236%22 height=%2236%22 fill=%22%23d6e1ed%22/%3E%3Ctext x=%228%22 y=%2224%22 font-size=%2220%22%3E${icon}%3C/text%3E%3C/svg%3E`;
          return `
            <div class="ac-item" onclick="viewAnyItem('${p.id}')">
              <img src="${firstImage || fallbackImg}" alt="">
              <span>${p.title}</span>
              <small>${p.category}${p.subcategory ? ' · ' + p.subcategory : ''}</small>
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
          const items = await loadAllItems();
          const query = q.toLowerCase();
          const filtered = items.filter(p =>
            (p.title && p.title.toLowerCase().includes(query)) ||
            (p.category && p.category.toLowerCase().includes(query)) ||
            (p.subcategory && p.subcategory.toLowerCase().includes(query)) ||
            (p.location && p.location.toLowerCase().includes(query))
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
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  loadUser();
  initTheme();
  updateFavoriteBadge();

  if (document.getElementById('stateSelect')) {
    initStateDropdown();
  }
});

// ============================================================
// EXPOSE GLOBAL FUNCTIONS
// ============================================================
window.getCurrentUser = getCurrentUser;
window.loadUser = loadUser;
window.signupUser = signupUser;
window.updateUserProfile = updateUserProfile;

// Products
window.loadProducts = loadProducts;
window.getProductsSync = getProductsSync;

// Land (mirrors products)
window.loadLand = loadLand;
window.getLandSync = getLandSync;
window.loadAllItems = loadAllItems;
window.getAllItemsSync = getAllItemsSync;
window.combineItems = combineItems;
window.isLandItem = isLandItem;
window.classifyLandItem = classifyLandItem;
window.formatTitleStatus = formatTitleStatus;
window.recommendLand = recommendLand;
window.renderLandListings = renderLandListings;

// Services
window.loadServices = loadServices;
window.getServicesSync = getServicesSync;

// Categories, sellers, trending
window.loadCategories = loadCategories;
window.loadTopSellers = loadTopSellers;
window.loadTrendingKeywords = loadTrendingKeywords;

// Favorites
window.getFavorites = getFavorites;
window.saveFavorites = saveFavorites;
window.toggleFavorite = toggleFavorite;
window.isFavorite = isFavorite;
window.getFavoriteCount = getFavoriteCount;
window.updateFavoriteBadge = updateFavoriteBadge;
window.toggleFavoriteCard = toggleFavoriteCard;

// Render
window.renderListings = renderListings;
window.renderServices = renderServices;

// Routing
window.viewProduct = viewProduct;
window.viewLand = viewLand;
window.viewAnyItem = viewAnyItem;
window.viewService = viewService;
window.loadCategory = loadCategory;
window.viewStore = viewStore;
window.getItemType = getItemType;
window.resolveItemById = resolveItemById;

// Theme / signup / state
window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
window.openSignup = openSignup;
window.initStateDropdown = initStateDropdown;

// Recommendation
window.getUserState = getUserState;
window.recommendProducts = recommendProducts;
window.recommendServices = recommendServices;

// Seller helpers
window.getSellerName = getSellerName;
window.getSellerPic = getSellerPic;
window.getSellerRating = getSellerRating;
window.getSellerInitials = getSellerInitials;
window.getTradeName = getTradeName;
window.normalizeService = normalizeService;

console.log('Zaure – Nigeria\'s most trusted online marketplace.');