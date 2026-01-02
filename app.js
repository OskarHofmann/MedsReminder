// Storage keys
const STORAGE_KEYS = {
    MEDICATIONS: 'medications',
    DAILY_STATUS: 'dailyStatus',
    LAST_RESET: 'lastReset',
    YESTERDAY_DATA: 'yesterdayData',
    YESTERDAY_VIEWED: 'yesterdayViewed',
    CHANGE_REMINDERS: 'changeReminders'
};

// State management
let medications = [];
let dailyStatus = {};
let yesterdayData = null;
let changeReminders = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    loadSettings();
    loadYesterdayData();
    checkAndResetDaily();
    checkDueReminders();
    updateCurrentDate();
    renderMedicationList();
    updateProgress();
}

function setupEventListeners() {
    // Settings modal
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeModal').addEventListener('click', closeSettings);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    
    // Change reminders modal
    document.getElementById('manageReminders').addEventListener('click', openChangeRemindersModal);
    document.getElementById('closeRemindersModal').addEventListener('click', closeChangeRemindersModal);
    document.getElementById('closeRemindersModalBtn').addEventListener('click', closeChangeRemindersModal);
    document.getElementById('addChangeReminder').addEventListener('click', addChangeReminder);
    
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
    
    document.getElementById('changeRemindersModal').addEventListener('click', (e) => {
        if (e.target.id === 'changeRemindersModal') closeChangeRemindersModal();
    });
    
    // Reminder type change
    document.getElementById('reminderType').addEventListener('change', updateReminderForm);
}

// Load settings from localStorage
function loadSettings() {
    const storedMedications = localStorage.getItem(STORAGE_KEYS.MEDICATIONS);
    const storedStatus = localStorage.getItem(STORAGE_KEYS.DAILY_STATUS);
    const storedReminders = localStorage.getItem(STORAGE_KEYS.CHANGE_REMINDERS);
    
    if (storedMedications) {
        medications = JSON.parse(storedMedications);
    }
    
    if (storedStatus) {
        dailyStatus = JSON.parse(storedStatus);
    }
    
    if (storedReminders) {
        changeReminders = JSON.parse(storedReminders);
    }
}

// Save settings to localStorage
function saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(medications));
    localStorage.setItem(STORAGE_KEYS.DAILY_STATUS, JSON.stringify(dailyStatus));
    localStorage.setItem(STORAGE_KEYS.CHANGE_REMINDERS, JSON.stringify(changeReminders));
}

// Load yesterday's data
function loadYesterdayData() {
    const stored = localStorage.getItem(STORAGE_KEYS.YESTERDAY_DATA);
    if (stored) {
        yesterdayData = JSON.parse(stored);
    }
}

// Check if we need to reset for a new day
function checkAndResetDaily() {
    const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);
    const today = new Date().toDateString();
    
    if (lastReset !== today) {
        // Get yesterday's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDateString = yesterday.toDateString();
        
        // Only save yesterday's data if lastReset was actually yesterday
        if (lastReset === yesterdayDateString) {
            // Save yesterday's completion status
            const yesterdayInfo = {
                date: lastReset,
                medications: [...medications],
                status: {...dailyStatus},
                total: medications.length,
                completed: Object.values(dailyStatus).filter(status => status).length
            };
            localStorage.setItem(STORAGE_KEYS.YESTERDAY_DATA, JSON.stringify(yesterdayInfo));
            // Mark as not viewed yet
            localStorage.removeItem(STORAGE_KEYS.YESTERDAY_VIEWED);
        }
        
        // New day - reset all checkboxes
        dailyStatus = {};
        localStorage.setItem(STORAGE_KEYS.LAST_RESET, today);
        saveToStorage();
        
        // Show yesterday's summary if not viewed yet
        loadYesterdayData();
        if (yesterdayData && !localStorage.getItem(STORAGE_KEYS.YESTERDAY_VIEWED)) {
            setTimeout(() => showYesterdaySummary(), 500);
            localStorage.setItem(STORAGE_KEYS.YESTERDAY_VIEWED, 'true');
        }
    }
}

// Update current date display
function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = new Date().toLocaleDateString('de-DE', options);
    document.getElementById('currentDate').textContent = dateString;
}

// Show yesterday's summary
function showYesterdaySummary() {
    if (!yesterdayData) return;
    
    const { date, total, completed, medications: yesterdayMeds, status } = yesterdayData;
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    
    let message = `📊 Gestern (${dateStr}):\n\n`;
    
    if (total === 0) {
        message += 'Keine Medikamente waren eingetragen.';
    } else if (completed === total) {
        message += `✅ Alle ${total} Medikamente wurden eingenommen!`;
    } else {
        message += `⚠️ ${completed} von ${total} Medikamenten eingenommen\n\n`;
        message += 'Nicht eingenommen:\n';
        yesterdayMeds.forEach(med => {
            const medName = typeof med === 'string' ? med : med.name;
            if (!status[medName]) {
                message += `❌ ${medName}`;
                if (typeof med === 'object' && med.amount) {
                    message += ` (${med.amount})`;
                }
                message += '\n';
            }
        });
    }
    
    alert(message);
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
    renderYesterdayStatus();
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

// Render yesterday's status in settings
function renderYesterdayStatus() {
    const container = document.getElementById('yesterdayStatus');
    
    if (!yesterdayData) {
        container.innerHTML = '<p style="color: #999;">Keine Daten vom Vortag verfügbar.</p>';
        return;
    }
    
    const { date, total, completed, medications: yesterdayMeds, status } = yesterdayData;
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    
    let html = `<h4>${dateStr}</h4>`;
    
    if (total === 0) {
        html += '<p style="color: #999;">Keine Medikamente waren eingetragen.</p>';
    } else if (completed === total) {
        html += `<p class="status-complete">✅ Alle ${total} Medikamente wurden eingenommen!</p>`;
    } else {
        html += `<p class="status-incomplete">⚠️ ${completed} von ${total} Medikamenten eingenommen</p>`;
        
        const missedMeds = yesterdayMeds.filter(med => {
            const medName = typeof med === 'string' ? med : med.name;
            return !status[medName];
        });
        
        if (missedMeds.length > 0) {
            html += '<div class="missed-items">';
            html += '<p style="margin-bottom: 5px; font-weight: 500;">Nicht eingenommen:</p>';
            missedMeds.forEach(med => {
                const medName = typeof med === 'string' ? med : med.name;
                const medAmount = typeof med === 'string' ? '' : (med.amount || '');
                html += `<div class="missed-item">${medName}`;
                if (medAmount) {
                    html += ` <span style="color: #999;">(${medAmount})</span>`;
                }
                html += '</div>';
            });
            html += '</div>';
        }
    }
    
    container.innerHTML = html;
}

// Check for due medication change reminders
function checkDueReminders() {
    if (changeReminders.length === 0) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueReminders = changeReminders.filter(reminder => {
        const reminderDate = new Date(reminder.date);
        reminderDate.setHours(0, 0, 0, 0);
        return reminderDate <= today;
    });
    
    if (dueReminders.length > 0) {
        setTimeout(() => showDueReminders(dueReminders), 800);
    }
}

// Show due reminders
function showDueReminders(dueReminders) {
    let message = '📅 Medikamenten-Änderungen fällig:\n\n';
    
    dueReminders.forEach((reminder, index) => {
        const dateObj = new Date(reminder.date);
        const dateStr = dateObj.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
        
        message += `${index + 1}. ${dateStr}: `;
        
        if (reminder.type === 'add') {
            message += `➕ Hinzufügen: ${reminder.name}`;
            if (reminder.amount) message += ` (${reminder.amount})`;
        } else if (reminder.type === 'remove') {
            message += `➖ Entfernen: ${reminder.name}`;
        } else if (reminder.type === 'change') {
            message += `🔄 Ändern: ${reminder.name} → ${reminder.amount}`;
        }
        message += '\n';
    });
    
    message += '\nMöchten Sie diese Änderungen jetzt anwenden?';
    
    if (confirm(message)) {
        applyDueReminders(dueReminders);
    }
}

// Apply due reminders
function applyDueReminders(dueReminders) {
    let applied = 0;
    
    dueReminders.forEach(reminder => {
        if (reminder.type === 'add') {
            // Add new medication
            const exists = medications.find(med => {
                const name = typeof med === 'string' ? med : med.name;
                return name === reminder.name;
            });
            
            if (!exists) {
                medications.push({ name: reminder.name, amount: reminder.amount || '' });
                applied++;
            }
        } else if (reminder.type === 'remove') {
            // Remove medication
            const index = medications.findIndex(med => {
                const name = typeof med === 'string' ? med : med.name;
                return name === reminder.name;
            });
            
            if (index !== -1) {
                const medName = typeof medications[index] === 'string' ? medications[index] : medications[index].name;
                medications.splice(index, 1);
                delete dailyStatus[medName];
                applied++;
            }
        } else if (reminder.type === 'change') {
            // Change amount
            const med = medications.find(m => {
                const name = typeof m === 'string' ? m : m.name;
                return name === reminder.name;
            });
            
            if (med && typeof med === 'object') {
                med.amount = reminder.amount;
                applied++;
            }
        }
        
        // Remove this reminder
        changeReminders = changeReminders.filter(r => r !== reminder);
    });
    
    saveToStorage();
    renderMedicationList();
    updateProgress();
    
    alert(`✅ ${applied} Änderung(en) wurde(n) angewendet!`);
}

// Open change reminders modal
function openChangeRemindersModal() {
    const modal = document.getElementById('changeRemindersModal');
    modal.classList.add('show');
    renderChangeReminders();
    populateMedicationSelect();
}

// Close change reminders modal
function closeChangeRemindersModal() {
    const modal = document.getElementById('changeRemindersModal');
    modal.classList.remove('show');
}

// Populate medication select dropdown
function populateMedicationSelect() {
    const select = document.getElementById('reminderMedication');
    select.innerHTML = '<option value="">Medikament auswählen...</option>';
    
    medications.forEach(med => {
        const medName = typeof med === 'string' ? med : med.name;
        const option = document.createElement('option');
        option.value = medName;
        option.textContent = medName;
        select.appendChild(option);
    });
}

// Add change reminder
function addChangeReminder() {
    const type = document.getElementById('reminderType').value;
    const date = document.getElementById('reminderDate').value;
    const medSelect = document.getElementById('reminderMedication');
    const newName = document.getElementById('reminderNewName').value.trim();
    const newAmount = document.getElementById('reminderNewAmount').value.trim();
    
    if (!date) {
        alert('Bitte wählen Sie ein Datum.');
        return;
    }
    
    let reminder = { type, date };
    
    if (type === 'add') {
        if (!newName) {
            alert('Bitte geben Sie einen Medikamentennamen ein.');
            return;
        }
        reminder.name = newName;
        reminder.amount = newAmount;
    } else if (type === 'remove') {
        if (!medSelect.value) {
            alert('Bitte wählen Sie ein Medikament aus.');
            return;
        }
        reminder.name = medSelect.value;
    } else if (type === 'change') {
        if (!medSelect.value) {
            alert('Bitte wählen Sie ein Medikament aus.');
            return;
        }
        if (!newAmount) {
            alert('Bitte geben Sie die neue Menge ein.');
            return;
        }
        reminder.name = medSelect.value;
        reminder.amount = newAmount;
    }
    
    changeReminders.push(reminder);
    saveToStorage();
    renderChangeReminders();
    
    // Clear inputs
    document.getElementById('reminderNewName').value = '';
    document.getElementById('reminderNewAmount').value = '';
    document.getElementById('reminderDate').value = '';
}

// Render change reminders list
function renderChangeReminders() {
    const list = document.getElementById('changeRemindersList');
    list.innerHTML = '';
    
    if (changeReminders.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: #999; padding: 20px;">Keine Erinnerungen geplant</li>';
        return;
    }
    
    // Sort by date
    const sorted = [...changeReminders].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sorted.forEach((reminder, index) => {
        const item = document.createElement('li');
        item.className = 'medication-settings-item';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'med-info';
        
        const dateObj = new Date(reminder.date);
        const dateStr = dateObj.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'med-name';
        dateSpan.textContent = dateStr;
        infoDiv.appendChild(dateSpan);
        
        const actionSpan = document.createElement('span');
        actionSpan.className = 'med-amount';
        
        if (reminder.type === 'add') {
            actionSpan.textContent = `➕ Hinzufügen: ${reminder.name}${reminder.amount ? ' (' + reminder.amount + ')' : ''}`;
        } else if (reminder.type === 'remove') {
            actionSpan.textContent = `➖ Entfernen: ${reminder.name}`;
        } else if (reminder.type === 'change') {
            actionSpan.textContent = `🔄 Ändern: ${reminder.name} → ${reminder.amount}`;
        }
        
        infoDiv.appendChild(actionSpan);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Löschen';
        deleteBtn.addEventListener('click', () => deleteChangeReminder(index));
        
        item.appendChild(infoDiv);
        item.appendChild(deleteBtn);
        list.appendChild(item);
    });
}

// Delete change reminder
function deleteChangeReminder(index) {
    const sorted = [...changeReminders].sort((a, b) => new Date(a.date) - new Date(b.date));
    const reminderToDelete = sorted[index];
    changeReminders = changeReminders.filter(r => r !== reminderToDelete);
    saveToStorage();
    renderChangeReminders();
}

// Update reminder form based on type
function updateReminderForm() {
    const type = document.getElementById('reminderType').value;
    const existingMedSection = document.getElementById('existingMedSection');
    const newMedSection = document.getElementById('newMedSection');
    const amountSection = document.getElementById('amountSection');
    
    existingMedSection.style.display = 'none';
    newMedSection.style.display = 'none';
    amountSection.style.display = 'none';
    
    if (type === 'add') {
        newMedSection.style.display = 'block';
        amountSection.style.display = 'block';
    } else if (type === 'remove') {
        existingMedSection.style.display = 'block';
    } else if (type === 'change') {
        existingMedSection.style.display = 'block';
        amountSection.style.display = 'block';
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
