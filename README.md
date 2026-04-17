# Ride Alarm

A static two-page location alarm that uses Firebase Realtime Database as the middleman between a rider's phone and your monitor page.

## What it does

- `track.html` runs on the rider's phone and writes GPS updates to Firebase.
- `monitor.html` lets you drop a destination pin, sets a radius, and rings when the rider enters range.
- `index.html` is a landing page with quick links and setup notes.
- `firebase-rules.json` contains a starter Realtime Database ruleset.

## Stack

- Plain HTML, CSS, and JavaScript
- Leaflet + OpenStreetMap
- Firebase Realtime Database
- GitHub Pages or Netlify for hosting

## Setup

1. Create a Firebase project.
2. Enable Realtime Database.
3. Start in test mode while you are prototyping.
4. Copy your Firebase config into [firebase-config.js](firebase-config.js).
5. If you want a stricter ruleset, paste [firebase-rules.json](firebase-rules.json) into the Realtime Database rules editor and adapt it for your setup.
6. Publish these files to a static host.

## Files to update

- [firebase-config.js](firebase-config.js) for your Firebase keys and defaults.
- [firebase-rules.json](firebase-rules.json) for a starter database policy.
- [track.html](track.html) and [monitor.html](monitor.html) if you want to change the UI.

## Usage

- Open [track.html](track.html) on the rider's phone, then start tracking.
- Open [monitor.html](monitor.html) on your device, connect to the same ride ID, and place the destination pin.
- Keep both pages open while the trip is active.
- Use the generate-code button on the tracking page if you want a fresh ride ID and a copyable monitor link.

## Sharing flow

1. Open [track.html](track.html) on the rider's phone.
2. Click `Generate code` or type your own ride ID.
3. Copy the monitor link and open that on your own device.
4. Set the destination pin and radius.
5. Keep both pages open until arrival.

## Notes

- Browsers may reduce background geolocation when the page is hidden.
- Live location tracking should only be used with explicit consent.
- For production use, tighten Firebase rules, add Firebase Authentication, and avoid leaving the database open in test mode.
