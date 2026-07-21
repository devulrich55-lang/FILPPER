# Flliter Mobile — Architecture Backend

Répartition des fonctionnalités inspirées du Flipper Zero pour le backend **Flliter Mobile**.

---

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
│              (Auth, Rate limiting, Routing)                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
┌───▼───┐  ┌───────────────▼───────────────┐  ┌───▼────┐
│ Auth  │  │     Core Services             │  │  AI    │
│ Users │  │  Devices · Scans · Files      │  │ Engine │
└───────┘  └───────────────┬───────────────┘  └────────┘
                           │
    ┌──────────┬───────────┼───────────┬──────────┐
    │          │           │           │          │
┌───▼──┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
│ RFID │  │  NFC  │  │Sub-GHz│  │  IR   │  │  BLE  │
│ NFC  │  │       │  │ Radio │  │       │  │       │
└──────┘  └───────┘  └───────┘  └───────┘  └───────┘
    │          │           │           │          │
┌───▼──┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
│BadUSB│  │iButton│  │ GPIO  │  │ Files │
└──────┘  └───────┘  └───────┘  └───────┘
```

---

## 1. Module Auth & Utilisateurs

**Responsabilité backend :** gestion des profils, permissions, sessions.

| Fonctionnalité app | Service backend | Endpoints |
|---|---|---|
| Gestion des profils utilisateurs | `UserService` | `GET/PUT /api/users/me` |
| Authentification | `AuthService` | `POST /api/auth/login`, `/register`, `/refresh` |
| Rôles & permissions | `PermissionService` | `GET /api/users/{id}/permissions` |
| Personnalisation interface | `PreferencesService` | `GET/PUT /api/users/me/preferences` |

**Tables :** `users`, `roles`, `permissions`, `user_preferences`

---

## 2. Module Communication sans fil

### 2.1 RFID (125 kHz)

| Fonctionnalité | Service | Endpoints |
|---|---|---|
| Lecture badges RFID | `RfidService.read()` | `POST /api/rfid/scan` |
| Émulation badges compatibles | `RfidService.emulate()` | `POST /api/rfid/emulate` |
| Bibliothèque badges | `RfidLibraryService` | `GET/POST/DELETE /api/rfid/library` |

**Tables :** `rfid_badges`, `rfid_scans`, `rfid_emulations`

### 2.2 NFC (13,56 MHz)

| Fonctionnalité | Service | Endpoints |
|---|---|---|
| Lecture tags NFC | `NfcService.read()` | `POST /api/nfc/scan` |
| Émulation tags compatibles | `NfcService.emulate()` | `POST /api/nfc/emulate` |
| Gestionnaire NFC | `NfcManagerService` | `GET /api/nfc/tags`, `POST /api/nfc/tags` |

**Tables :** `nfc_tags`, `nfc_scans`, `nfc_emulations`

### 2.3 Sub-GHz (Radio)

| Fonctionnalité | Service | Endpoints |
|---|---|---|
| Analyse signaux radio | `SubGhzService.analyze()` | `POST /api/subghz/analyze` |
| Émission signaux compatibles | `SubGhzService.transmit()` | `POST /api/subghz/transmit` |
| Sauvegarde & organisation signaux | `SignalLibraryService` | `GET/POST/PUT/DELETE /api/subghz/signals` |

**Tables :** `subghz_signals`, `subghz_scans`, `signal_folders`

---

## 3. Module Infrarouge (IR)

| Fonctionnalité | Service | Endpoints |
|---|---|---|
| Lecture télécommandes IR | `IrService.read()` | `POST /api/ir/scan` |
| Émission commandes IR | `IrService.transmit()` | `POST /api/ir/transmit` |
| Bibliothèque télécommandes | `IrLibraryService` | `GET/POST /api/ir/remotes` |
| Création télécommandes custom | `IrRemoteBuilderService` | `POST /api/ir/remotes/custom` |

**Tables :** `ir_remotes`, `ir_commands`, `ir_scans`

---

## 4. Module Bluetooth

| Fonctionnalité | Service | Endpoints |
|---|---|---|
| Connexion app mobile | `BlePairingService` | `POST /api/ble/pair`, `DELETE /api/ble/unpair` |
| Synchronisation fichiers | `BleSyncService` | `POST /api/ble/sync`, `GET /api/ble/sync/status` |
| Mise à jour firmware (OTA) | `FirmwareService` | `GET /api/firmware/latest`, `POST /api/firmware/update` |
| Contrôle à distance | `RemoteControlService` | `POST /api/devices/{id}/control` |
| Analyse Bluetooth (scanner) | `BleScannerService` | `POST /api/ble/scan`, `GET /api/ble/devices` |

**Tables :** `ble_devices`, `ble_pairings`, `firmware_versions`, `sync_sessions`

---

## 5. Module BadUSB

| Fonctionnalité | Service | Endpoints |
|---|---|---|
| Émulation clavier USB (tests autorisés) | `BadUsbService` | `POST /api/badusb/emulate` |
| Scripts de test | `BadUsbScriptService` | `GET/POST /api/badusb/scripts` |
| Exécution avec autorisation | `BadUsbExecutorService` | `POST /api/badusb/execute` |
| Validation autorisation | `AuthorizationService` | Vérification token avant exécution |

**Tables :** `badusb_scripts`, `badusb_executions`, `authorizations`

> ⚠️ Toutes les actions BadUSB nécessitent une autorisation explicite et sont journalisées.

---

## 6. Module iButton (1-Wire)

| Fonctionnalité | Service | Endpoints |
|---|---|---|
| Lecture clés électroniques | `IbuttonService.read()` | `POST /api/ibutton/scan` |
| Émulation clés compatibles | `IbuttonService.emulate()` | `POST /api/ibutton/emulate` |
| Bibliothèque de clés | `IbuttonLibraryService` | `GET/POST/DELETE /api/ibutton/keys` |

**Tables :** `ibutton_keys`, `ibutton_scans`

---

## 7. Module GPIO

| Fonctionnalité | Service | Endpoints |
|---|---|---|
| Communication microcontrôleurs | `GpioService` | `POST /api/gpio/connect` |
| Protocoles UART / SPI / I²C | `ProtocolService` | `POST /api/gpio/{protocol}/send` |
| Débogage matériel | `HardwareDebugService` | `GET /api/gpio/debug/logs` |
| Contrôle périphériques | `PeripheralService` | `POST /api/gpio/peripherals/{id}/control` |

**Tables :** `gpio_devices`, `gpio_sessions`, `debug_logs`, `peripherals`

---

## 8. Module Gestion des fichiers

| Fonctionnalité | Service | Endpoints |
|---|---|---|
| Carte microSD (métadonnées) | `StorageService` | `GET /api/storage/info` |
| Organisation par dossiers | `FolderService` | `GET/POST/DELETE /api/files/folders` |
| Sauvegarde des lectures | `BackupService` | `POST /api/files/backup` |
| Import / export | `ImportExportService` | `POST /api/files/import`, `GET /api/files/export` |

**Tables :** `file_folders`, `files`, `backups`, `import_jobs`

---

## 9. Module Applications intégrées (API backend)

| Application | Service backend | Endpoints |
|---|---|---|
| Explorateur de fichiers | `FileExplorerService` | `GET /api/apps/files/tree` |
| Gestionnaire NFC | `NfcManagerService` | `GET /api/apps/nfc` |
| Gestionnaire RFID | `RfidManagerService` | `GET /api/apps/rfid` |
| Gestionnaire IR | `IrManagerService` | `GET /api/apps/ir` |
| Gestionnaire Sub-GHz | `SubGhzManagerService` | `GET /api/apps/subghz` |
| Paramètres | `SettingsService` | `GET/PUT /api/apps/settings` |
| Horloge | `ClockService` | `GET /api/apps/clock/sync` |
| Calculatrice | *(frontend only)* | — |
| Jeux | `GamesService` | `GET /api/apps/games` |
| Infos système | `SystemInfoService` | `GET /api/apps/system` |

---

## 10. Module Développement

| Fonctionnalité | Service | Endpoints |
|---|---|---|
| SDK applications | `SdkService` | `GET /api/dev/sdk/docs` |
| API développeurs | `DeveloperApiService` | `POST /api/dev/keys` |
| Compilation programmes | `BuildService` | `POST /api/dev/build` |
| Apps tierces | `AppStoreService` | `GET/POST /api/dev/apps` |
| Mise à jour firmware | `FirmwareService` | `GET /api/dev/firmware`, `POST /api/dev/firmware/flash` |

**Tables :** `dev_api_keys`, `third_party_apps`, `build_jobs`, `firmware_releases`

---

## 11. Module Connectivité

| Interface | Service | Endpoints |
|---|---|---|
| USB-C (statut sync) | `UsbService` | `GET /api/connectivity/usb` |
| Bluetooth LE | `BleService` | `GET /api/connectivity/ble/status` |
| Carte microSD | `StorageService` | `GET /api/connectivity/sdcard` |
| GPIO (état pins) | `GpioService` | `GET /api/connectivity/gpio/status` |

---

## 12. Module Fonctions système

| Fonctionnalité | Service | Endpoints |
|---|---|---|
| Gestion batterie | `BatteryService` | `GET /api/system/battery` |
| Mises à jour système | `SystemUpdateService` | `GET/POST /api/system/updates` |
| Journal des événements | `EventLogService` | `GET /api/system/logs` |
| Personnalisation UI | `UiCustomizationService` | `GET/PUT /api/system/ui` |
| Gestion plugins | `PluginService` | `GET/POST/DELETE /api/system/plugins` |

**Tables :** `system_logs`, `plugins`, `ui_themes`, `battery_history`

---

## 13. Module IA & Analyse (inspiré Flipper Zero)

| Fonctionnalité app | Service | Endpoints |
|---|---|---|
| Interpréter les résultats de scan | `AiAnalysisService` | `POST /api/ai/analyze` |
| Rapports d'analyse | `ReportService` | `GET/POST /api/reports` |
| Outils diagnostic matériel | `DiagnosticService` | `POST /api/diagnostics/run` |
| Journal des analyses | `AnalysisJournalService` | `GET /api/journal` |

**Tables :** `ai_analyses`, `reports`, `diagnostics`, `analysis_journal`

---

## 14. Module Dashboard & Appareils (frontend existant)

| Écran frontend | Service backend | Endpoints |
|---|---|---|
| Tableau de bord | `DashboardService` | `GET /api/dashboard/stats` |
| Gestion des appareils | `DeviceService` | `GET/POST/PUT/DELETE /api/devices` |
| Scanner NFC | `NfcService` | `POST /api/nfc/scan` |
| Analyse Bluetooth | `BleScannerService` | `POST /api/ble/scan` |
| Télécommande IR | `IrService` | `POST /api/ir/transmit` |
| Verrouillage à distance | `RemoteControlService` | `POST /api/devices/{id}/lock` |
| Alerte sonore | `RemoteControlService` | `POST /api/devices/{id}/ring` |
| Mode hors ligne | `OfflineLocationService` | `GET /api/devices/{id}/last-known` |
| Historique | `EventLogService` | `GET /api/events` |

**Tables :** `devices`, `device_locations`, `device_actions`, `dashboard_metrics`

---

## Structure des dossiers backend recommandée

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── devices/
│   │   ├── rfid/
│   │   ├── nfc/
│   │   ├── subghz/
│   │   ├── ir/
│   │   ├── ble/
│   │   ├── badusb/
│   │   ├── ibutton/
│   │   ├── gpio/
│   │   ├── files/
│   │   ├── system/
│   │   ├── ai/
│   │   ├── dashboard/
│   │   └── dev/
│   ├── shared/
│   │   ├── database/
│   │   ├── middleware/
│   │   └── utils/
│   └── app.ts
├── prisma/          # ou migrations SQL
└── tests/
```

---

## Priorités de développement

| Phase | Modules | Priorité |
|---|---|---|
| **Phase 1** | Auth, Devices, Dashboard, BLE, Event logs | 🔴 Critique |
| **Phase 2** | NFC, RFID, IR, Sub-GHz, Files | 🟠 Haute |
| **Phase 3** | AI Analysis, Reports, Diagnostics | 🟡 Moyenne |
| **Phase 4** | GPIO, iButton, BadUSB, Dev SDK | 🟢 Basse |

---

## Stack backend recommandée

- **Runtime :** Node.js + Express ou NestJS
- **Base de données :** PostgreSQL (données) + Redis (cache/sessions)
- **ORM :** Prisma
- **Auth :** JWT + refresh tokens
- **Files :** S3 ou stockage local
- **Queue :** Bull (jobs async : sync, firmware, AI)
- **WebSocket :** temps réel (scan, alertes, batterie)
