# Flliter Mobile

Frontend de l'application **Flliter Mobile** — sécurité et suivi d'appareils.

## Pages

### Mobile (6 écrans principaux)
| Route | Écran |
|-------|-------|
| `/mobile` | Accueil — Carte + appareils détectés |
| `/mobile/scan` | Scan avancé — Radar multi-technologie |
| `/mobile/control` | Contrôle à distance — Actions sur appareil |
| `/mobile/offline` | Mode hors ligne — Stratégies de secours |
| `/mobile/alert` | Alerte sonore — Faire sonner |
| `/mobile/lock` | Verrouillage à distance |

### Dashboard web
| Route | Écran |
|-------|-------|
| `/dashboard` | Admin Dashboard — Stats, carte, graphiques |

## Demarrage

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Version HTML simple

Une version statique en pur HTML/CSS/JS est disponible ici :

- `html/index.html`

Ouvre directement ce fichier dans le navigateur pour voir les ecrans.

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Lucide Icons
