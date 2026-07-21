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
  offlineInfo: document.getElementById("offlineInfo"),
  bleSupport: document.getElementById("bleSupport"),
};

let authToken = storage.getItem("flliter_token") || "";
let currentDeviceId = null;
let ringInterval = null;
let ringSeconds = 0;
let activeTab = storage.getItem("flliter_tab") || "home";

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

function getBleSupportMessage() {
  if (!window.isSecureContext) {
    return "Bluetooth: utilisez http://localhost ou HTTPS (pas file://)";
  }
  if (!navigator.bluetooth) {
    return "Web Bluetooth indisponible — utilisez Chrome ou Edge sur PC";
  }
  if (navigator.bluetooth.requestLEScan) {
    return "Scan passif BLE disponible (Chrome/Edge, autorisation requise)";
  }
  return "Selection manuelle BLE disponible (un appareil a la fois)";
}

function updateBleSupportLabel() {
  if (ui.bleSupport) ui.bleSupport.textContent = getBleSupportMessage();
}

async function apiRequest(path, options = {}, requiresAuth = true) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (requiresAuth && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response;
  try {
    response = await fetch(`${getApiBase()}${path}`, { ...options, headers });
  } catch (_error) {
    throw new Error(`Backend inaccessible sur ${getApiBase()}. Lancez: uvicorn app.main:app --port 8000`);
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_error) {
    throw new Error(`Reponse invalide du serveur (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(typeof data?.detail === "string" ? data.detail : `HTTP ${response.status}`);
  }
  return data;
}

async function checkBackendHealth() {
  try {
    await apiRequest("/healthz", {}, false);
    return true;
  } catch (_error) {
    return false;
  }
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
  const healthy = await checkBackendHealth();
  if (!healthy) {
    throw new Error(`Backend inaccessible sur ${getApiBase()}`);
  }

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

function switchTab(tabId) {
  activeTab = tabId;
  storage.setItem("flliter_tab", tabId);

  document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.getAttribute("data-tab-panel") !== tabId);
  });

  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
  });
}

function bindTabNavigation() {
  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.getAttribute("data-tab")));
  });
  switchTab(activeTab);
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

  if (ui.offlineInfo && selected) {
    ui.offlineInfo.textContent = `Dernier appareil actif: ${selected.name} (${selected.device_type || "type inconnu"}) — statut ${selected.status}.`;
  }
}

function renderScanResults(result) {
  const items = result?.items || result?.devices || [];
  if (!items.length) {
    ui.scanResults.innerHTML = `<p>${result?.message || "Aucun resultat de scan"}</p>`;
    return;
  }

  ui.scanResults.innerHTML = items
    .map((item) => {
      const name = item.name || item.tag_uid || item.key_id || "Element";
      const meta = [item.device_type || item.protocol || item.type, item.address, item.rssi != null ? `${item.rssi} dBm` : ""]
        .filter(Boolean)
        .join(" · ");
      return `<p class="scan-item"><strong>${name}</strong><br/><small>${meta}</small></p>`;
    })
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

  ui.scanStatus.textContent = "Pret pour analyse de l'environnement BLE";
  ui.scanResults.innerHTML = "<p>Aucun scan effectue</p>";
  updateBleSupportLabel();
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

async function scanBleFromBrowser(timeoutSec = 8) {
  if (!window.isSecureContext || !navigator.bluetooth) {
    return [];
  }

  const found = new Map();

  if (navigator.bluetooth.requestLEScan) {
    const scan = await navigator.bluetooth.requestLEScan({ acceptAllAdvertisements: true });

    await new Promise((resolve) => {
      const onAdv = (event) => {
        const device = event.device;
        const name = device.name || event.name || `BLE ${String(device.id).slice(0, 8)}`;
        found.set(device.id, {
          name,
          address: device.id,
          device_type: "BLE",
          protocol: "ble",
          rssi: event.rssi ?? null,
          status: "online",
        });
      };

      navigator.bluetooth.addEventListener("advertisementreceived", onAdv);
      setTimeout(() => {
        scan.stop();
        navigator.bluetooth.removeEventListener("advertisementreceived", onAdv);
        resolve();
      }, timeoutSec * 1000);
    });

    return [...found.values()];
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [],
    });
    return [{
      name: device.name || "Appareil Bluetooth",
      address: device.id,
      device_type: "BLE",
      protocol: "ble",
      status: "online",
    }];
  } catch (error) {
    if (error.name === "NotFoundError") return [];
    throw error;
  }
}

async function runBleScan() {
  ui.scanStatus.textContent = "Analyse de l'environnement en cours...";
  ui.scanResults.innerHTML = "<p>Recherche des appareils Bluetooth a proximite...</p>";

  let browserDevices = [];
  let browserError = "";

  try {
    browserDevices = await scanBleFromBrowser(8);
  } catch (error) {
    browserError = error.message;
  }

  const payload = {
    register: true,
    timeout: 8,
    use_server_scan: true,
  };

  if (browserDevices.length) {
    payload.devices = browserDevices;
    payload.use_server_scan = false;
    ui.scanStatus.textContent = `${browserDevices.length} appareil(s) detecte(s) par le navigateur, enregistrement...`;
  } else if (browserError) {
    ui.scanStatus.textContent = `Navigateur: ${browserError}. Scan serveur en cours...`;
  } else if (navigator.bluetooth) {
    ui.scanStatus.textContent = "Aucun appareil via navigateur. Scan Bluetooth du PC (backend)...";
  } else {
    ui.scanStatus.textContent = "Scan Bluetooth du PC via backend...";
  }

  const data = await apiRequest("/api/ble/scan", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const result = data.result || {};
  renderScanResults(result);

  const source = result.source || (browserDevices.length ? "browser" : "server");
  const count = result.count || 0;
  if (count > 0) {
    ui.scanStatus.textContent = `${count} appareil(s) detecte(s) (source: ${source})`;
  } else {
    ui.scanStatus.textContent = result.message || "Aucun appareil BLE detecte. Verifiez que le Bluetooth est active sur le PC.";
  }

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
  bindTabNavigation();
  updateBleSupportLabel();

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

  document.querySelectorAll("[data-goto-tab]").forEach((el) => {
    el.addEventListener("click", () => switchTab(el.getAttribute("data-goto-tab")));
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
    setAuthStatus("Session expiree ou backend inaccessible. Reconnectez-vous.", false);
  }
}

bootstrap();
