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
  { code: 'GA', name: 'Gram Altın' },
  { code: 'GAT', name: 'Gram Toptan' },
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

    // Adjustments Table
    renderAdjustments(data.adjustments || {});
  }, error => {
    console.error("Veritabanı okuma hatası:", error);
    showAlert('Erişim Yetkisi Yok: ' + error.message, 'error');
  });
}

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
