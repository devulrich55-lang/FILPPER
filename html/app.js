const storage = window.localStorage;

const ui = {
  loginScreen: document.getElementById("loginScreen"),
  appContent: document.getElementById("appContent"),
  apiBase: document.getElementById("apiBase"),
  username: document.getElementById("username"),
  password: document.getElementById("password"),
  loginBtn: document.getElementById("loginBtn"),
  registerBtn: document.getElementById("registerBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  authStatus: document.getElementById("authStatus"),
  userInfo: document.getElementById("userInfo"),
  deviceList: document.getElementById("deviceList"),
  deviceActionStatus: document.getElementById("deviceActionStatus"),
  statTotal: document.getElementById("stat-total"),
  statDetectes: document.getElementById("stat-detectes"),
  statRecup: document.getElementById("stat-recup"),
  statAlertes: document.getElementById("stat-alertes"),
  laptopMap: document.getElementById("laptopMap"),
};

let authToken = storage.getItem("flliter_token") || "";
let currentDeviceId = null;

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
    throw new Error(data?.detail || `HTTP ${response.status}`);
  }
  return data;
}

async function register() {
  const payload = {
    username: ui.username.value.trim(),
    password: ui.password.value.trim(),
    scopes: "admin",
  };
  const data = await apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  }, false);
  authToken = data.access_token;
  storage.setItem("flliter_token", authToken);
  setAuthStatus("Compte cree et connecte (admin)", true);
}

async function login() {
  const payload = {
    username: ui.username.value.trim(),
    password: ui.password.value.trim(),
  };
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  }, false);
  authToken = data.access_token;
  storage.setItem("flliter_token", authToken);
  setAuthStatus("Connecte au backend", true);
}

function logout() {
  authToken = "";
  storage.removeItem("flliter_token");
  showLoginScreen();
  setAuthStatus("Connectez-vous pour acceder a l'application", false);
}

async function ensureSeedDevices() {
  const devices = await apiRequest("/api/devices");
  if (devices.length > 0) {
    return devices;
  }

  const seed = [
    { name: "Android - Inconnu", device_type: "Android", status: "online" },
    { name: "iPhone - Inconnu", device_type: "iOS", status: "online" },
    { name: "PC - HP", device_type: "Windows", status: "offline" },
  ];
  for (const item of seed) {
    await apiRequest("/api/devices", {
      method: "POST",
      body: JSON.stringify(item),
    });
  }
  return apiRequest("/api/devices");
}

function renderDevices(devices) {
  if (!devices.length) {
    ui.deviceList.innerHTML = "<p>Aucun appareil</p>";
    return;
  }

  currentDeviceId = devices[0].id;
  ui.deviceList.innerHTML = devices
    .slice(0, 3)
    .map((device) => `<p>${device.name} · ${device.status}</p>`)
    .join("");
}

async function loadStats() {
  const stats = await apiRequest("/api/dashboard/stats");
  ui.statTotal.textContent = stats.totalAppareils ?? "--";
  ui.statDetectes.textContent = stats.detectesAujourdHui ?? "--";
  ui.statRecup.textContent = stats.tauxRecuperation ?? "--";
  ui.statAlertes.textContent = stats.alertes ?? "--";
}

async function loadData() {
  const me = await apiRequest("/api/auth/me");
  ui.userInfo.textContent = `Connecte: ${me.username}`;

  const devices = await ensureSeedDevices();
  renderDevices(devices);
  await loadStats();

  ui.laptopMap.textContent = `Donnees live chargees · ${devices.length} appareil(s)`;
  showApp();
}

async function runDeviceAction(actionName) {
  if (!currentDeviceId) {
    setActionStatus("Aucun appareil disponible", false);
    return;
  }

  const payload = { dry_run: true };
  if (actionName === "message") {
    payload.message = "Message depuis Flliter Mobile";
  }

  const data = await apiRequest(`/api/devices/${currentDeviceId}/${actionName}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setActionStatus(
    `Action ${actionName} envoyee (op #${data.operation_id}, dry_run=${data.dryRun})`,
    true,
  );
  await loadStats();
}

function bindEvents() {
  ui.apiBase.value = storage.getItem("flliter_api_base") || ui.apiBase.value;
  ui.apiBase.addEventListener("change", () => {
    storage.setItem("flliter_api_base", getApiBase());
  });

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

  document.querySelectorAll("[data-device-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const actionName = button.getAttribute("data-device-action");
      try {
        await runDeviceAction(actionName);
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
