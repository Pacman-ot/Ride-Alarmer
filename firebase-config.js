export const firebaseConfig = {
 apiKey: "Your_API",
  authDomain: "AUTH_Token",
  databaseURL: "DB_URL",
  projectId: "Project_ID",
  storageBucket: "Storage_Bucket",
  messagingSenderId: "Sender_ID",
  appId: "App_ID"
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
