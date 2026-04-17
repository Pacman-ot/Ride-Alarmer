export const firebaseConfig = {
 apiKey: "AIzaSyAe_vxarOPXOUAlLBG-AOMZ8VHDCYSOCcE",
  authDomain: "realtime-database-a8495.firebaseapp.com",
  databaseURL: "https://realtime-database-a8495-default-rtdb.firebaseio.com",
  projectId: "realtime-database-a8495",
  storageBucket: "realtime-database-a8495.firebasestorage.app",
  messagingSenderId: "224259929044",
  appId: "1:224259929044:web:a94ed53a1a4a79a9965c41"
};

export const rideIdKey = "ride-alarm.rideId";
export const destinationKey = "ride-alarm.destination";
export const radiusKey = "ride-alarm.radius";
export const defaultRideId = "demo-ride";
export const defaultRadiusMeters = 300;
export const defaultLocationPath = "rides";

export function isFirebaseConfigured(config = firebaseConfig) {
  return Boolean(
    config &&
      config.apiKey &&
      !config.apiKey.includes("YOUR_") &&
      config.databaseURL &&
      !config.databaseURL.includes("YOUR_")
  );
}
