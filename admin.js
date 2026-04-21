/* ============================================
   ALTIN PINARI KUYUMCULUK - ADMIN ADMIN.JS
   Firebase Realtime Database Management
   ============================================ */

const firebaseConfig = {
  apiKey: "AIzaSyBlNarV8jgQ2RK1QDxn0mj4XxhTyk2Zf_8",
  authDomain: "altinpinari-panel.firebaseapp.com",
  databaseURL: "https://altinpinari-panel-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "altinpinari-panel",
  storageBucket: "altinpinari-panel.firebasestorage.app",
  messagingSenderId: "956494971184",
  appId: "1:956494971184:web:be9364217e1f6be4d2c8f5",
  measurementId: "G-N90R7RKCFP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// DOM Elements
const elements = {
  loading: document.getElementById('loading-overlay'),
  loginContainer: document.getElementById('login-container'),
  adminDashboard: document.getElementById('admin-dashboard'),
  loginForm: document.getElementById('login-form'),
  loginError: document.getElementById('login-error'),
  logoutBtn: document.getElementById('logout-btn'),
  maintenanceToggle: document.getElementById('maintenance-toggle'),
  maintenanceLabel: document.getElementById('maintenance-status-label'),
  satisMarkup: document.getElementById('satis-markup'),
  adjustmentsBody: document.getElementById('adjustments-body'),
  statusAlert: document.getElementById('status-alert')
};

// Connection Monitoring
db.ref(".info/connected").on("value", (snap) => {
  const statusEl = document.getElementById('connection-status');
  if (statusEl) {
    if (snap.val() === true) {
      statusEl.textContent = 'Bağlı';
      statusEl.style.color = '#00CC88';
    } else {
      statusEl.textContent = 'Bağlantı Kesildi';
      statusEl.style.color = '#FF4D4D';
    }
  }
});

// --- Auth Monitoring ---
auth.onAuthStateChanged(user => {
  if (elements.loading) elements.loading.classList.add('hidden');
  if (user) {
    showAdmin(user);
    console.log("User logged in:", user.email);
  } else {
    showLogin();
  }
});

// --- Login / Logout ---
elements.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    elements.loginError.textContent = '';
    await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    console.error(error);
    elements.loginError.textContent = 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
  }
});

elements.logoutBtn.addEventListener('click', () => {
  auth.signOut();
});

function showLogin() {
  elements.loginContainer.classList.remove('hidden');
  elements.adminDashboard.classList.add('hidden');
}

function showAdmin(user) {
  elements.loginContainer.classList.add('hidden');
  elements.adminDashboard.classList.remove('hidden');
  loadConfig();
  trackLiveVisitors();
}

// --- Live Visitor Tracking ---
function trackLiveVisitors() {
  db.ref('presence').on('value', snapshot => {
    const onlineEl = document.getElementById('online-count');
    const locationEl = document.getElementById('visitor-locations');
    
    if (!snapshot.exists()) {
      if (onlineEl) onlineEl.textContent = '0';
      if (locationEl) locationEl.innerHTML = '<span class="empty-list">Kimse yok</span>';
      return;
    }

    const visitors = snapshot.val();
    const count = snapshot.numChildren();
    
    // Count by city
    const cityCounts = {};
    Object.values(visitors).forEach(v => {
      const city = v.city || 'Bilinmiyor';
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    // Update count
    if (onlineEl) {
      onlineEl.textContent = count;
      onlineEl.style.transform = 'scale(1.1)';
      setTimeout(() => onlineEl.style.transform = 'scale(1)', 200);
    }

    // Update locations list
    if (locationEl) {
      const locationHtml = Object.entries(cityCounts)
        .map(([city, num]) => `<strong>${city}</strong>${num > 1 ? ` (${num})` : ''}`)
        .join(', ');
      locationEl.innerHTML = locationHtml || '<span class="empty-list">Bilinmiyor</span>';
    }
  });
}

// --- Config Management ---
const codesToAdjust = [
  { code: 'C', name: 'Çeyrek' },
  { code: 'EC', name: 'Eski Çeyrek' },
  { code: 'Y', name: 'Yarım' },
  { code: 'EY', name: 'Eski Yarım' },
  { code: 'T', name: 'Teklik' },
  { code: 'ET', name: 'Eski Teklik' },
  { code: 'G', name: 'Gremse' },
  { code: 'EG', name: 'Eski Gremse' },
  { code: 'A', name: 'Ata Lira' },
  { code: 'A5', name: 'Ata Beşli' },
  { code: 'R', name: 'Reşat Altın' },
  { code: 'B', name: '22 Ayar Bilezik' },
  { code: '14', name: '14 Ayar' },
  { code: '18', name: '18 Ayar' },
  { code: 'G1', name: 'Gram Altın (G1)' },
  { code: 'G5', name: '5 Gram Altın' },
  { code: 'G10', name: '10 Gram Altın' },
  { code: 'G20', name: '20 Gram Altın' },
  { code: 'G50', name: '50 Gram Altın' },
  { code: 'G100', name: '100 Gram Altın' },
  { code: 'HH_T', name: 'Has Altın' },
  { code: 'CH_T', name: 'Külçe Toptan' },
  { code: 'XAUUSD', name: 'ONS' }
];

async function loadConfig() {
  db.ref('config').on('value', snapshot => {
    const data = snapshot.val() || {};
    console.log("Panel verisi yüklendi:", data);
    
    // Maintenance Toggle
    elements.maintenanceToggle.checked = !!data.maintenanceMode;
    elements.maintenanceLabel.textContent = data.maintenanceMode ? 'BAKIM MODU AÇIK' : 'Normal';
    elements.maintenanceLabel.style.color = data.maintenanceMode ? 'var(--error-color)' : 'var(--success-color)';
    
    // Markup
    if (data.satisMarkup !== undefined) {
      elements.satisMarkup.value = data.satisMarkup;
    }

    // Görünüm Ayarları (Yeni - Ayrı ayrı)
    if (data.appearance) {
      if (document.getElementById('font-select-medium')) document.getElementById('font-select-medium').value = data.appearance.mediumFont || 'standard';
      if (document.getElementById('color-select-medium')) document.getElementById('color-select-medium').value = data.appearance.mediumColor || 'colored';
      if (document.getElementById('font-select-mobile')) document.getElementById('font-select-mobile').value = data.appearance.mobileFont || 'standard';
      if (document.getElementById('color-select-mobile')) document.getElementById('color-select-mobile').value = data.appearance.mobileColor || 'colored';
      if (document.getElementById('show-trends-toggle')) document.getElementById('show-trends-toggle').checked = !!data.appearance.showTrendsInStaticMode;
      
      // Ürün Görünürlüğü Gridini Oluştur
      renderProductVisibilityGrid(data.appearance.mediumProductVisibility || {});
    }

    // TV Ekran Düzeni Yükle
    loadLayoutSettings(data.tvLayout || {});

    // Adjustments Table
    renderAdjustments(data.adjustments || {});
  }, error => {
    console.error("Veritabanı okuma hatası:", error);
    showAlert('Erişim Yetkisi Yok: ' + error.message, 'error');
  });
}

function renderProductVisibilityGrid(visibility) {
  const grid = document.getElementById('product-visibility-grid');
  if (!grid) return;

  // Görünmesini istediğimiz ürünler
  const items = codesToAdjust;

  let html = '';
  items.forEach(item => {
    const isVisible = visibility[item.code] !== false; // Varsayılan açık
    html += `
      <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px;">
        <span style="font-size: 0.75rem; font-weight: 600;">${item.name}</span>
        <div class="toggle-switch">
          <label class="switch">
            <input type="checkbox" ${isVisible ? 'checked' : ''} onchange="saveProductVisibility('${item.code}', this.checked)">
            <span class="slider round"></span>
          </label>
        </div>
      </div>
    `;
  });
  grid.innerHTML = html;
}

window.saveProductVisibility = function(code, isVisible) {
  db.ref(`config/appearance/mediumProductVisibility/${code}`).set(isVisible)
    .then(() => showAlert('Ürün görünürlüğü güncellendi.', 'success'))
    .catch(err => showAlert('Hata: ' + err.message, 'error'));
};

window.saveAppearanceToggle = function(field, value) {
  db.ref('config/appearance/' + field).set(value)
    .then(() => showAlert('Ayar güncellendi.', 'success'))
    .catch(err => showAlert('Hata: ' + err.message, 'error'));
};

window.saveAppearance = function(mode, type) {
  const elementId = type === 'font' ? `font-select-${mode}` : `color-select-${mode}`;
  const value = document.getElementById(elementId).value;
  const dbPath = type === 'font' ? `appearance/${mode}Font` : `appearance/${mode}Color`;
  
  db.ref('config/' + dbPath).set(value)
    .then(() => showAlert('Görünüm ayarı kaydedildi.', 'success'))
    .catch(err => showAlert('Hata: ' + err.message, 'error'));
};

function renderAdjustments(adjustments) {
  let html = '';
  codesToAdjust.forEach(item => {
    const adj = adjustments[item.code] || { alis: 0, satis: 0 };
    html += `
      <tr>
        <td><strong>${item.name}</strong><br><small>${item.code}</small></td>
        <td><input type="number" id="adj-alis-${item.code}" value="${adj.alis || 0}"></td>
        <td><input type="number" id="adj-satis-${item.code}" value="${adj.satis || 0}"></td>
        <td><button class="btn-inline" onclick="saveAdjustment('${item.code}')">✓</button></td>
      </tr>
    `;
  });
  elements.adjustmentsBody.innerHTML = html;
}

// --- Actions ---
elements.maintenanceToggle.addEventListener('change', async (e) => {
  const active = e.target.checked;
  
  try {
    // UI'daki yazıyı hemen değiştir (beklemeden)
    elements.maintenanceLabel.textContent = active ? 'Yükleniyor...' : 'Yükleniyor...';
    
    await db.ref('config/maintenanceMode').set(active);
    
    // Başarılı olduğunda zaten loadConfig tetiklenecek ve label düzelecek
    showAlert('Site durumu güncellendi.', 'success');
  } catch (error) {
    console.error("Bakım modu hatası:", error);
    // Hata durumunda toggle'ı eski haline getir
    e.target.checked = !active;
    loadConfig(); // State'i veritabanından geri çek
    showAlert('Hata: ' + error.message, 'error');
  }
});

// Font ve Renk Ayarları Kaydetme İşlemleri butonlar üzerinden (window.saveFontFamily vb.) yürütülmektedir.

// Font ve Renk Ayarları Kaydetme İşlemleri saveAppearance üzerinden yürütülmektedir.


window.updateConfigField = function(field, inputId) {
  const value = parseFloat(document.getElementById(inputId).value);
  if (isNaN(value)) return showAlert('Lütfen geçerli bir sayı girin.', 'error');
  
  db.ref('config/' + field).set(value)
    .then(() => showAlert('Ayarlar kaydedildi.', 'success'))
    .catch(err => showAlert('Hata: ' + err.message, 'error'));
};

window.saveAdjustment = function(code) {
  const alis = parseFloat(document.getElementById(`adj-alis-${code}`).value) || 0;
  const satis = parseFloat(document.getElementById(`adj-satis-${code}`).value) || 0;
  
  db.ref(`config/adjustments/${code}`).set({ alis, satis })
    .then(() => showAlert(`${code} ayarları güncellendi.`, 'success'))
    .catch(err => showAlert('Hata: ' + err.message, 'error'));
};

function showAlert(msg, type) {
  elements.statusAlert.textContent = msg;
  elements.statusAlert.className = `alert ${type}`;
  elements.statusAlert.classList.remove('hidden');
  setTimeout(() => {
    elements.statusAlert.classList.add('hidden');
  }, 3000);
}

// --- Section Switching Logic ---
window.switchSection = function(sectionId, navElement) {
  // Tüm bölümleri gizle
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Seçilen bölümü göster
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Menü öğelerini güncelle (aktif sınıfı)
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  if (navElement) {
    navElement.classList.add('active');
  }
};

// --- TV Layout Yönetimi ---
const WIDGET_LABELS = {
  sarrafiye: 'Sarrafiye (Birleşik)',
  eskisarrafiye: 'Eski Sarrafiye',
  yenisarrafiye: 'Yeni Sarrafiye',
  gram: 'Gram Altın',
  altin: 'ONS / Has Altın',
  iban: 'IBAN / Banka',
  youtube: 'YouTube',
  gizli: 'Gizli'
};

function loadLayoutSettings(layout) {
  const ltEl  = document.getElementById('layout-zone-lefttop');
  const lbEl  = document.getElementById('layout-zone-leftbottom');
  const topEl = document.getElementById('layout-zone-topright');
  const botEl = document.getElementById('layout-zone-bottomright');
  const ytEl  = document.getElementById('youtube-url-input');
  const b1name = document.getElementById('iban-bank1-name');
  const b1iban = document.getElementById('iban-bank1-iban');
  const b2name = document.getElementById('iban-bank2-name');
  const b2iban = document.getElementById('iban-bank2-iban');
  const accName = document.getElementById('iban-account-name');

  // Geriye dönük uyumluluk: eski kaydedilmiş 'zoneLeft' → 'zoneLeftTop'
  const savedLeftTop = layout.zoneLeftTop || layout.zoneLeft || 'sarrafiye';

  if (ltEl)  ltEl.value  = savedLeftTop;
  if (lbEl)  lbEl.value  = layout.zoneLeftBottom || 'yenisarrafiye';
  if (topEl) topEl.value = layout.zoneTopRight   || 'gram';
  if (botEl) botEl.value = layout.zoneBottomRight || 'altin';
  if (ytEl && layout.youtubeUrl) ytEl.value = layout.youtubeUrl;
  if (layout.iban) {
    if (b1name) b1name.value = layout.iban.bank1Name  || '';
    if (b1iban) b1iban.value = layout.iban.bank1Iban  || '';
    if (b2name) b2name.value = layout.iban.bank2Name  || '';
    if (b2iban) b2iban.value = layout.iban.bank2Iban  || '';
    if (accName) accName.value = layout.iban.accountName || '';
  }

  updateLayoutPreview();
}

window.updateLayoutPreview = function() {
  const ltVal  = document.getElementById('layout-zone-lefttop')?.value    || 'sarrafiye';
  const lbVal  = document.getElementById('layout-zone-leftbottom')?.value || 'yenisarrafiye';
  const topVal = document.getElementById('layout-zone-topright')?.value   || 'gram';
  const botVal = document.getElementById('layout-zone-bottomright')?.value || 'altin';

  const ltLabel  = document.getElementById('preview-lefttop-label');
  const lbLabel  = document.getElementById('preview-leftbottom-label');
  const topLabel = document.getElementById('preview-topright-label');
  const botLabel = document.getElementById('preview-bottomright-label');

  if (ltLabel)  ltLabel.textContent  = WIDGET_LABELS[ltVal]  || ltVal;
  if (lbLabel)  lbLabel.textContent  = WIDGET_LABELS[lbVal]  || lbVal;
  if (topLabel) topLabel.textContent = WIDGET_LABELS[topVal] || topVal;
  if (botLabel) botLabel.textContent = WIDGET_LABELS[botVal] || botVal;

  const colors = {
    sarrafiye: '#C8971A', eskisarrafiye: '#b8731a', yenisarrafiye: '#d4a843',
    gram: '#2196F3', altin: '#9C27B0',
    iban: '#4CAF50', youtube: '#F44336', gizli: '#555'
  };

  [
    { id: 'preview-zone-lefttop',    val: ltVal },
    { id: 'preview-zone-leftbottom', val: lbVal },
    { id: 'preview-zone-topright',   val: topVal },
    { id: 'preview-zone-bottomright', val: botVal }
  ].forEach(({ id, val }) => {
    const el = document.getElementById(id);
    if (el) el.style.borderColor = colors[val] || 'var(--border)';
  });
};

window.saveLayoutSettings = function() {
  const ltVal  = document.getElementById('layout-zone-lefttop')?.value    || 'sarrafiye';
  const lbVal  = document.getElementById('layout-zone-leftbottom')?.value || 'yenisarrafiye';
  const topVal = document.getElementById('layout-zone-topright')?.value   || 'gram';
  const botVal = document.getElementById('layout-zone-bottomright')?.value || 'altin';
  const ytUrl  = document.getElementById('youtube-url-input')?.value      || '';
  const b1name = document.getElementById('iban-bank1-name')?.value  || '';
  const b1iban = document.getElementById('iban-bank1-iban')?.value  || '';
  const b2name = document.getElementById('iban-bank2-name')?.value  || '';
  const b2iban = document.getElementById('iban-bank2-iban')?.value  || '';
  const accName = document.getElementById('iban-account-name')?.value || '';

  const layoutData = {
    zoneLeftTop:    ltVal,
    zoneLeftBottom: lbVal,
    zoneTopRight:   topVal,
    zoneBottomRight: botVal,
    youtubeUrl: ytUrl,
    iban: { bank1Name: b1name, bank1Iban: b1iban, bank2Name: b2name, bank2Iban: b2iban, accountName: accName }
  };

  db.ref('config/tvLayout').set(layoutData)
    .then(() => showAlert('✅ Ekran düzeni kaydedildi!', 'success'))
    .catch(err => showAlert('Hata: ' + err.message, 'error'));
};
