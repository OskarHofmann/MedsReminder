# Medikamenten-Erinnerung (Medication Reminder PWA)

Eine Progressive Web App zur Verwaltung und Erinnerung an die tägliche Medikamenteneinnahme.

## Features

- **Tägliche Medikamentenliste** - Verwalten Sie Ihre Medikamente als To-Do-Liste
- **Abhaken** - Markieren Sie eingenommene Medikamente
- **Erinnerungen** - Automatische Benachrichtigungen zur konfigurierbaren Zeit (Standard: 18:30)
- **Installierbar** - Installieren Sie die App auf Ihrem Gerät
- **Privat** - Alle Daten werden lokal gespeichert
- **Offline-fähig** - Funktioniert auch ohne Internetverbindung
- **Automatischer Reset** - Die Liste wird täglich automatisch zurückgesetzt

## Installation & Nutzung

### Lokale Nutzung

1. Starten Sie einen lokalen Webserver im Projektordner:

   **Option 1: Python**
   ```bash
   python -m http.server 8000
   ```

   **Option 2: Node.js (npx)**
   ```bash
   npx serve
   ```

   **Option 3: PHP**
   ```bash
   php -S localhost:8000
   ```

2. Öffnen Sie im Browser: `http://localhost:8000`

3. **App installieren** (optional):
   - **Chrome/Edge**: Klicken Sie auf das Install-Symbol in der Adressleiste
   - **Firefox**: Menü → "Seite installieren"
   - **Safari (iOS)**: Teilen → "Zum Home-Bildschirm"

### Erste Schritte

1. **Benachrichtigungen aktivieren**
   - Klicken Sie auf das Einstellungen-Symbol
   - Aktivieren Sie Benachrichtigungen im Browser

2. **Medikamente hinzufügen**
   - Öffnen Sie die Einstellungen
   - Geben Sie Medikamentennamen ein und klicken Sie auf "Hinzufügen"

3. **Erinnerungszeit einstellen**
   - In den Einstellungen können Sie die tägliche Erinnerungszeit ändern
   - Standard: 18:30 Uhr

4. **Medikamente abhaken**
   - Klicken Sie auf die Checkbox oder das gesamte Medikament
   - Der Fortschritt wird automatisch aktualisiert

## Mobile Nutzung

Die App ist für mobile Geräte optimiert und kann als eigenständige App installiert werden:

- **Android**: Chrome → Menü → "App installieren" oder "Zum Startbildschirm hinzufügen"
- **iOS**: Safari → Teilen → "Zum Home-Bildschirm"

Nach der Installation läuft die App wie eine native App und funktioniert auch offline.

## Benachrichtigungen

Die App sendet zur eingestellten Zeit eine Benachrichtigung, wenn noch Medikamente nicht abgehakt wurden:

- Benachrichtigungen funktionieren auch wenn die App geschlossen ist (wenn installiert)
- Die Benachrichtigung zeigt, wie viele Medikamente noch ausstehen
- Klicken Sie auf die Benachrichtigung, um die App zu öffnen

## Datenschutz

- Alle Daten werden **ausschließlich lokal** im Browser gespeichert (LocalStorage)
- Keine Daten werden an Server übertragen
- Perfekt für sensible Gesundheitsdaten

## Projektstruktur

```
MedikamentenErinnerung/
├── index.html           # Haupt-HTML-Datei
├── styles.css           # Styling
├── app.js              # Hauptlogik
├── service-worker.js   # Service Worker für PWA-Features
├── manifest.json       # PWA-Manifest
├── icon-192.png        # App-Icon (klein)
└── icon-512.png        # App-Icon (groß)
```

## Technologie

- **HTML5** - Struktur
- **CSS3** - Styling und Responsive Design
- **Vanilla JavaScript** - Keine Frameworks
- **Service Worker API** - Offline-Funktionalität
- **Notification API** - Push-Benachrichtigungen
- **LocalStorage** - Datenspeicherung
- **Web App Manifest** - PWA-Installation
