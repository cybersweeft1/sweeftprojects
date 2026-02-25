/**
 * projects.js - Frontend logic for Cyber Sweeft Project Store
 * Updated to support nested School/Department structure with dropdown filters
 */

const APP_CONFIG = {
  PAYSTACK_PUBLIC_KEY: '', // Loaded from server
  FIXED_PRICE: 2500,
  STORAGE_KEY: 'cybersweeft_purchases_v1',
  PROJECTS_URL: 'projects.json',
  GITHUB_RAW_BASE: 'https://raw.githubusercontent.com/cybersweeft/cybersweeft/main'
};

let allProjects = [];
let filteredProjects = [];
let currentPurchase = null;
let schoolsData = []; // Store schools data for filtering

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  await loadProjects();
  setupEventListeners();
  checkPaymentCallback();
  applySavedTheme();
});

async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    APP_CONFIG.PAYSTACK_PUBLIC_KEY = config.PAYSTACK_PUBLIC_KEY;
  } catch (e) {
    const inline = document.getElementById('app-config')?.textContent;
    if (inline) {
      try {
        const data = JSON.parse(inline);
        APP_CONFIG.PAYSTACK_PUBLIC_KEY = data.PAYSTACK_PUBLIC_KEY;
      } catch (err) {
        console.error('Config parse error:', err);
      }
    }
  }
}

async function loadProjects() {
  try {
    const response = await fetch(`${APP_CONFIG.GITHUB_RAW_BASE}/projects.json?t=${Date.now()}`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    const data = await response.json();
    
    // Store schools data for filter population
    schoolsData = data.schools || [];
    
    allProjects = data.projects.map(p => ({
      ...p,
      driveDownloadUrl: `https://drive.google.com/uc?export=download&id=${p.driveId}`,
      viewUrl: `https://drive.google.com/file/d/${p.driveId}/view`
    }));
    
    filteredProjects = [...allProjects];
    renderFilters(schoolsData);
    renderProjects();
  } catch (error) {
    showError('Failed to load projects. Please refresh.');
    console.error('Load error:', error);
    // Render empty state
    const grid = document.getElementById('projectsGrid');
    if (grid) {
      grid.innerHTML = '<div class="no-results">Unable to load projects. Please check your connection and refresh.</div>';
    }
  }
}

// ==========================================
// RENDERING FILTERS (Dropdowns)
// ==========================================
function renderFilters(schools) {
  const container = document.getElementById('categoryFilters');
  if (!container) return;
  container.innerHTML = '';
  
  // Create flex container for dropdowns
  const filtersWrapper = document.createElement('div');
  filtersWrapper.className = 'filters-wrapper';
  
  // School Select
  const schoolWrapper = document.createElement('div');
  schoolWrapper.className = 'filter-group';
  
  const schoolLabel = document.createElement('label');
  schoolLabel.textContent = 'Select School:';
  schoolLabel.className = 'filter-label';
  
  const schoolSelect = document.createElement('select');
  schoolSelect.id = 'schoolSelect';
  schoolSelect.className = 'filter-select';
  
  // Add "All Schools" option
  const allSchoolsOpt = document.createElement('option');
  allSchoolsOpt.value = 'all';
  allSchoolsOpt.textContent = 'All Schools';
  schoolSelect.appendChild(allSchoolsOpt);
  
  // Add schools
  schools.forEach(school => {
    const opt = document.createElement('option');
    opt.value = school.name;
    opt.textContent = school.name;
    schoolSelect.appendChild(opt);
  });
  
  schoolWrapper.appendChild(schoolLabel);
  schoolWrapper.appendChild(schoolSelect);
  filtersWrapper.appendChild(schoolWrapper);
  
  // Department Select
  const deptWrapper = document.createElement('div');
  deptWrapper.className = 'filter-group';
  
  const deptLabel = document.createElement('label');
  deptLabel.textContent = 'Select Department:';
  deptLabel.className = 'filter-label';
  
  const deptSelect = document.createElement('select');
  deptSelect.id = 'deptSelect';
  deptSelect.className = 'filter-select';
  
  // Add "All Departments" option
  const allDeptsOpt = document.createElement('option');
  allDeptsOpt.value = 'all';
  allDeptsOpt.textContent = 'All Departments';
  deptSelect.appendChild(allDeptsOpt);
  
  // Add all departments initially
  schools.forEach(school => {
    school.departments.forEach(dept => {
      const opt = document.createElement('option');
      opt.value = dept;
      opt.textContent = dept;
      opt.dataset.school = school.name;
      deptSelect.appendChild(opt);
    });
  });
  
  deptWrapper.appendChild(deptLabel);
  deptWrapper.appendChild(deptSelect);
  filtersWrapper.appendChild(deptWrapper);
  
  container.appendChild(filtersWrapper);
  
  // Event listeners
  schoolSelect.addEventListener('change', (e) => {
    updateDepartmentOptions(e.target.value, schools);
    applyFilters();
  });
  
  deptSelect.addEventListener('change', applyFilters);
}

function updateDepartmentOptions(selectedSchool, schools) {
  const deptSelect = document.getElementById('deptSelect');
  if (!deptSelect) return;
  
  // Save current selection if valid
  const currentSelection = deptSelect.value;
  
  deptSelect.innerHTML = '';
  
  // Add "All Departments" option
  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = selectedSchool === 'all' ? 'All Departments' : 'All Departments in Selected School';
  deptSelect.appendChild(allOpt);
  
  if (selectedSchool === 'all') {
    // Add all departments from all schools
    schools.forEach(school => {
      const group = document.createElement('optgroup');
      group.label = school.name;
      
      school.departments.forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept;
        opt.textContent = dept;
        group.appendChild(opt);
      });
      
      deptSelect.appendChild(group);
    });
  } else {
    // Add only departments from selected school
    const school = schools.find(s => s.name === selectedSchool);
    if (school) {
      school.departments.forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept;
        opt.textContent = dept;
        deptSelect.appendChild(opt);
      });
    }
  }
  
  // Restore selection if still valid
  if (currentSelection !== 'all') {
    const options = Array.from(deptSelect.options);
    const stillExists = options.some(opt => opt.value === currentSelection);
    if (stillExists) {
      deptSelect.value = currentSelection;
    }
  }
}

// ==========================================
// PROJECT RENDERING
// ==========================================
function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  if (filteredProjects.length === 0) {
    grid.innerHTML = '<div class="no-results">No projects found for this selection.</div>';
    return;
  }
  
  const purchased = getPurchasedProjects();
  
  filteredProjects.forEach(project => {
    const isPurchased = purchased.includes(project.id);
    const card = createProjectCard(project, isPurchased);
    grid.appendChild(card);
  });
}

function createProjectCard(project, isPurchased) {
  const div = document.createElement('div');
  div.className = 'project-card';
  
  // Create CSS class from department name (category)
  const categoryClass = project.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  div.innerHTML = `
    <div class="project-header">
      <span class="project-category ${categoryClass}">${project.category}</span>
      ${isPurchased ? '<span class="purchased-badge"><i class="fas fa-check"></i> Owned</span>' : ''}
    </div>
    <div class="school-badge">
      <i class="fas fa-university"></i> ${project.school}
    </div>
    <h3 class="project-title">${project.name}</h3>
    <p class="project-desc">${project.description}</p>
    <div class="project-footer">
      <span class="project-price">₦${APP_CONFIG.FIXED_PRICE.toLocaleString()}</span>
      ${isPurchased 
        ? `<button class="download-btn-sm" onclick="directDownload('${project.id}')">
             <i class="fas fa-download"></i> Download
           </button>`
        : `<button class="buy-btn" onclick="initiatePurchase('${project.id}')">
             <i class="fas fa-lock"></i> Buy Now
           </button>`
      }
    </div>
  `;
  
  return div;
}

// ==========================================
// SEARCH & FILTER LOGIC
// ==========================================
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => applyFilters());
  }
  
  document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
}

function applyFilters() {
  const schoolSelect = document.getElementById('schoolSelect');
  const deptSelect = document.getElementById('deptSelect');
  const searchInput = document.getElementById('searchInput');
  
  const selectedSchool = schoolSelect ? schoolSelect.value : 'all';
  const selectedDept = deptSelect ? deptSelect.value : 'all';
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  filteredProjects = allProjects.filter(project => {
    // School filter
    if (selectedSchool !== 'all' && project.school !== selectedSchool) {
      return false;
    }
    
    // Department filter (stored in category field for compatibility)
    if (selectedDept !== 'all' && project.category !== selectedDept) {
      return false;
    }
    
    // Search filter (searches name, department, school, description)
    if (searchTerm) {
      const searchableText = `${project.name} ${project.category} ${project.school} ${project.description}`.toLowerCase();
      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  });
  
  renderProjects();
}

// Legacy function for backward compatibility (if called elsewhere)
function filterByCategory(category) {
  const deptSelect = document.getElementById('deptSelect');
  if (deptSelect) {
    deptSelect.value = category;
    applyFilters();
  }
}

function handleSearch(query) {
  // Integrated into applyFilters now, but kept for compatibility
  applyFilters();
}

// ==========================================
// PURCHASE FLOW (Unchanged - Keep as is)
// ==========================================
function initiatePurchase(projectId) {
  const project = allProjects.find(p => p.id === projectId);
  if (!project) return;
  
  if (getPurchasedProjects().includes(projectId)) {
    directDownload(projectId);
    return;
  }
  
  showPurchaseModal(project);
}

function showPurchaseModal(project) {
  const modal = document.getElementById('purchaseModal');
  const title = document.getElementById('modalProjectTitle');
  const emailInput = document.getElementById('buyerEmail');
  
  if (!modal || !title || !emailInput) return;
  
  title.textContent = project.name;
  emailInput.value = '';
  currentPurchase = project;
  
  modal.classList.add('show');
  emailInput.focus();
}

function closeModal() {
  document.getElementById('purchaseModal')?.classList.remove('show');
  currentPurchase = null;
}

function confirmPurchase() {
  const email = document.getElementById('buyerEmail')?.value.trim();
  
  if (!email || !email.includes('@')) {
    showModalError('Please enter a valid email address');
    return;
  }
  
  if (!currentPurchase) return;
  
  processPayment(email, currentPurchase);
}

function processPayment(email, project) {
  const btn = document.getElementById('confirmBuyBtn');
  if (!btn) return;
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  
  const handler = PaystackPop.setup({
    key: APP_CONFIG.PAYSTACK_PUBLIC_KEY,
    email: email,
    amount: APP_CONFIG.FIXED_PRICE * 100,
    currency: 'NGN',
    ref: `PRJ_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    metadata: {
      custom_fields: [
        { display_name: "Project", variable_name: "project_name", value: project.name },
        { display_name: "Project ID", variable_name: "project_id", value: project.id },
        { display_name: "Department", variable_name: "department", value: project.category },
        { display_name: "School", variable_name: "school", value: project.school }
      ],
      project_id: project.id
    },
    callback: (response) => onPaymentSuccess(response, project),
    onClose: () => {
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-lock"></i> Pay ₦${APP_CONFIG.FIXED_PRICE.toLocaleString()}`;
    }
  });
  
  handler.openIframe();
}

function onPaymentSuccess(response, project) {
  closeModal();
  recordPurchase(project.id);
  showDownloadScreen(project, response.reference);
  setTimeout(() => { executeDownload(project); }, 1000);
}

// ==========================================
// DOWNLOAD HANDLING (Unchanged)
// ==========================================
function showDownloadScreen(project, reference) {
  const screen = document.getElementById('downloadScreen');
  const title = document.getElementById('downloadProjectTitle');
  const ref = document.getElementById('transactionRef');
  
  if (!screen || !title || !ref) return;
  
  title.textContent = project.name;
  ref.textContent = reference;
  
  const projectsGrid = document.getElementById('projectsGrid');
  const categoryFilters = document.getElementById('categoryFilters');
  const searchSection = document.querySelector('.search-section');
  
  if (projectsGrid) projectsGrid.style.display = 'none';
  if (categoryFilters) categoryFilters.style.display = 'none';
  if (searchSection) searchSection.style.display = 'none';
  
  screen.classList.add('show');
}

function executeDownload(project) {
  const url = project.driveDownloadUrl;
  
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/\s+/g, '_')}.pdf`;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    document.body.removeChild(iframe);
  }, 5000);
  
  showNotification('Download started!', 'success');
}

function directDownload(projectId) {
  const project = allProjects.find(p => p.id === projectId);
  if (!project) return;
  if (!getPurchasedProjects().includes(projectId)) {
    initiatePurchase(projectId);
    return;
  }
  executeDownload(project);
}

function retryDownload() {
  const lastPurchase = sessionStorage.getItem('last_purchase');
  if (lastPurchase) {
    try {
      const project = JSON.parse(lastPurchase);
      executeDownload(project);
      showNotification('Download restarted', 'success');
    } catch (e) {
      showNotification('Error restarting download', 'error');
    }
  } else {
    showNotification('No recent purchase found', 'error');
  }
}

function returnToStore() {
  const screen = document.getElementById('downloadScreen');
  const projectsGrid = document.getElementById('projectsGrid');
  const categoryFilters = document.getElementById('categoryFilters');
  const searchSection = document.querySelector('.search-section');
  
  if (screen) screen.classList.remove('show');
  if (projectsGrid) projectsGrid.style.display = 'grid';
  if (categoryFilters) categoryFilters.style.display = 'flex';
  if (searchSection) searchSection.style.display = 'block';
  currentPurchase = null;
}

// ==========================================
// PURCHASE TRACKING (Unchanged)
// ==========================================
function getPurchasedProjects() {
  try {
    const data = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
}

function recordPurchase(projectId) {
  const purchased = getPurchasedProjects();
  if (!purchased.includes(projectId)) {
    purchased.push(projectId);
    localStorage.setItem(APP_CONFIG.STORAGE_KEY, JSON.stringify(purchased));
  }
  const project = allProjects.find(p => p.id === projectId);
  if (project) {
    sessionStorage.setItem('last_purchase', JSON.stringify(project));
  }
}

// ==========================================
// CALLBACK & VERIFICATION (Unchanged)
// ==========================================
function checkPaymentCallback() {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get('reference');
  const projectId = params.get('project');
  if (reference && projectId) verifyAndDownload(reference, projectId);
}

async function verifyAndDownload(reference, projectId) {
  showNotification('Verifying payment...', 'processing');
  try {
    const response = await fetch(`/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference })
    });
    const result = await response.json();
    if (result.verified) {
      const project = allProjects.find(p => p.id === projectId);
      if (project) {
        recordPurchase(projectId);
        showDownloadScreen(project, reference);
        setTimeout(() => executeDownload(project), 500);
      }
    } else {
      showNotification('Payment verification failed', 'error');
    }
  } catch (error) { 
    console.error('Verification error:', error);
    showNotification('Verification error', 'error');
  }
  window.history.replaceState({}, document.title, window.location.pathname);
}

// ==========================================
// UI HELPERS (Unchanged)
// ==========================================
function showNotification(message, type = 'info') {
  const notif = document.getElementById('notification');
  if (!notif) return;
  notif.textContent = message;
  notif.className = `notification show ${type}`;
  setTimeout(() => notif.classList.remove('show'), 5000);
}

function showError(msg) { showNotification(msg, 'error'); }

function showModalError(msg) {
  const err = document.getElementById('modalError');
  if (err) {
    err.textContent = msg;
    err.style.display = 'block';
    setTimeout(() => err.style.display = 'none', 3000);
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  updateThemeIcon(!isDark);
}

function applySavedTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcon(true);
  }
}

function updateThemeIcon(isDark) {
  const btn = document.getElementById('themeBtn');
  if (btn) btn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}
