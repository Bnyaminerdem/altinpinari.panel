/**
 * ALTIN PINARI - ADMIN.JS
 * Firebase Realtime Database Integration
 */

// --- FIREBASE CONFIG (USER SHOULD REPLACE THIS) ---
const firebaseConfig = {
  apiKey: "AIzaSyBlNarV8jgQ2RK1QDxn0mj4XxhTyk2Zf_8",
  authDomain: "altinpinari-panel.firebaseapp.com",
  databaseURL: "https://altinpinari-panel-default-rtdb.firebaseio.com",
  projectId: "altinpinari-panel",
  storageBucket: "altinpinari-panel.firebasestorage.app",
  messagingSenderId: "956494971184",
  appId: "1:956494971184:web:be9364217e1f6be4d2c8f5",
  measurementId: "G-N90R7RKCFP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// --- STATE ---
let configData = {
    satisMarkup: 20,
    maintenanceMode: false,
    satisAdjustment: {}
};

const DISPLAY_NAMES = {
    'C': 'Çeyrek',  'EC': 'Eski Çeyrek',
    'Y': 'Yarım',   'EY': 'Eski Yarım',
    'T': 'Teklik',  'ET': 'Eski Teklik',
    'G': 'Gremse',  'EG': 'Eski Gremse',
    'A': 'Ata Lira',       'A5': 'Ata Beşli',
    'R': 'Reşat Altın',    'H': 'Hamit Altın',
    'GA': 'Gram Altın',    'GAT': 'Gram Toptan',
    'HH_T': 'Has Altın',   'CH_T': 'Külçe Toptan',
    'A_T': 'Ata Toptan',   'B': '22 Ayar Bilezik',
    '18': '18 Ayar Altın', '14': '14 Ayar Altın',
    'XAUUSD': 'ONS',       'AG_T': 'Gümüş',
    'G1': 'Gram Altın (1g)',
    'G5': '24 Ayar 5 Gram',
    'G10': '24 Ayar 10 Gram',
    'G20': '24 Ayar 20 Gram',
    'G50': '24 Ayar 50 Gram',
    'G100': '24 Ayar 100 Gram'
};

const PRODUCT_CODES = [
    'C', 'EC', 'Y', 'EY', 'T', 'ET', 'G', 'EG', 'A', 'A5', 'R', 
    'G1', 'G5', 'G10', 'G20', 
    'HH_T', 'CH_T', 'B', '18', '14', 'XAUUSD'
];

// --- AUTHENTICATION ---
const loginOverlay = document.getElementById('login-overlay');
const adminContent = document.getElementById('admin-content');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        // Login success handled by onAuthStateChanged
    } catch (error) {
        loginError.textContent = "Hatalı giriş! Lütfen bilgilerinizi kontrol edin.";
        console.error(error);
    }
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

auth.onAuthStateChanged(user => {
    if (user) {
        loginOverlay.classList.add('hidden');
        adminContent.classList.remove('hidden');
        loadData();
    } else {
        loginOverlay.classList.remove('hidden');
        adminContent.classList.add('hidden');
    }
});

// --- DATA LOGIC ---
function loadData() {
    db.ref('config').on('value', snapshot => {
        const data = snapshot.val();
        if (data) {
            configData = data;
            if (!configData.satisAdjustment) configData.satisAdjustment = {};
            updateUI();
        } else {
            // İlk kurulum
            saveData();
        }
    });
}

function updateUI() {
    // Maintenance Mode
    document.getElementById('maintenance-toggle').checked = configData.maintenanceMode;
    
    // Global Markup
    document.getElementById('global-markup').value = configData.satisMarkup;
    
    // Product List
    const list = document.getElementById('product-adjustments-list');
    list.innerHTML = '';
    
    PRODUCT_CODES.forEach(code => {
        const val = configData.satisAdjustment[code] || 0;
        const name = DISPLAY_NAMES[code] || code;
        
        const item = document.createElement('div');
        item.className = 'product-item';
        item.innerHTML = `
            <div class="product-info">
                <span class="product-name">${name}</span>
                <span class="product-code">${code}</span>
            </div>
            <div class="product-controls">
                <button class="adjust-btn minus" onclick="adjustProductValue('${code}', -5)">-</button>
                <input type="number" value="${val}" onchange="setProductValue('${code}', this.value)">
                <button class="adjust-btn plus" onclick="adjustProductValue('${code}', 5)">+</button>
                <span class="unit">TL</span>
            </div>
        `;
        list.appendChild(item);
    });
}

// --- ACTIONS ---
window.adjustValue = (id, amount) => {
    const input = document.getElementById(id);
    let val = parseInt(input.value) + amount;
    input.value = val;
    
    if (id === 'global-markup') {
        configData.satisMarkup = val;
    }
    saveData();
};

window.adjustProductValue = (code, amount) => {
    const current = configData.satisAdjustment[code] || 0;
    configData.satisAdjustment[code] = current + amount;
    saveData();
};

window.setProductValue = (code, value) => {
    configData.satisAdjustment[code] = parseInt(value) || 0;
    saveData();
};

document.getElementById('maintenance-toggle').addEventListener('change', (e) => {
    configData.maintenanceMode = e.target.checked;
    saveData();
});

document.getElementById('global-markup').addEventListener('change', (e) => {
    configData.satisMarkup = parseInt(e.target.value) || 0;
    saveData();
});

let saveTimeout;
function saveData() {
    const status = document.getElementById('save-status');
    status.textContent = "Kaydediliyor...";
    status.classList.add('show');
    status.style.color = "var(--gold)";

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        db.ref('config').set(configData)
            .then(() => {
                status.textContent = "Tüm değişiklikler kaydedildi.";
                status.style.color = "var(--success)";
                setTimeout(() => {
                    status.classList.remove('show');
                }, 2000);
            })
            .catch(err => {
                status.textContent = "Hata oluştu!";
                status.style.color = "var(--error)";
                console.error(err);
            });
    }, 500); // Debounce saves
}
