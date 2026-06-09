// ============================================================
// app.js — Login + Bind Image Password Logic
// ============================================================

import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── DOM References ──────────────────────────────────────────
const userIdInput    = document.getElementById("userId");
const imageFileInput = document.getElementById("imageFile");
const fileDrop       = document.getElementById("fileDrop");
const statusMsg      = document.getElementById("statusMsg");
const btnLogin       = document.getElementById("btnLogin");
const btnBind        = document.getElementById("btnBind");
const btnGoDestroy   = document.getElementById("btnGoDestroy");
const secretModal    = document.getElementById("secretModal");
const secret7Display = document.getElementById("secret7Display");
const btnCloseModal  = document.getElementById("btnCloseModal");

// ── Helpers ──────────────────────────────────────────────────

function showMsg(text, type = "info") {
  statusMsg.textContent = text;
  statusMsg.className = `msg msg-${type} show`;
}

function hideMsg() {
  statusMsg.className = "msg";
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsDataURL(file);
  });
}

// ── hashImage อยู่ข้างนอก ใช้ได้ทั้ง Bind และ Login ──────────
async function hashImage(base64String) {
  const encoder = new TextEncoder();
  const data = encoder.encode(base64String);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateSecret7() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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

// ── Events ───────────────────────────────────────────────────

imageFileInput.addEventListener("change", () => {
  if (imageFileInput.files[0]) {
    fileDrop.classList.add("has-file");
    fileDrop.querySelector(".drop-label").textContent =
      `✓ ${imageFileInput.files[0].name}`;
    hideMsg();
  }
});

btnGoDestroy.addEventListener("click", () => {
  window.location.href = "destroy.html";
});

btnCloseModal.addEventListener("click", () => {
  secretModal.classList.remove("show");
});

// ── Bind ─────────────────────────────────────────────────────
btnBind.addEventListener("click", async () => {
  if (!validateInputs()) return;

  const userId = userIdInput.value.trim();
  const file   = imageFileInput.files[0];

  btnBind.disabled = true;
  btnBind.innerHTML = '<span class="spinner"></span>Processing...';
  hideMsg();

  try {
    const imageBase64 = await readFileAsBase64(file);
    const imageHash   = await hashImage(imageBase64);

    const docRef  = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      showMsg("❌ ID already exists. Please choose another ID.", "error");
      return;
    }

    const secret7 = generateSecret7();

    await setDoc(docRef, {
      id: userId,
      imageHash: imageHash,
      secret7: secret7
    });

    secret7Display.textContent = secret7;
    secretModal.classList.add("show");

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

// ── Login ────────────────────────────────────────────────────
btnLogin.addEventListener("click", async () => {
  if (!validateInputs()) return;

  const userId = userIdInput.value.trim();
  const file   = imageFileInput.files[0];

  btnLogin.disabled = true;
  btnLogin.innerHTML = '<span class="spinner"></span>Verifying...';
  hideMsg();

  try {
    const uploadedBase64 = await readFileAsBase64(file);
    const uploadedHash   = await hashImage(uploadedBase64);

    const docRef  = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      showMsg("❌ Login Failed — ID not found.", "error");
      return;
    }

    const storedHash = docSnap.data().imageHash;

    if (storedHash === uploadedHash) {
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
