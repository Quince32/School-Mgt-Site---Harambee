import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

// Replace these values with your actual Web App config from Firebase Console -> Project Settings
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "harambee-primary-school.firebaseapp.com",
    projectId: "harambee-primary-school",
    storageBucket: "harambee-primary-school.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Automatically connect to Firebase Local Emulator Suite when testing locally
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    // Uncomment the line below if you add "firestore": { "port": 8080 } to firebase.json
    // connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export { app, auth, db };
