// Storage keys
const STORAGE_KEYS = {
    MEDICATIONS: 'medications',
    DAILY_STATUS: 'dailyStatus',
    LAST_RESET: 'lastReset'
};

// State management
let medications = [];
let dailyStatus = {};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    loadSettings();
    checkAndResetDaily();
    updateCurrentDate();
    renderMedicationList();
    updateProgress();
}

function setupEventListeners() {
    // Settings modal
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeModal').addEventListener('click', closeSettings);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    
    // Medication management
    document.getElementById('addMedication').addEventListener('click', addMedication);
    document.getElementById('newMedication').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addMedication();
    });
    document.getElementById('newMedicationAmount').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addMedication();
    });
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetDay);
    
    // Close modal on outside click
    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') closeSettings();
    });
}

// Load settings from localStorage
function loadSettings() {
    const storedMedications = localStorage.getItem(STORAGE_KEYS.MEDICATIONS);
    const storedStatus = localStorage.getItem(STORAGE_KEYS.DAILY_STATUS);
    
    if (storedMedications) {
        medications = JSON.parse(storedMedications);
    }
    
    if (storedStatus) {
        dailyStatus = JSON.parse(storedStatus);
    }
}

// Save settings to localStorage
function saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(medications));
    localStorage.setItem(STORAGE_KEYS.DAILY_STATUS, JSON.stringify(dailyStatus));
}

// Check if we need to reset for a new day
function checkAndResetDaily() {
    const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);
    const today = new Date().toDateString();
    
    if (lastReset !== today) {
        // New day - reset all checkboxes
        dailyStatus = {};
        localStorage.setItem(STORAGE_KEYS.LAST_RESET, today);
        saveToStorage();
    }
}

// Update current date display
function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = new Date().toLocaleDateString('de-DE', options);
    document.getElementById('currentDate').textContent = dateString;
}

// Render medication list
function renderMedicationList() {
    const listContainer = document.getElementById('medicationList');
    const emptyState = document.getElementById('emptyState');
    
    if (medications.length === 0) {
        listContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    listContainer.style.display = 'block';
    emptyState.style.display = 'none';
    listContainer.innerHTML = '';
    
    medications.forEach((med, index) => {
        const medName = typeof med === 'string' ? med : med.name;
        const medAmount = typeof med === 'string' ? '' : (med.amount || '');
        const medId = medName;
        
        const item = document.createElement('div');
        item.className = 'medication-item' + (dailyStatus[medId] ? ' checked' : '');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `med-${index}`;
        checkbox.checked = dailyStatus[medId] || false;
        checkbox.addEventListener('change', () => toggleMedication(medId));
        
        const label = document.createElement('label');
        label.htmlFor = `med-${index}`;
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'med-name-display';
        nameSpan.textContent = medName;
        label.appendChild(nameSpan);
        
        if (medAmount) {
            const amountSpan = document.createElement('span');
            amountSpan.className = 'med-amount-display';
            amountSpan.textContent = medAmount;
            label.appendChild(amountSpan);
        }
        
        item.appendChild(checkbox);
        item.appendChild(label);
        
        item.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                toggleMedication(medId);
            }
        });
        
        listContainer.appendChild(item);
    });
}

// Toggle medication status
function toggleMedication(medName) {
    dailyStatus[medName] = !dailyStatus[medName];
    saveToStorage();
    renderMedicationList();
    updateProgress();
}

// Update progress bar
function updateProgress() {
    const total = medications.length;
    const completed = Object.values(dailyStatus).filter(status => status).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    document.getElementById('progressFill').style.width = `${percentage}%`;
    document.getElementById('progressText').textContent = `${completed} von ${total} eingenommen`;
}

// Reset day
function resetDay() {
    if (confirm('Möchten Sie wirklich den Tag zurücksetzen? Alle Markierungen werden entfernt.')) {
        dailyStatus = {};
        saveToStorage();
        renderMedicationList();
        updateProgress();
    }
}

// Open settings modal
function openSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.add('show');
    
    // Load current settings
    renderMedicationSettings();
}

// Close settings modal
function closeSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.remove('show');
}

// Save settings
function saveSettings() {
    saveToStorage();
    closeSettings();
}

// Render medication settings list
function renderMedicationSettings() {
    const list = document.getElementById('medicationSettings');
    list.innerHTML = '';
    
    if (medications.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: #999; padding: 20px;">Keine Medikamente</li>';
        return;
    }
    
    medications.forEach((med, index) => {
        const medName = typeof med === 'string' ? med : med.name;
        const medAmount = typeof med === 'string' ? '' : (med.amount || '');
        
        const item = document.createElement('li');
        item.className = 'medication-settings-item';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'med-info';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'med-name';
        nameSpan.textContent = medName;
        infoDiv.appendChild(nameSpan);
        
        if (medAmount) {
            const amountSpan = document.createElement('span');
            amountSpan.className = 'med-amount';
            amountSpan.textContent = medAmount;
            infoDiv.appendChild(amountSpan);
        }
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Löschen';
        deleteBtn.addEventListener('click', () => deleteMedication(index));
        
        item.appendChild(infoDiv);
        item.appendChild(deleteBtn);
        list.appendChild(item);
    });
}

// Add medication
function addMedication() {
    const nameInput = document.getElementById('newMedication');
    const amountInput = document.getElementById('newMedicationAmount');
    const medName = nameInput.value.trim();
    const medAmount = amountInput.value.trim();
    
    if (!medName) {
        alert('Bitte geben Sie einen Medikamentennamen ein.');
        return;
    }
    
    // Check if medication name already exists
    const existingMed = medications.find(med => {
        const name = typeof med === 'string' ? med : med.name;
        return name === medName;
    });
    
    if (existingMed) {
        alert('Dieses Medikament ist bereits in der Liste.');
        return;
    }
    
    medications.push({ name: medName, amount: medAmount });
    saveToStorage();
    renderMedicationSettings();
    renderMedicationList();
    updateProgress();
    nameInput.value = '';
    amountInput.value = '';
}

// Delete medication
function deleteMedication(index) {
    const med = medications[index];
    const medName = typeof med === 'string' ? med : med.name;
    
    if (confirm(`Möchten Sie "${medName}" wirklich löschen?`)) {
        medications.splice(index, 1);
        delete dailyStatus[medName];
        saveToStorage();
        renderMedicationSettings();
        renderMedicationList();
        updateProgress();
    }
}

// PWA Install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install UI if desired
    console.log('PWA install prompt available');
});

window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    deferredPrompt = null;
});
