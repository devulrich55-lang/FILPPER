export const devices = [
  {
    id: 1,
    name: "iPhone 15 Pro",
    type: "iOS",
    signal: 92,
    distance: "12m",
    status: "online" as const,
    icon: "📱",
  },
  {
    id: 2,
    name: "Samsung Galaxy S24",
    type: "Android",
    signal: 78,
    distance: "45m",
    status: "online" as const,
    icon: "📱",
  },
  {
    id: 3,
    name: "MacBook Pro",
    type: "macOS",
    signal: 65,
    distance: "120m",
    status: "offline" as const,
    icon: "💻",
  },
  {
    id: 4,
    name: "AirPods Pro",
    type: "Bluetooth",
    signal: 54,
    distance: "8m",
    status: "online" as const,
    icon: "🎧",
  },
];

export const scanTechnologies = [
  { name: "Bluetooth Low Energy (BLE)", active: true },
  { name: "Radio Frequency (RF)", active: true },
  { name: "Near Field Communication (NFC)", active: false },
  { name: "Wi-Fi Direct", active: true },
  { name: "GPS Triangulation", active: true },
  { name: "Cellular Network", active: false },
];

export const offlineStrategies = [
  { name: "Cellular Triangulation", desc: "Position via antennes relais" },
  { name: "Radio Frequency Detection", desc: "Détection par ondes RF" },
  { name: "Last Known Location", desc: "Dernière position enregistrée" },
  { name: "Network Ping", desc: "Tentative de connexion réseau" },
];

export const dashboardStats = [
  { label: "Total Appareils", value: "1,245", change: "+12%" },
  { label: "Détectés Aujourd'hui", value: "312", change: "+8%" },
  { label: "Taux de Récupération", value: "89%", change: "+3%" },
  { label: "Alertes", value: "12", change: "-2" },
];

export const recentActivity = [
  { device: "Android Galaxy S24", action: "Détecté", time: "Il y a 2 min", type: "detect" },
  { device: "iPhone 15 Pro", action: "Verrouillé à distance", time: "Il y a 15 min", type: "lock" },
  { device: "MacBook Pro", action: "Hors ligne", time: "Il y a 1h", type: "offline" },
  { device: "AirPods Pro", action: "Sonnerie activée", time: "Il y a 2h", type: "alert" },
  { device: "iPad Air", action: "Données effacées", time: "Il y a 3h", type: "wipe" },
];

export const chartData = [
  { day: "Lun", detections: 45, recoveries: 38 },
  { day: "Mar", detections: 52, recoveries: 44 },
  { day: "Mer", detections: 38, recoveries: 35 },
  { day: "Jeu", detections: 65, recoveries: 58 },
  { day: "Ven", detections: 48, recoveries: 42 },
  { day: "Sam", detections: 72, recoveries: 65 },
  { day: "Dim", detections: 55, recoveries: 50 },
];
