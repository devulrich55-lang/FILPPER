# Flliter Mobile — Backend (Python)

Backend **FastAPI** pour servir les écrans et opérations (RFID/NFC/Sub‑GHz/IR/BLE/BadUSB/GPIO/Fichiers/etc.).

## Important (sécurité)

Cette version est un **scaffold** sécurisé :
- Les endpoints “émulation/émission” créent et journalisent des opérations.
- Par défaut, aucun matériel n’est piloté (mode simulation / dry-run).
- Les actions sensibles (ex: `badusb execute`, `subghz transmit`, `rfid emulate`, `nfc emulate`, `ir transmit`) exigent une **autorisation par scope**.

## Lancer

```bash
cd "backend"
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Base URL : `http://localhost:8000`

## Compte admin par défaut

Au démarrage, un compte admin est créé automatiquement s'il n'existe pas :

| Champ | Valeur |
|-------|--------|
| Username | `Ulrich` |
| Password | `Ulrich11+` |
| Scopes | `admin` |

Connexion : `POST /api/auth/login` avec ces identifiants.

## Routes (résumé)

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/users/me`
- `GET /api/dashboard/stats`
- `CRUD /api/devices`
- `/api/*` pour chaque module (rfid/nfc/subghz/ir/ble/badusb/ibutton/gpio/files/system/ai/reports/dev)

