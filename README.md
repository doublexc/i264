# 🔐 Image Password Login Test

ระบบทดลองด้าน Security — ใช้รูปภาพเป็นรหัสผ่าน (Base64 exact-match)

> ⚠️ **สำหรับการศึกษาเท่านั้น** — ระบบนี้เก็บ Base64 จริงใน Firestore เพื่อศึกษาผลกระทบกรณีข้อมูลรั่ว

---

## 📁 โครงสร้างไฟล์

```
image-password-app/
├── index.html          ← หน้า Login + Bind
├── destroy.html        ← หน้า Destroy & Recover
├── style.css           ← Stylesheet
├── firebase-config.js  ← Firebase config (ต้องแก้ไข!)
├── app.js              ← Logic สำหรับ Login/Bind
├── destroy.js          ← Logic สำหรับ Destroy/Recover
└── README.md
```

---

## ⚙️ ขั้นตอนที่ 1 — ตั้งค่า Firebase

### 1.1 สร้าง Firebase Project

1. ไปที่ [https://console.firebase.google.com](https://console.firebase.google.com)
2. คลิก **Add project**
3. ตั้งชื่อ project เช่น `image-password-lab`
4. ปิด Google Analytics (ไม่จำเป็น) แล้วคลิก **Create project**

### 1.2 เปิดใช้งาน Firestore

1. ใน Firebase Console คลิก **Firestore Database** (เมนูซ้าย)
2. คลิก **Create database**
3. เลือก **Start in test mode** (เพื่อให้ทดสอบได้ง่าย)
4. เลือก Region ใกล้ที่สุด เช่น `asia-southeast1` (Singapore)
5. คลิก **Done**

### 1.3 ดึงค่า Firebase Config

1. ไปที่ **Project Settings** (ไอคอนเฟือง ⚙️)
2. เลื่อนลงมาที่ **Your apps** → คลิก **</>** (Web)
3. ลงทะเบียน App ชื่ออะไรก็ได้
4. จะได้ config object แบบนี้:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 1.4 แก้ไข firebase-config.js

เปิดไฟล์ `firebase-config.js` แล้วแทนที่ค่า placeholder ด้วยค่าจากขั้นตอน 1.3:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← ใส่ของจริง
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

---

## 🔒 ขั้นตอนที่ 2 — ตั้งค่า Firestore Security Rules

1. ใน Firestore Console คลิก **Rules**
2. แก้ไขเป็น (สำหรับทดสอบ):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if true;
    }
  }
}
```

3. คลิก **Publish**

> ⚠️ Rule แบบ `true` เปิดให้ทุกคน read/write — เหมาะสำหรับทดสอบเท่านั้น อย่าใช้ใน production

---

## 🚀 ขั้นตอนที่ 3 — Deploy ขึ้น GitHub Pages

### 3.1 สร้าง GitHub Repository

1. ไปที่ [https://github.com](https://github.com) แล้ว Login
2. คลิก **New repository**
3. ตั้งชื่อ repo เช่น `image-password-lab`
4. เลือก **Public**
5. คลิก **Create repository**

### 3.2 อัพโหลดไฟล์

วิธีง่ายที่สุด (ไม่ต้องใช้ Git CLI):

1. เปิด repo ที่เพิ่งสร้าง
2. คลิก **uploading an existing file**
3. ลากไฟล์ทั้ง 6 ไฟล์ใส่:
   - `index.html`
   - `destroy.html`
   - `style.css`
   - `firebase-config.js`
   - `app.js`
   - `destroy.js`
4. คลิก **Commit changes**

### 3.3 เปิด GitHub Pages

1. ไปที่ **Settings** ของ repo
2. เลื่อนลงมาที่ **Pages** (เมนูซ้าย)
3. ใต้ **Source** เลือก **Deploy from a branch**
4. Branch: **main** / folder: **/ (root)**
5. คลิก **Save**
6. รอ 1-2 นาที แล้วเว็บจะขึ้นที่:
   `https://[username].github.io/[repo-name]/`

---

## ✅ ขั้นตอนที่ 4 — ทดสอบระบบ

### ทดสอบ Bind Image Password

1. เปิดเว็บ
2. กรอก **User ID** เช่น `testuser1`
3. เลือกรูปภาพ (PNG/JPG)
4. คลิก **Bind Image Password**
5. ระบบจะแสดง **Secret7** → จดไว้!
6. เปิด Firestore Console ดูว่ามี document `testuser1` ถูกสร้างขึ้น

### ทดสอบ Login

1. กรอก User ID เดิม
2. เลือกรูปภาพ **ไฟล์เดิมทุกอย่าง** (ต้อง Base64 ตรงกัน 100%)
3. คลิก **Login** → ควรขึ้น ✅ Login Successful
4. ลองเลือกรูปอื่น → ควรขึ้น ❌ Login Failed

### ทดสอบ Destroy & Recover

1. ไปหน้า **Image Destroy Tool**
2. เลือกรูปภาพ
3. กรอก Key เช่น `myKey123`
4. คลิก **Destroy Image** → ดาวน์โหลด `destroyed.txt`
5. เปลี่ยนมาเลือกไฟล์ `destroyed.txt`
6. ใส่ Key เดิม
7. คลิก **Recover Image** → ดาวน์โหลด `recovered.html`
8. เปิด `recovered.html` → ควรเห็นรูปภาพเดิม

---

## 🧠 หลักการทำงาน (Security Notes)

| จุด | ความเสี่ยง |
|-----|-----------|
| เก็บ Base64 จริงใน Firestore | ถ้า DB รั่ว ทุกคนได้รูปต้นฉบับ |
| ไม่มี Hash | ไม่มี bcrypt/SHA → เปราะบางมาก |
| Exact match | ต่าง device/browser อาจให้ Base64 ต่างกันสำหรับรูปเดิม |
| Test mode rules | ทุกคน read/write ได้ |

> นี่คือเหตุผลที่ทำระบบนี้เพื่อศึกษา — เห็นภาพชัดว่า "ถ้า DB รั่ว" เกิดอะไรขึ้น

---

## 🛠 Troubleshooting

**Login ใช้รูปเดิมแต่ Failed?**
→ บางครั้งการ compress ของ browser ทำให้ Base64 ต่างกัน ให้ใช้ไฟล์เดิมทุกประการ (อย่า screenshot หรือ save as ใหม่)

**Firestore Error: Missing or insufficient permissions**
→ ตรวจ Security Rules ว่าตั้งเป็น `allow read, write: if true` แล้ว

**หน้าเว็บโหลดแต่ Firebase ไม่ทำงาน**
→ ตรวจ `firebase-config.js` ว่าใส่ค่าจริงครบหรือยัง
