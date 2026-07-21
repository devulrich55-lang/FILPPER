# Flliter Mobile — Référence API Backend

## Auth

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/users/me
PUT    /api/users/me
GET    /api/users/me/preferences
PUT    /api/users/me/preferences
```

## Dashboard & Appareils

```
GET    /api/dashboard/stats
GET    /api/devices
POST   /api/devices
GET    /api/devices/:id
PUT    /api/devices/:id
DELETE /api/devices/:id
POST   /api/devices/:id/lock
POST   /api/devices/:id/ring
POST   /api/devices/:id/wipe
POST   /api/devices/:id/message
GET    /api/devices/:id/last-known
GET    /api/events
```

## Communication sans fil

### RFID
```
POST   /api/rfid/scan
POST   /api/rfid/emulate
GET    /api/rfid/library
POST   /api/rfid/library
DELETE /api/rfid/library/:id
```

### NFC
```
POST   /api/nfc/scan
POST   /api/nfc/emulate
GET    /api/nfc/tags
POST   /api/nfc/tags
DELETE /api/nfc/tags/:id
```

### Sub-GHz
```
POST   /api/subghz/analyze
POST   /api/subghz/transmit
GET    /api/subghz/signals
POST   /api/subghz/signals
PUT    /api/subghz/signals/:id
DELETE /api/subghz/signals/:id
```

### Infrarouge
```
POST   /api/ir/scan
POST   /api/ir/transmit
GET    /api/ir/remotes
POST   /api/ir/remotes
POST   /api/ir/remotes/custom
DELETE /api/ir/remotes/:id
```

### Bluetooth
```
POST   /api/ble/pair
DELETE /api/ble/unpair
POST   /api/ble/scan
GET    /api/ble/devices
POST   /api/ble/sync
GET    /api/ble/sync/status
GET    /api/connectivity/ble/status
```

## BadUSB (autorisé uniquement)

```
GET    /api/badusb/scripts
POST   /api/badusb/scripts
POST   /api/badusb/execute
POST   /api/badusb/emulate
```

## iButton

```
POST   /api/ibutton/scan
POST   /api/ibutton/emulate
GET    /api/ibutton/keys
POST   /api/ibutton/keys
DELETE /api/ibutton/keys/:id
```

## GPIO

```
POST   /api/gpio/connect
POST   /api/gpio/uart/send
POST   /api/gpio/spi/send
POST   /api/gpio/i2c/send
GET    /api/gpio/debug/logs
POST   /api/gpio/peripherals/:id/control
GET    /api/connectivity/gpio/status
```

## Fichiers

```
GET    /api/storage/info
GET    /api/files/folders
POST   /api/files/folders
DELETE /api/files/folders/:id
POST   /api/files/backup
POST   /api/files/import
GET    /api/files/export
GET    /api/apps/files/tree
```

## Système

```
GET    /api/system/battery
GET    /api/system/updates
POST   /api/system/updates
GET    /api/system/logs
GET    /api/system/ui
PUT    /api/system/ui
GET    /api/system/plugins
POST   /api/system/plugins
DELETE /api/system/plugins/:id
GET    /api/apps/system
GET    /api/connectivity/usb
GET    /api/connectivity/sdcard
```

## Firmware & Développement

```
GET    /api/firmware/latest
POST   /api/firmware/update
GET    /api/dev/sdk/docs
POST   /api/dev/keys
POST   /api/dev/build
GET    /api/dev/apps
POST   /api/dev/apps
GET    /api/dev/firmware
POST   /api/dev/firmware/flash
```

## IA & Rapports

```
POST   /api/ai/analyze
GET    /api/reports
POST   /api/reports
POST   /api/diagnostics/run
GET    /api/journal
```

## Applications intégrées

```
GET    /api/apps/nfc
GET    /api/apps/rfid
GET    /api/apps/ir
GET    /api/apps/subghz
GET    /api/apps/settings
PUT    /api/apps/settings
GET    /api/apps/clock/sync
GET    /api/apps/games
```
