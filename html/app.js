const storage = window.localStorage;

const ui = {
  loginScreen: document.getElementById("loginScreen"),
  appContent: document.getElementById("appContent"),
  apiBase: document.getElementById("apiBase"),
  username: document.getElementById("username"),
  password: document.getElementById("password"),
  themeSelect: document.getElementById("themeSelect"),
  themeSelectApp: document.getElementById("themeSelectApp"),
  loginBtn: document.getElementById("loginBtn"),
  registerBtn: document.getElementById("registerBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  authStatus: document.getElementById("authStatus"),
  userInfo: document.getElementById("userInfo"),
  deviceList: document.getElementById("deviceList"),
  deviceActionStatus: document.getElementById("deviceActionStatus"),
  selectedDeviceLabel: document.getElementById("selectedDeviceLabel"),
  statTotal: document.getElementById("stat-total"),
  statDetectes: document.getElementById("stat-detectes"),
  statRecup: document.getElementById("stat-recup"),
  statAlertes: document.getElementById("stat-alertes"),
  laptopMap: document.getElementById("laptopMap"),
  scanStatus: document.getElementById("scanStatus"),
  scanResults: document.getElementById("scanResults"),
  journalList: document.getElementById("journalList"),
  addDeviceForm: document.getElementById("addDeviceForm"),
  deviceName: document.getElementById("deviceName"),
  deviceType: document.getElementById("deviceType"),
  lockMessage: document.getElementById("lockMessage"),
  ringTimer: document.getElementById("ringTimer"),
  ringStatus: document.getElementById("ringStatus"),
};

let authToken = storage.getItem("flliter_token") || "";
let currentDeviceId = null;
let ringInterval = null;
let ringSeconds = 0;

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  storage.setItem("flliter_theme", theme);
  if (ui.themeSelect) ui.themeSelect.value = theme;
  if (ui.themeSelectApp) ui.themeSelectApp.value = theme;
}

function bindThemeSelectors() {
  const saved = storage.getItem("flliter_theme") || "ocean";
  applyTheme(saved);
  [ui.themeSelect, ui.themeSelectApp].forEach((select) => {
    if (!select) return;
    select.addEventListener("change", (e) => applyTheme(e.target.value));
  });
}

function showLoginScreen() {
  ui.loginScreen.classList.remove("hidden");
  ui.appContent.classList.add("hidden");
}

function showApp() {
  ui.loginScreen.classList.add("hidden");
  ui.appContent.classList.remove("hidden");
}

function setAuthStatus(text, ok = false) {
  ui.authStatus.textContent = text;
  ui.authStatus.style.color = ok ? "#8fffbe" : "#ffd4d4";
}

function setActionStatus(text, ok = false) {
  ui.deviceActionStatus.textContent = text;
  ui.deviceActionStatus.style.color = ok ? "#8fffbe" : "#ffd4d4";
}

function getApiBase() {
  return (ui.apiBase.value || "http://localhost:8000").replace(/\/+$/, "");
}

async function apiRequest(path, options = {}, requiresAuth = true) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (requiresAuth && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${getApiBase()}${path}`, { ...options, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(typeof data?.detail === "string" ? data.detail : `HTTP ${response.status}`);
  }
  return data;
}

async function register() {
  const data = await apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username: ui.username.value.trim(),
      password: ui.password.value.trim(),
      scopes: "admin",
    }),
  }, false);
  authToken = data.access_token;
  storage.setItem("flliter_token", authToken);
  setAuthStatus("Compte cree et connecte", true);
}

async function login() {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: ui.username.value.trim(),
      password: ui.password.value.trim(),
    }),
  }, false);
  authToken = data.access_token;
  storage.setItem("flliter_token", authToken);
  setAuthStatus("Connecte au backend", true);
}

function logout() {
  authToken = "";
  storage.removeItem("flliter_token");
  stopRingTimer();
  showLoginScreen();
  setAuthStatus("Connectez-vous pour acceder a l'application", false);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function stopRingTimer() {
  if (ringInterval) clearInterval(ringInterval);
  ringInterval = null;
  ringSeconds = 0;
  if (ui.ringTimer) ui.ringTimer.textContent = "00:00";
  if (ui.ringStatus) ui.ringStatus.textContent = "Aucune sonnerie active";
}

function startRingTimer() {
  stopRingTimer();
  ringSeconds = 0;
  ui.ringTimer.textContent = "00:00";
  ui.ringStatus.textContent = "Sonnerie en cours...";
  ringInterval = setInterval(() => {
    ringSeconds += 1;
    ui.ringTimer.textContent = formatTime(ringSeconds);
  }, 1000);
}

function renderDevices(devices) {
  if (!devices.length) {
    ui.deviceList.innerHTML = "<p>Aucun appareil enregistre</p>";
    currentDeviceId = null;
    if (ui.selectedDeviceLabel) ui.selectedDeviceLabel.textContent = "Aucun appareil selectionne";
    return;
  }

  if (!currentDeviceId || !devices.find((d) => d.id === currentDeviceId)) {
    currentDeviceId = devices[0].id;
  }

  ui.deviceList.innerHTML = devices
    .map((device) => {
      const selected = device.id === currentDeviceId ? " selected-device" : "";
      return `<button type="button" class="device-item${selected}" data-id="${device.id}">${device.name} · ${device.status}</button>`;
    })
    .join("");

  ui.deviceList.querySelectorAll(".device-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentDeviceId = Number(btn.getAttribute("data-id"));
      const selected = devices.find((d) => d.id === currentDeviceId);
      if (ui.selectedDeviceLabel && selected) {
        ui.selectedDeviceLabel.textContent = `Selection: ${selected.name} (#${selected.id})`;
      }
      renderDevices(devices);
    });
  });

  const selected = devices.find((d) => d.id === currentDeviceId);
  if (ui.selectedDeviceLabel && selected) {
    ui.selectedDeviceLabel.textContent = `Selection: ${selected.name} (#${selected.id})`;
  }
}

function renderScanResults(result) {
  const items = result?.items || result?.devices || [];
  if (!items.length) {
    ui.scanResults.innerHTML = `<p>${result?.message || "Aucun resultat de scan"}</p>`;
    return;
  }
  ui.scanResults.innerHTML = items
    .map((item) => `<p>${item.name || item.tag_uid || item.key_id || "Element"} · ${item.device_type || item.protocol || item.type || ""}</p>`)
    .join("");
}

function renderJournal(events) {
  if (!events.length) {
    ui.journalList.innerHTML = "<p>Aucune activite enregistree</p>";
    ui.laptopMap.textContent = "Aucune activite recente";
    return;
  }
  ui.journalList.innerHTML = events
    .slice(-8)
    .reverse()
    .map((e) => `<p>${e.message} · ${new Date(e.created_at).toLocaleString()}</p>`)
    .join("");
  ui.laptopMap.textContent = `${events.length} evenement(s) enregistre(s)`;
}

async function loadDevices() {
  return apiRequest("/api/devices");
}

async function loadStats() {
  const stats = await apiRequest("/api/dashboard/stats");
  ui.statTotal.textContent = stats.totalAppareils ?? 0;
  ui.statDetectes.textContent = stats.detectesAujourdHui ?? 0;
  ui.statRecup.textContent = stats.tauxRecuperation ?? "0%";
  ui.statAlertes.textContent = stats.alertes ?? 0;
}

async function loadJournal() {
  const data = await apiRequest("/api/journal");
  renderJournal(data.events || []);
}

async function loadData() {
  const me = await apiRequest("/api/auth/me");
  ui.userInfo.textContent = `Connecte: ${me.username}`;

  const devices = await loadDevices();
  renderDevices(devices);
  await loadStats();
  await loadJournal();

  ui.scanStatus.textContent = "Pret pour un scan BLE";
  ui.scanResults.innerHTML = "<p>Aucun scan effectue</p>";
  showApp();
}

async function addDevice(event) {
  event.preventDefault();
  const name = ui.deviceName.value.trim();
  const device_type = ui.deviceType.value.trim();
  if (!name || !device_type) return;

  await apiRequest("/api/devices", {
    method: "POST",
    body: JSON.stringify({ name, device_type, status: "online" }),
  });

  ui.deviceName.value = "";
  const devices = await loadDevices();
  renderDevices(devices);
  await loadStats();
  await loadJournal();
}

async function runBleScan() {
  ui.scanStatus.textContent = "Scan en cours...";
  const data = await apiRequest("/api/ble/scan", {
    method: "POST",
    body: JSON.stringify({ register: true }),
  });
  renderScanResults(data.result);
  ui.scanStatus.textContent = data.result?.message || "Scan termine";

  const devices = await loadDevices();
  renderDevices(devices);
  await loadStats();
  await loadJournal();
}

async function runDeviceAction(actionName) {
  if (!currentDeviceId) {
    setActionStatus("Selectionnez ou ajoutez un appareil", false);
    return;
  }

  const payload = {};
  if (actionName === "message") {
    payload.message = ui.lockMessage.value.trim() || "Message Flliter Mobile";
  }

  const data = await apiRequest(`/api/devices/${currentDeviceId}/${actionName}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  setActionStatus(`Action ${actionName} envoyee (operation #${data.operation_id})`, true);

  if (actionName === "ring") startRingTimer();
  if (actionName === "lock") stopRingTimer();

  const devices = await loadDevices();
  renderDevices(devices);
  await loadStats();
  await loadJournal();
}

function bindEvents() {
  bindThemeSelectors();
  ui.apiBase.value = storage.getItem("flliter_api_base") || ui.apiBase.value;
  ui.apiBase.addEventListener("change", () => storage.setItem("flliter_api_base", getApiBase()));

  ui.registerBtn.addEventListener("click", async () => {
    try {
      await register();
      await loadData();
    } catch (error) {
      setAuthStatus(`Register error: ${error.message}`, false);
    }
  });

  ui.loginBtn.addEventListener("click", async () => {
    try {
      await login();
      await loadData();
    } catch (error) {
      setAuthStatus(`Login error: ${error.message}`, false);
    }
  });

  ui.logoutBtn.addEventListener("click", logout);
  ui.addDeviceForm.addEventListener("submit", async (e) => {
    try {
      await addDevice(e);
    } catch (error) {
      setActionStatus(`Ajout impossible: ${error.message}`, false);
    }
  });

  document.getElementById("scanBtn").addEventListener("click", async () => {
    try {
      await runBleScan();
    } catch (error) {
      ui.scanStatus.textContent = `Erreur scan: ${error.message}`;
    }
  });

  document.getElementById("stopRingBtn").addEventListener("click", () => {
    stopRingTimer();
    setActionStatus("Sonnerie arretee", true);
  });

  document.getElementById("sendLockBtn").addEventListener("click", async () => {
    try {
      if (!currentDeviceId) {
        setActionStatus("Selectionnez un appareil", false);
        return;
      }
      await apiRequest(`/api/devices/${currentDeviceId}/lock`, {
        method: "POST",
        body: JSON.stringify({ message: ui.lockMessage.value.trim() }),
      });
      setActionStatus("Verrouillage envoye", true);
      await loadData();
    } catch (error) {
      setActionStatus(`Erreur verrouillage: ${error.message}`, false);
    }
  });

  document.querySelectorAll("[data-device-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await runDeviceAction(button.getAttribute("data-device-action"));
      } catch (error) {
        setActionStatus(`Action error: ${error.message}`, false);
      }
    });
  });
}

async function bootstrap() {
  bindEvents();
  showLoginScreen();

  if (!authToken) {
    setAuthStatus("Connectez-vous pour acceder a l'application", false);
    return;
  }

  try {
    await loadData();
  } catch (_error) {
    storage.removeItem("flliter_token");
    authToken = "";
    showLoginScreen();
    setAuthStatus("Session expiree, reconnectez-vous.", false);
  }
}

bootstrap();
