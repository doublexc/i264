// ============================================================
// destroy.js — Image Destroy & Recover Logic
// ไม่ต้องใช้ Firebase — ทำงาน client-side ล้วน
// ============================================================

// ── DOM References ──────────────────────────────────────────
const mainFileInput   = document.getElementById("mainFile");
const fileDrop        = document.getElementById("fileDrop");
const dropLabel       = document.getElementById("dropLabel");
const destroyKeyInput = document.getElementById("destroyKey");
const validationMsg   = document.getElementById("validationMsg");
const destroyInfo     = document.getElementById("destroyInfo");
const btnDestroy      = document.getElementById("btnDestroy");
const btnRecover      = document.getElementById("btnRecover");

// ── State ───────────────────────────────────────────────────
let currentFileContent = ""; // เก็บ text content ของไฟล์ที่โหลดมา
let currentFileName   = "";

// ── Helpers ──────────────────────────────────────────────────

/**
 * แสดงข้อความ validation
 */
function showValidation(text, type) {
  validationMsg.textContent = text;
  validationMsg.className = `msg msg-${type} show`;
}

/** ซ่อน validation */
function hideValidation() {
  validationMsg.className = "msg";
}

/**
 * อ่านไฟล์รูปภาพ → แปลงเป็น <img src="data:...;base64,..."> string
 * @param {File} file
 * @returns {Promise<string>}
 */
function readImageAsImgTag(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => {
      const base64 = e.target.result; // "data:image/png;base64,iVBOR..."
      resolve(`<img src="${base64}">`);
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsDataURL(file);
  });
}

/**
 * อ่านไฟล์ TXT → คืนค่า string
 * @param {File} file
 * @returns {Promise<string>}
 */
function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsText(file);
  });
}

/**
 * สุ่มตำแหน่ง N ตำแหน่ง ภายใน 0..max (ไม่ซ้ำกัน)
 * @param {number} count - จำนวนตำแหน่งที่ต้องการ
 * @param {number} max   - ขอบเขตสูงสุด (exclusive)
 * @returns {number[]} เรียงจากมากไปน้อย
 */
function randomUniquePositions(count, max) {
  const set = new Set();
  // ป้องกัน infinite loop ถ้า max น้อยกว่า count
  const limit = Math.min(count, max);
  while (set.size < limit) {
    set.add(Math.floor(Math.random() * max));
  }
  // เรียงจากมากไปน้อย เพื่อให้แทรกจากท้ายมาหน้า (ป้องกัน index เลื่อน)
  return [...set].sort((a, b) => b - a);
}

/**
 * ดาวน์โหลดไฟล์ text
 * @param {string} filename
 * @param {string} content
 * @param {string} mime
 */
function downloadTextFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Validation Logic ─────────────────────────────────────────

/**
 * เรียกทุกครั้งที่เปลี่ยนไฟล์หรือแก้ไข Key
 * ตัดสินใจว่าจะ Enable/Disable ปุ่ม Destroy
 */
async function validateDestroyInputs() {
  const key  = destroyKeyInput.value;
  const file = mainFileInput.files[0];

  destroyInfo.style.display = "none";
  btnDestroy.disabled = true;

  // ── 1. ตรวจ Key ก่อน ──
  if (key.length < 4) {
    showValidation("⚠ Key must contain at least 4 characters.", "error");
    return;
  }

  // ── 2. ต้องมีไฟล์ ──
  if (!file) {
    hideValidation();
    return;
  }

  // ── 3. ถ้าเป็น TXT ให้ข้ามการตรวจ (TXT ใช้สำหรับ Recover เท่านั้น) ──
  const isTxt = file.name.toLowerCase().endsWith(".txt");
  if (isTxt) {
    showValidation("ℹ TXT file selected — use Recover Image button.", "info");
    return;
  }

  // ── 4. ถ้าเป็นรูปภาพ แปลงเป็น img tag แล้วตรวจหา Key ──
  try {
    const imgTag = await readImageAsImgTag(file);
    currentFileContent = imgTag;

    if (imgTag.includes(key)) {
      // Case Sensitive: A ≠ a
      showValidation(
        "❌ Cannot destroy image — Key already exists in image data.",
        "error"
      );
      btnDestroy.disabled = true;
    } else {
      showValidation("✅ Image can be destroyed.", "success");
      btnDestroy.disabled = false;
    }
  } catch (err) {
    showValidation(`❌ File read error: ${err.message}`, "error");
  }
}

// ── Event Listeners ──────────────────────────────────────────

// เมื่อเปลี่ยนไฟล์
mainFileInput.addEventListener("change", () => {
  if (mainFileInput.files[0]) {
    currentFileName = mainFileInput.files[0].name;
    fileDrop.classList.add("has-file");
    dropLabel.textContent = `✓ ${currentFileName}`;
  }
  validateDestroyInputs();
});

// เมื่อแก้ไข Key
destroyKeyInput.addEventListener("input", validateDestroyInputs);

// ── Button: Destroy Image ────────────────────────────────────
btnDestroy.addEventListener("click", async () => {
  const key  = destroyKeyInput.value;
  const file = mainFileInput.files[0];

  if (!file || key.length < 4) return;

  try {
    // 1. ใช้ img tag ที่อ่านไว้แล้ว (หรืออ่านใหม่)
    const imgTag = currentFileContent || await readImageAsImgTag(file);

    // 2. สุ่มจำนวนครั้งที่จะแทรก (1–5)
    const insertionCount = Math.floor(Math.random() * 5) + 1;

    // 3. สุ่มตำแหน่งที่ไม่ซ้ำ เรียงจากมากไปน้อย
    const positions = randomUniquePositions(insertionCount, imgTag.length);

    // 4. แทรก Key ลงในแต่ละตำแหน่ง (จากท้ายมาหน้า ป้องกัน index drift)
    let destroyed = imgTag;
    for (const pos of positions) {
      destroyed = destroyed.slice(0, pos) + key + destroyed.slice(pos);
    }

    // 5. ดาวน์โหลดเป็น destroyed.txt
    downloadTextFile("destroyed.txt", destroyed);

    // 6. แสดงรายละเอียด
    destroyInfo.style.display = "block";
    destroyInfo.innerHTML = `
      <strong>Destroy Complete ✓</strong><br>
      Insertion Count: <strong>${insertionCount}</strong><br>
      Insertion Positions: <strong>${[...positions].sort((a,b)=>a-b).join(", ")}</strong><br>
      Output Length: <strong>${destroyed.length.toLocaleString()} chars</strong>
    `;

  } catch (err) {
    showValidation(`❌ Destroy error: ${err.message}`, "error");
  }
});

// ── Button: Recover Image ────────────────────────────────────
btnRecover.addEventListener("click", async () => {
  const key = destroyKeyInput.value;

  if (key.length < 4) {
    showValidation("⚠ Key must contain at least 4 characters.", "error");
    return;
  }

  // ให้ผู้ใช้เลือกไฟล์ TXT ใหม่ผ่าน programmatic click
  // แต่เราใช้ input เดิม แล้วตรวจ .txt
  const file = mainFileInput.files[0];

  if (!file) {
    showValidation("⚠ Please select a .txt file first.", "error");
    return;
  }

  const isTxt = file.name.toLowerCase().endsWith(".txt");
  if (!isTxt) {
    showValidation("⚠ Recover requires a .txt file (destroyed.txt).", "error");
    return;
  }

  try {
    // 1. อ่านข้อความทั้งหมดจาก TXT
    const rawText = await readTextFile(file);

    // 2. ลบ Key ทุกตำแหน่งที่พบ (Case Sensitive, replaceAll)
    const recovered = rawText.replaceAll(key, "");

    // 3. สร้างไฟล์ recovered.html
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Recovered Image</title>
</head>
<body>
${recovered}
</body>
</html>`;

    downloadTextFile("recovered.html", html, "text/html");

    showValidation("✅ Recovered! File downloaded as recovered.html", "success");

  } catch (err) {
    showValidation(`❌ Recover error: ${err.message}`, "error");
  }
});
