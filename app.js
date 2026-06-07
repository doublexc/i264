// ============================================================
// app.js — Login + Bind Image Password Logic
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── DOM References ──────────────────────────────────────────
const userIdInput   = document.getElementById("userId");
const imageFileInput = document.getElementById("imageFile");
const fileDrop      = document.getElementById("fileDrop");
const statusMsg     = document.getElementById("statusMsg");
const btnLogin      = document.getElementById("btnLogin");
const btnBind       = document.getElementById("btnBind");
const btnGoDestroy  = document.getElementById("btnGoDestroy");
const secretModal   = document.getElementById("secretModal");
const secret7Display = document.getElementById("secret7Display");
const btnCloseModal = document.getElementById("btnCloseModal");

// ── Helpers ──────────────────────────────────────────────────

/**
 * แสดงข้อความสถานะใต้ form
 * @param {string} text  - ข้อความ
 * @param {'error'|'success'|'info'} type - ประเภท
 */
function showMsg(text, type = "info") {
  statusMsg.textContent = text;
  statusMsg.className = `msg msg-${type} show`;
}

/** ซ่อนข้อความสถานะ */
function hideMsg() {
  statusMsg.className = "msg";
}

/**
 * อ่านไฟล์รูปภาพแล้วแปลงเป็น Base64 string เต็ม
 * รวม header เช่น "data:image/png;base64,iVBOR..."
 * @param {File} file
 * @returns {Promise<string>}
 */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsDataURL(file);
  });
}

/**
 * สร้าง Secret7 แบบสุ่ม
 * ใช้ชุดอักขระ A-Z a-z 0-9 รวม 62 ตัว
 * @returns {string} ความยาว 7 ตัวอักษร
 */
function generateSecret7() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * ตรวจสอบ Input พื้นฐาน (ID และไฟล์รูป)
 * @returns {boolean}
 */
function validateInputs() {
  if (!userIdInput.value.trim()) {
    showMsg("⚠ Please enter your User ID.", "error");
    return false;
  }
  if (!imageFileInput.files[0]) {
    showMsg("⚠ Please select an image file.", "error");
    return false;
  }
  return true;
}

// ── File Drop UI Update ──────────────────────────────────────
imageFileInput.addEventListener("change", () => {
  if (imageFileInput.files[0]) {
    // แสดงชื่อไฟล์ที่เลือก
    fileDrop.classList.add("has-file");
    fileDrop.querySelector(".drop-label").textContent =
      `✓ ${imageFileInput.files[0].name}`;
    hideMsg();
  }
});

// ── Button: Go To Destroy Page ───────────────────────────────
btnGoDestroy.addEventListener("click", () => {
  window.location.href = "destroy.html";
});

// ── Button: Close Modal ──────────────────────────────────────
btnCloseModal.addEventListener("click", () => {
  secretModal.classList.remove("show");
});

// ── Button: Bind Image Password ─────────────────────────────
btnBind.addEventListener("click", async () => {
  if (!validateInputs()) return;

  const userId = userIdInput.value.trim();
  const file   = imageFileInput.files[0];

  btnBind.disabled = true;
  btnBind.innerHTML = '<span class="spinner"></span>Processing...';
  hideMsg();

  try {
    // 1. แปลงไฟล์เป็น Base64 เต็ม
    const imageBase64 = await readFileAsBase64(file);

    // 2. ตรวจสอบว่า ID ซ้ำหรือไม่
    const docRef  = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      showMsg("❌ ID already exists. Please choose another ID.", "error");
      return;
    }

    // 3. สร้าง Secret7
    const secret7 = generateSecret7();

    // 4. บันทึกลง Firestore
    await setDoc(docRef, {
      id: userId,
      imageBase64: imageBase64,   // เก็บ Base64 จริง (ทดลองด้าน security)
      secret7: secret7
    });

    // 5. แสดง Secret7 ใน Modal
    secret7Display.textContent = secret7;
    secretModal.classList.add("show");

    // Reset form
    userIdInput.value = "";
    imageFileInput.value = "";
    fileDrop.classList.remove("has-file");
    fileDrop.querySelector(".drop-label").innerHTML =
      '<span>Click to choose</span> or drag image here<br><small>PNG / JPG / JPEG</small>';

  } catch (err) {
    console.error("Bind error:", err);
    showMsg(`❌ Firestore Error: ${err.message}`, "error");
  } finally {
    btnBind.disabled = false;
    btnBind.innerHTML = "🔗 Bind Image Password";
  }
});

// ── Button: Login ────────────────────────────────────────────
btnLogin.addEventListener("click", async () => {
  if (!validateInputs()) return;

  const userId = userIdInput.value.trim();
  const file   = imageFileInput.files[0];

  btnLogin.disabled = true;
  btnLogin.innerHTML = '<span class="spinner"></span>Verifying...';
  hideMsg();

  try {
    // 1. อ่านรูปภาพและแปลงเป็น Base64
    const uploadedBase64 = await readFileAsBase64(file);

    // 2. ค้นหา ID ใน Firestore
    const docRef  = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // ไม่พบ ID
      showMsg("❌ Login Failed — ID not found.", "error");
      return;
    }

    // 3. เปรียบเทียบ Base64 ต้องตรงกัน 100% ทุกตัวอักษร
    const storedBase64 = docSnap.data().imageBase64;

    if (storedBase64 === uploadedBase64) {
      showMsg("✅ Login Successful! Welcome, " + userId, "success");
    } else {
      showMsg("❌ Login Failed — Image does not match.", "error");
    }

  } catch (err) {
    console.error("Login error:", err);
    showMsg(`❌ Firestore Error: ${err.message}`, "error");
  } finally {
    btnLogin.disabled = false;
    btnLogin.innerHTML = "🔐 Login";
  }
});
