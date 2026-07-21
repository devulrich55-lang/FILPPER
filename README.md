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

## Demarrage (developpement)

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Production (important)

Avant `npm start`, il faut **toujours** builder :

```bash
npm install
npm run build
npm start
```

Sans `npm run build`, Next.js affiche :
`Could not find a production build in the '.next' directory`

### Deploiement (Render / VPS)

| Etape | Commande |
|-------|----------|
| Build | `npm install && npm run build` |
| Start | `npm start` |

Un fichier `render.yaml` est inclus a la racine du projet.

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
