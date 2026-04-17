import {
  defaultLocationPath,
  defaultRadiusMeters,
  defaultRideId,
  destinationKey,
  firebaseConfig,
  isFirebaseConfigured,
  radiusKey,
  rideIdKey
} from "./firebase-config.js";
import {
  buildRideLink,
  copyText,
  createAlarmController,
  formatCoordinate,
  formatMeters,
  haversineMeters,
  getRideIdFromUrl,
  readStoredJson,
  writeStoredJson
} from "./shared.js";

const rideIdInput = document.getElementById("monitorRideId");
const monitorLinkInput = document.getElementById("monitorLink");
const copyMonitorLinkButton = document.getElementById("copyMonitorLink");
const connectButton = document.getElementById("connectRide");
const muteButton = document.getElementById("muteAlarm");
const radiusRange = document.getElementById("radiusRange");
const radiusLabel = document.getElementById("radiusLabel");
const monitorAlert = document.getElementById("monitorAlert");
const connectionStatus = document.getElementById("connectionStatus");
const distanceValue = document.getElementById("distanceValue");
const lastSeenValue = document.getElementById("lastSeenValue");
const alarmState = document.getElementById("alarmState");

const storedDestination = readStoredJson(destinationKey, { lat: 28.6139, lng: 77.209 });
const storedRadius = Number(localStorage.getItem(radiusKey)) || defaultRadiusMeters;
const storedRideId = localStorage.getItem(rideIdKey) || defaultRideId;

rideIdInput.value = storedRideId;
radiusRange.value = String(storedRadius);
radiusLabel.textContent = `${storedRadius} m`;

const map = L.map("monitorMap", {
  zoomControl: true
}).setView([storedDestination.lat, storedDestination.lng], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let destinationMarker = L.marker([storedDestination.lat, storedDestination.lng], { draggable: true }).addTo(map);
let destinationCircle = L.circle([storedDestination.lat, storedDestination.lng], {
  radius: storedRadius,
  color: "#8dffcf",
  fillColor: "#8dffcf",
  fillOpacity: 0.12
}).addTo(map);
let riderMarker = null;
let riderCircle = null;
let database = null;
let unsubscribe = null;
let connectedRideId = storedRideId;
const alarm = createAlarmController();
let alarmActive = false;

function updateLinks() {
  const rideId = rideIdInput.value.trim() || defaultRideId;
  monitorLinkInput.value = buildRideLink("monitor.html", rideId);
}

function setMessage(text, tone = "normal") {
  monitorAlert.textContent = text;
  monitorAlert.classList.toggle("success", tone === "success");
  monitorAlert.classList.toggle("alert", true);
}

function saveDestination(point) {
  writeStoredJson(destinationKey, point);
  destinationMarker.setLatLng([point.lat, point.lng]);
  destinationCircle.setLatLng([point.lat, point.lng]);
  updateRadius(Number(radiusRange.value));
}

function updateRadius(value) {
  const radius = Math.max(50, Number(value) || defaultRadiusMeters);
  radiusRange.value = String(radius);
  radiusLabel.textContent = `${radius} m`;
  destinationCircle.setRadius(radius);
  localStorage.setItem(radiusKey, String(radius));
}

function updateArrivalState(riderPoint) {
  const destinationPoint = destinationMarker.getLatLng();
  const distance = haversineMeters(riderPoint, destinationPoint);
  const radius = destinationCircle.getRadius();
  distanceValue.textContent = formatMeters(distance);
  destinationCircle.setLatLng(destinationPoint);
  destinationCircle.setRadius(radius);
  lastSeenValue.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (!riderMarker) {
    riderMarker = L.marker([riderPoint.lat, riderPoint.lng]).addTo(map);
  } else {
    riderMarker.setLatLng([riderPoint.lat, riderPoint.lng]);
  }

  if (!riderCircle) {
    riderCircle = L.circle([riderPoint.lat, riderPoint.lng], {
      radius: 30,
      color: "#57d7ff",
      fillColor: "#57d7ff",
      fillOpacity: 0.16
    }).addTo(map);
  } else {
    riderCircle.setLatLng([riderPoint.lat, riderPoint.lng]);
  }

  if (distance <= radius) {
    alarmState.textContent = "Arrived";
    connectionStatus.textContent = "Inside radius";
    if (!alarmActive) {
      alarmActive = true;
      alarm.start();
      setMessage(`Arrival detected at ${formatMeters(distance)} away.`, "success");
    }
  } else {
    alarmState.textContent = "Monitoring";
    connectionStatus.textContent = "Connected";
    alarmActive = false;
    alarm.stop();
  }
}

async function connectRide() {
  if (!isFirebaseConfigured(firebaseConfig)) {
    setMessage("Paste your Firebase config into firebase-config.js first.", "danger");
    connectionStatus.textContent = "Not configured";
    return;
  }

  connectedRideId = rideIdInput.value.trim() || defaultRideId;
  localStorage.setItem(rideIdKey, connectedRideId);
  updateLinks();
  connectionStatus.textContent = "Connecting...";

  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
  const { getDatabase, ref, onValue, off } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js");

  if (!database) {
    database = getDatabase(initializeApp(firebaseConfig));
  }

  if (unsubscribe) {
    unsubscribe();
  }

  const locationRef = ref(database, `${defaultLocationPath}/${connectedRideId}/location`);
  unsubscribe = onValue(
    locationRef,
    (snapshot) => {
      const value = snapshot.val();
      if (!value || !Number.isFinite(value.lat) || !Number.isFinite(value.lng)) {
        connectionStatus.textContent = "Waiting for location";
        setMessage("Connected. Waiting for the rider's location.");
        return;
      }

      connectionStatus.textContent = "Live";
      setMessage("Live location received.", "success");
      updateArrivalState({ lat: value.lat, lng: value.lng });
    },
    (error) => {
      console.error(error);
      connectionStatus.textContent = "Connection error";
      setMessage(error.message, "danger");
    }
  );

  connectButton.textContent = "Reconnect";
}

map.on("click", (event) => {
  saveDestination({ lat: event.latlng.lat, lng: event.latlng.lng });
  setMessage("Destination moved.", "success");
});

destinationMarker.on("dragend", () => {
  const latLng = destinationMarker.getLatLng();
  saveDestination({ lat: latLng.lat, lng: latLng.lng });
  setMessage("Destination moved.", "success");
});

radiusRange.addEventListener("input", (event) => updateRadius(event.target.value));
connectButton.addEventListener("click", connectRide);
copyMonitorLinkButton.addEventListener("click", async () => {
  try {
    await copyText(monitorLinkInput.value);
    setMessage("Monitor link copied.", "success");
  } catch (error) {
    console.error(error);
    setMessage("Could not copy link.", "danger");
  }
});
muteButton.addEventListener("click", () => {
  alarm.stop();
  alarmActive = false;
  alarmState.textContent = "Muted";
  setMessage("Alarm muted.");
});

rideIdInput.addEventListener("change", () => {
  const rideId = rideIdInput.value.trim() || defaultRideId;
  localStorage.setItem(rideIdKey, rideId);
  updateLinks();
});

window.addEventListener("beforeunload", () => {
  alarm.stop();
});

if (!isFirebaseConfigured(firebaseConfig)) {
  setMessage("Paste your Firebase config into firebase-config.js before using live sync.", "danger");
  connectionStatus.textContent = "Not configured";
} else {
  connectionStatus.textContent = "Ready";
  setMessage("Firebase is configured. Click Connect to listen for the rider.");
}

updateRadius(storedRadius);
saveDestination(storedDestination);
const initialRideId = getRideIdFromUrl(storedRideId);
rideIdInput.value = initialRideId;
localStorage.setItem(rideIdKey, initialRideId);
updateLinks();
