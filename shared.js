export function haversineMeters(from, to) {
  const earthRadius = 6371000;
  const startLat = toRadians(from.lat);
  const endLat = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

export function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function formatMeters(meters) {
  if (!Number.isFinite(meters)) {
    return "--";
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatCoordinate(value) {
  return Number.isFinite(value) ? value.toFixed(6) : "--";
}

export function readStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getRideIdFromUrl(fallback = "") {
  const params = new URLSearchParams(window.location.search);
  return params.get("ride")?.trim() || fallback;
}

export function setRideIdInUrl(rideId) {
  const url = new URL(window.location.href);
  url.searchParams.set("ride", rideId);
  window.history.replaceState({}, "", url);
  return url.toString();
}

export function generateRideCode(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
}

export function buildRideLink(pageName, rideId) {
  const url = new URL(pageName, window.location.href);
  url.searchParams.set("ride", rideId);
  return url.toString();
}

export async function copyText(value) {
  await navigator.clipboard.writeText(value);
}

export function createAlarmController() {
  let audioContext = null;
  let oscillator = null;
  let gainNode = null;
  let timerId = null;

  function stop() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }

    if (oscillator) {
      oscillator.stop();
      oscillator.disconnect();
      oscillator = null;
    }

    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
  }

  function start() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    stop();

    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.0001;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();

    const sequence = [
      [0.0001, 0.15],
      [0.18, 0.15],
      [0.0001, 0.15],
      [0.18, 0.15]
    ];

    let index = 0;
    timerId = setInterval(() => {
      if (!gainNode) {
        return;
      }

      const [volume] = sequence[index % sequence.length];
      gainNode.gain.setTargetAtTime(volume, audioContext.currentTime, 0.01);
      index += 1;
    }, 220);
  }

  return { start, stop };
}

export function isPlaceholderText(value) {
  return typeof value === "string" && value.includes("YOUR_");
}
