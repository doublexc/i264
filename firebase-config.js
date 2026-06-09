import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyAYEBCTPrlybkEIXMYlMWWpPfZ6FGQ4W0s",
  authDomain: "image-password-lab.firebaseapp.com",
  projectId: "image-password-lab",
  storageBucket: "image-password-lab.firebasestorage.app",
  messagingSenderId: "1077832857404",
  appId: "1:1077832857404:web:2d2e96d594d109e2895039"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LeschItAAAAA...PHBM"),  // ← Site Key
  isTokenAutoRefreshEnabled: true
});

export { db };
