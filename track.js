import {
  defaultLocationPath,
  defaultRideId,
  firebaseConfig,
  isFirebaseConfigured,
  rideIdKey
} from "./firebase-config.js";
import {
  formatCoordinate,
  getRideIdFromUrl,
  readStoredJson,
  writeStoredJson
} from "./shared.js";

const rideIdInput = document.getElementById("rideId");
const startButton = document.getElementById("startTracking");
const stopButton = document.getElementById("stopTracking");
const statusElement = document.getElementById("trackStatus");
const timestampElement = document.getElementById("timestampValue");
const setupAlert = document.getElementById("setupAlert");

const initialRideId = getRideIdFromUrl(localStorage.getItem(rideIdKey) || defaultRideId);
rideIdInput.value = initialRideId;
localStorage.setItem(rideIdKey, initialRideId);

const map = L.map("trackMap", {
  zoomControl: true
}).setView([28.6139, 77.209], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const marker = L.marker([28.6139, 77.209]).addTo(map);
const accuracyCircle = L.circle([28.6139, 77.209], {
  radius: 25,
  color: "#57d7ff",
  fillColor: "#57d7ff",
  fillOpacity: 0.18
}).addTo(map);

let firebaseDatabase = null;
let watchId = null;
let lastLocation = null;

function setStatus(text, tone = "normal") {
  statusElement.textContent = text;
  setupAlert.classList.toggle("success", tone === "success");
  if (tone === "danger") {
    setupAlert.classList.remove("success");
  }
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

async function connectFirebase() {
  if (!isFirebaseConfigured(firebaseConfig)) {
    setupAlert.textContent = "Paste your Firebase config into firebase-config.js before using live sync.";
    setStatus("Firebase not configured", "danger");
    return null;
  }

  if (!firebaseDatabase) {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
    const { getDatabase } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js");
    const app = initializeApp(firebaseConfig);
    firebaseDatabase = getDatabase(app);
  }

  return firebaseDatabase;
}

async function pushLocation(position) {
  const database = await connectFirebase();
  if (!database) {
    return;
  }

  const rideId = rideIdInput.value.trim() || defaultRideId;
  localStorage.setItem(rideIdKey, rideId);
  const { ref, set } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js");

  const payload = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: Date.now()
  };

  await set(ref(database, `${defaultLocationPath}/${rideId}/location`), payload);
  lastLocation = payload;
  marker.setLatLng([payload.lat, payload.lng]);
  accuracyCircle.setLatLng([payload.lat, payload.lng]).setRadius(Math.max(payload.accuracy || 25, 25));
  map.panTo([payload.lat, payload.lng]);
  timestampElement.textContent = formatTimestamp(payload.timestamp);
  setStatus("Sharing live location", "success");
}

function startTracking() {
  if (!navigator.geolocation) {
    setStatus("Geolocation not supported", "danger");
    return;
  }

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }

  setStatus("Requesting permission...");
  watchId = navigator.geolocation.watchPosition(
    async (position) => {
      try {
        await pushLocation(position);
      } catch (error) {
        console.error(error);
        setStatus("Firebase write failed", "danger");
        setupAlert.textContent = "Unable to write to Firebase. Check your config and database rules.";
      }
    },
    (error) => {
      console.error(error);
      setStatus(error.message, "danger");
      setupAlert.textContent = error.message;
    },
    {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 12000
    }
  );
}

function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  setStatus("Stopped");
}

startButton.addEventListener("click", startTracking);
stopButton.addEventListener("click", stopTracking);
rideIdInput.addEventListener("change", () => {
  const rideId = rideIdInput.value.trim() || defaultRideId;
  localStorage.setItem(rideIdKey, rideId);
});

const lastStoredLocation = readStoredJson("ride-alarm.last-track-location", null);
if (lastStoredLocation) {
  marker.setLatLng([lastStoredLocation.lat, lastStoredLocation.lng]);
  accuracyCircle.setLatLng([lastStoredLocation.lat, lastStoredLocation.lng]).setRadius(Math.max(lastStoredLocation.accuracy || 25, 25));
  timestampElement.textContent = formatTimestamp(lastStoredLocation.timestamp);
  map.setView([lastStoredLocation.lat, lastStoredLocation.lng], 15);
}

window.addEventListener("beforeunload", () => {
  if (lastLocation) {
    writeStoredJson("ride-alarm.last-track-location", lastLocation);
  }
});

if (!isFirebaseConfigured(firebaseConfig)) {
  setupAlert.textContent = "Paste your Firebase config into firebase-config.js before using live sync.";
  setStatus("Firebase not configured", "danger");
} else {
  setupAlert.textContent = "Firebase is configured. Tap Start tracking when the ride begins.";
  setStatus("Ready to start");
}
