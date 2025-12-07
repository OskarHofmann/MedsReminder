// Storage keys
const STORAGE_KEYS = {
    MEDICATIONS: 'medications',
    DAILY_STATUS: 'dailyStatus',
    REMINDER_TIME: 'reminderTime',
    LAST_RESET: 'lastReset'
};

// State management
let medications = [];
let dailyStatus = {};
let reminderTime = '18:30';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    registerServiceWorker();
    checkNotificationPermission();
});

function initializeApp() {
    loadSettings();
    checkAndResetDaily();
    updateCurrentDate();
    renderMedicationList();
    updateProgress();
    scheduleNextReminder();
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
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetDay);
    
    // Notification test
    document.getElementById('testNotification').addEventListener('click', sendTestNotification);
    document.getElementById('enableNotifications').addEventListener('click', requestNotificationPermission);
    
    // Close modal on outside click
    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') closeSettings();
    });
}

// Load settings from localStorage
function loadSettings() {
    const storedMedications = localStorage.getItem(STORAGE_KEYS.MEDICATIONS);
    const storedStatus = localStorage.getItem(STORAGE_KEYS.DAILY_STATUS);
    const storedTime = localStorage.getItem(STORAGE_KEYS.REMINDER_TIME);
    
    if (storedMedications) {
        medications = JSON.parse(storedMedications);
    }
    
    if (storedStatus) {
        dailyStatus = JSON.parse(storedStatus);
    }
    
    if (storedTime) {
        reminderTime = storedTime;
    }
}

// Save settings to localStorage
function saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(medications));
    localStorage.setItem(STORAGE_KEYS.DAILY_STATUS, JSON.stringify(dailyStatus));
    localStorage.setItem(STORAGE_KEYS.REMINDER_TIME, reminderTime);
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
        const item = document.createElement('div');
        item.className = 'medication-item' + (dailyStatus[med] ? ' checked' : '');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `med-${index}`;
        checkbox.checked = dailyStatus[med] || false;
        checkbox.addEventListener('change', () => toggleMedication(med));
        
        const label = document.createElement('label');
        label.htmlFor = `med-${index}`;
        label.textContent = med;
        
        item.appendChild(checkbox);
        item.appendChild(label);
        
        item.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                toggleMedication(med);
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
    document.getElementById('reminderTime').value = reminderTime;
    renderMedicationSettings();
}

// Close settings modal
function closeSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.remove('show');
}

// Save settings
function saveSettings() {
    reminderTime = document.getElementById('reminderTime').value;
    saveToStorage();
    scheduleNextReminder();
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
        const item = document.createElement('li');
        item.className = 'medication-settings-item';
        
        const name = document.createElement('span');
        name.textContent = med;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Löschen';
        deleteBtn.addEventListener('click', () => deleteMedication(index));
        
        item.appendChild(name);
        item.appendChild(deleteBtn);
        list.appendChild(item);
    });
}

// Add medication
function addMedication() {
    const input = document.getElementById('newMedication');
    const medName = input.value.trim();
    
    if (!medName) {
        alert('Bitte geben Sie einen Medikamentennamen ein.');
        return;
    }
    
    if (medications.includes(medName)) {
        alert('Dieses Medikament ist bereits in der Liste.');
        return;
    }
    
    medications.push(medName);
    saveToStorage();
    renderMedicationSettings();
    renderMedicationList();
    updateProgress();
    input.value = '';
}

// Delete medication
function deleteMedication(index) {
    const medName = medications[index];
    if (confirm(`Möchten Sie "${medName}" wirklich löschen?`)) {
        medications.splice(index, 1);
        delete dailyStatus[medName];
        saveToStorage();
        renderMedicationSettings();
        renderMedicationList();
        updateProgress();
    }
}

// Service Worker Registration
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('service-worker.js');
            console.log('Service Worker registered:', registration);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}

// Notification handling
function checkNotificationPermission() {
    const statusElement = document.getElementById('notificationStatus');
    const enableButton = document.getElementById('enableNotifications');
    
    if (!('Notification' in window)) {
        statusElement.textContent = 'Status: Benachrichtigungen werden nicht unterstützt';
        return;
    }
    
    if (Notification.permission === 'granted') {
        statusElement.textContent = 'Status: ✅ Benachrichtigungen aktiviert';
        enableButton.style.display = 'none';
    } else if (Notification.permission === 'denied') {
        statusElement.textContent = 'Status: ❌ Benachrichtigungen blockiert (in Browsereinstellungen ändern)';
        enableButton.style.display = 'none';
    } else {
        statusElement.textContent = 'Status: ⚠️ Benachrichtigungen nicht aktiviert';
        enableButton.style.display = 'block';
    }
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('Ihr Browser unterstützt keine Benachrichtigungen.');
        return;
    }
    
    const permission = await Notification.requestPermission();
    checkNotificationPermission();
    
    if (permission === 'granted') {
        sendTestNotification();
    }
}

function sendTestNotification() {
    if (Notification.permission !== 'granted') {
        alert('Bitte aktivieren Sie zuerst die Benachrichtigungen.');
        return;
    }
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'TEST_NOTIFICATION'
        });
    } else {
        // Fallback for direct notification
        new Notification('Medikamenten-Erinnerung', {
            body: 'Test-Benachrichtigung erfolgreich!',
            icon: 'icon-192.png',
            badge: 'icon-192.png'
        });
    }
}

// Schedule reminder check
function scheduleNextReminder() {
    // Clear any existing scheduled check
    if (window.reminderCheckInterval) {
        clearInterval(window.reminderCheckInterval);
    }
    
    // Check every minute if it's time for reminder
    window.reminderCheckInterval = setInterval(checkReminderTime, 60000);
    
    // Also check immediately
    checkReminderTime();
}

function checkReminderTime() {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (currentTime === reminderTime) {
        checkAndSendReminder();
    }
}

function checkAndSendReminder() {
    const total = medications.length;
    const completed = Object.values(dailyStatus).filter(status => status).length;
    
    if (total === 0 || completed >= total) {
        // All medications taken or no medications
        return;
    }
    
    const remaining = medications.filter(med => !dailyStatus[med]);
    
    if (Notification.permission === 'granted') {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SEND_REMINDER',
                data: {
                    remaining: remaining,
                    total: total,
                    completed: completed
                }
            });
        } else {
            // Fallback notification
            new Notification('Medikamenten-Erinnerung', {
                body: `Sie haben noch ${remaining.length} Medikament(e) zu nehmen:\n${remaining.join(', ')}`,
                icon: 'icon-192.png',
                badge: 'icon-192.png',
                requireInteraction: true,
                tag: 'medication-reminder'
            });
        }
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
