# 🪷 Chant: บทสวดมนต์ (Tamma OS)
> แอปพลิเคชันคลังบทสวดมนต์ พระไตรปิฎก ๔๕ เล่ม พร้อมเสียงสวด คาราโอเกะ ออฟไลน์ 100%

[![App Store](https://img.shields.io/badge/App_Store-Chant:_บทสวดมนต์-black?style=for-the-badge&logo=apple&logoColor=white)](https://apps.apple.com/th/app/chant-%E0%B8%9A%E0%B8%97%E0%B8%AA%E0%B8%A7%E0%B8%94%E0%B8%A1%E0%B8%99%E0%B8%95/id6806598143)
[![Google Play](https://img.shields.io/badge/Google_Play-Chant:_บทสวดมนต์-01875f?style=for-the-badge&logo=google-play&logoColor=white)](https://play.google.com/store/apps/details?id=com.kaisoft.chant)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg?style=for-the-badge)](LICENSE)

แอปพลิเคชัน E-Book รวบรวมบทสวดมนต์และเจริญจิตภาวนา ออกแบบในสไตล์ **Pure HTML5 / CSS3 / Vanilla JavaScript (`tamma.html`)** ตามมาตรฐานระบบนิเวศชุดแอปสัตว์ทั้ง 5 ของ Godkiller Framework พร้อมรองรับการรันบน **Web, iOS และ Android (Capacitor Cross-Platform Parity)**

---

## 📲 ดาวน์โหลดแอปพลิเคชัน (Download App)

| แพลตฟอร์ม | ช่องทางดาวน์โหลด | สถานะ |
| :--- | :--- | :---: |
| 🍏 **iOS / iPadOS** | [ดาวน์โหลดบน App Store (iOS 15.0+)](https://apps.apple.com/th/app/chant-%E0%B8%9A%E0%B8%97%E0%B8%AA%E0%B8%A7%E0%B8%94%E0%B8%A1%E0%B8%99%E0%B8%95/id6806598143) | 🟢 เผยแพร่แล้ว (Live) |
| 🤖 **Android** | [ดาวน์โหลดบน Google Play](https://play.google.com/store/apps/details?id=com.kaisoft.chant) | 🟢 เผยแพร่แล้ว (Live) |
| 🌐 **Web App (PWA)** | เปิดไฟล์ `tamma.html` หรือเปิดผ่านเว็บเบราว์เซอร์ | 🟢 พร้อมใช้งาน |

---

## ✨ ฟีเจอร์เด่น (Key Features)

1. **📖 Comic-Book Style E-Book Reader Engine**:
   - ประสบการณ์การอ่านบทสวดมนต์เหมือนอ่านหนังสือการ์ตูน
   - รองรับการปัดนิ้วซ้าย-ขวา (Touch Swipe Gestures) บนมือถือ, ลากเมาส์ (Mouse Drag) และกดลูกศรคีย์บอร์ดบนคอมพิวเตอร์
   - อัลกอริทึม Auto-Pagination แบ่งวรรคตอนภาษาบาลีและคำแปลไทยให้อัตโนมัติ พอดีกับหน้าจอ
   - ปรับขนาดตัวอักษร (A- / A+) และเลือกโทนสีอ่านได้ 3 ธีม:
     - 🌟 **ธีมทองอร่าม (Golden Temple)**
     - 📜 **ธีมคัมภีร์ใบลาน (Ancient Parchment)**
     - 🌙 **ธีมราตรีสงบ (Midnight Calm ถนอมสายตา)**

2. **🔔 Web Audio Synthesizer (เสียงระฆังทิเบต & กระดิ่งสวดมนต์)**:
   - สังเคราะห์คลื่นเสียงความถี่ศักดิ์สิทธิ์ (432Hz / 528Hz) ด้วย Web Audio API แท้ 100%
   - ใช้งานได้ทั้ง Offline และ Mobile โดยไม่ต้องโหลดไฟล์ MP3 ภายนอก

3. **📊 Daily Dhamma Tracker & Chanting Counter**:
   - บันทึกเช็กลิสต์ประจำวัน (Daily Checklist) รีเซ็ตสถานะวันต่อวันอัตโนมัติ
   - ปุ่มนับรอบจบการสวด (+1 จบ) ทั้งจากหน้าหลักและภายในหน้า E-Book
   - คำนวณวันปฏิบัติธรรมต่อเนื่อง (Streak Days) และสถิติสะสมตลอดชีพ

4. **📥 Community Upload & Smart URL Importer**:
   - ฟอร์มเพิ่มบทสวดมนต์ใหม่สำหรับผู้ใช้งาน
   - ระบบดึงบทสวดจาก URL เว็บภายนอก (Web Scraper) กรองโฆษณาและเมนูออก พร้อมจัดหน้า E-Book ให้อัตโนมัติ
   - ระบบจัดการสถานะ (Workflow) เข้าคิวรอการตรวจสอบ

5. **🛡️ Integrated Admin Moderation Dashboard**:
   - แผงควบคุมสำหรับผู้ดูแลระบบ (Admin) ป้องกันด้วยรหัสผ่าน
   - ตรวจสอบคิวบทสวดที่รอการอนุมัติ (Pending Queue)
   - ฟังก์ชัน **ดูตัวอย่าง E-Book (Preview)** ก่อนตัดสินใจ
   - ปุ่มกด **อนุมัติ (Approve)** เพื่อเผยแพร่สู่คลังสาธารณะ หรือ **ไม่อนุมัติ (Reject)**

6. **📤 Dhamma Art Card & Social Sharing**:
   - สังเคราะห์การ์ดรูปภาพบทสวดมนต์ความละเอียดสูงด้วย **HTML5 Canvas** (ลายน้ำดอกบัวทอง, ข้อความบาลี, คำแปล, สถิติการสวดของตนเอง)
   - บันทึกรูปภาพลงเครื่อง หรือแชร์ข้อความผ่าน **Mobile Web Share API**

---

## 📁 โครงสร้างโปรเจกต์ (Clean Modular Structure)

```text
tamma/
├── tamma.html              # ไฟล์หลัก Single-Page Web App
├── index.html              # Redirect / Web Root
├── capacitor.config.json   # ตั้งค่าสำหรับ iOS & Android
├── package.json            # Scripts สำหรับ Test และ Capacitor
├── src/
│   ├── css/
│   │   ├── tamma-base.css  # โครงสร้างพื้นฐาน, Color Theme, Reset
│   │   ├── reader.css      # Comic-Book Swipe & Reader Styles
│   │   └── admin.css       # Admin Panel & Tracker Styles
│   └── js/
│       ├── app.js          # Controller ประสานงานหลัก
│       ├── reader.js       # ระบบ Swipe & Auto-Pagination
│       ├── storage.js      # จัดการ LocalStorage & Offline-first State
│       ├── tracker.js      # ระบบบันทึกสถิติ & Streak
│       ├── scraper.js      # ตัวสกัดบทสวดจาก URL
│       ├── share.js        # ตัวสร้างการ์ดรูปภาพ Canvas & Share API
│       ├── admin.js        # ระบบแอดมินและการอนุมัติ
│       ├── audio.js        # Web Audio API ระฆังทิเบต
│       └── default-prayers.js # ชุดบทสวดมนต์เริ่มต้นยอดนิยม
└── tests/
    ├── pagination.test.js  # ทดสอบการแบ่งหน้า E-Book
    ├── scraper.test.js     # ทดสอบการสกัดข้อความ
    └── storage.test.js     # ทดสอบ Admin State Machine & Tracker
```

---

## 🚀 วิธีการทดสอบและรันโปรเจกต์

### 1. รันชุดทดสอบอัตโนมัติ (Automated Tests)
```bash
npm test
```

### 2. เปิดใช้งานบนเว็บเบราว์เซอร์
เปิดไฟล์ `tamma.html` บนเบราว์เซอร์ได้ทันทีโดยไม่ต้องผ่าน Build Step ใดๆ

### 3. เชื่อมต่อไปยัง iOS / Android ผ่าน Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
npx cap sync
```

---

## 🔒 ข้อมูลรหัสผ่าน Admin สำหรับทดสอบ
- รหัสผ่านเข้าโหมด Admin เบื้องต้น: `admin123`
