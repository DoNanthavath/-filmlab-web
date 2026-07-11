# FilmLab Web

Progressive Web App สำหรับแต่งภาพบน iPhone ด้วย Safari ภาพทั้งหมดประมวลผลในเบราว์เซอร์และไม่ถูกอัปโหลดขึ้นเซิร์ฟเวอร์

## เปิดทดสอบบน Mac

ในโฟลเดอร์นี้ รัน:

```bash
python3 -m http.server 8080
```

แล้วเปิด `http://localhost:8080` ในเบราว์เซอร์

## ใช้บน iPhone

PWA ต้องอยู่บน HTTPS ก่อนจึงจะติดตั้งและใช้งาน Offline ได้ ให้อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ไปยัง GitHub Pages, Netlify, Cloudflare Pages หรือเว็บโฮสติ้ง HTTPS จากนั้นเปิด URL ด้วย Safari แล้วเลือก Share → Add to Home Screen

การบันทึกภาพ: แตะ “บันทึกภาพ” แล้วเลือก Save Image ใน Share Sheet หาก Share Sheet ใช้ไม่ได้ ระบบจะดาวน์โหลดไฟล์ JPEG ให้แทน

พรีเซ็ตเป็นโทนที่ออกแบบให้ได้อารมณ์ film-inspired ไม่ใช่สูตรหรือโปรไฟล์อย่างเป็นทางการของผู้ผลิตกล้อง
