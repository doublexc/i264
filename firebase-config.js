// ============================================================
// firebase-config.js
// ตั้งค่า Firebase และ Export ตัวแปรสำหรับใช้งานใน app.js
// ============================================================

// ⚠️ ให้แก้ค่าด้านล่างนี้ด้วยค่าจาก Firebase Console ของคุณ
const firebaseConfig = {
  apiKey: "AIzaSyAYEBCTPrlybkEIXMYlMWWpPfZ6FGQ4W0s",
  authDomain: "image-password-lab.firebaseapp.com",
  projectId: "image-password-lab",
  storageBucket: "image-password-lab.firebasestorage.app",
  messagingSenderId: "1077832857404",
  appId: "1:1077832857404:web:2d2e96d594d109e2895039"
};

// Import Firebase SDK จาก CDN (ES Module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// เริ่มต้น Firebase App
const app = initializeApp(firebaseConfig);

// สร้าง Firestore instance
const db = getFirestore(app);
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-check.js";

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LeschItAAAAAEZcWhF8j9sV1hyzlNBa-UdgtJNZ"),
  isTokenAutoRefreshEnabled: true
});
// Export db ออกไปใช้งานในไฟล์อื่น
export { db };
