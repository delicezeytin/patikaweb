# Patika Çocuk Yuvası Web Platformu

**Versiyon:** 1.0.0-pre-db (Database Öncesi Sürüm)

Patika Çocuk Yuvası için geliştirilmiş, modern web teknolojileri kullanan kapsamlı bir yönetim ve tanıtım platformu. Bu proje, hem veliler için bilgilendirici bir web sitesi hem de okul yönetimi için detaylı bir admin paneli sunar.

---

## 🚀 Temel Özellikler

### 🌐 Genel Web Sitesi

#### **Responsive Tasarım**
- React 18, TypeScript ve Tailwind CSS ile geliştirilmiş modern arayüz
- Mobil, tablet ve masaüstü uyumlu responsive hero bileşenleri
- Dark mode desteği
- Material Symbols ve Lucide React icon setleri

#### **Sayfa Yapısı**

**1. Anasayfa (`/`)**
- Dinamik hero bölümü (başlık, resim, butonlar)
- "Masallar ve Gerçekler" bölümü (admin panelinden düzenlenebilir)
- Değerler kartları (icon, başlık, açıklama)
- Formlar bölümü (indirilebilir dokümanlar)
- Tüm içerikler admin panelinden yönetilebilir

**2. Patika'ya Dair - Hakkımızda (`/about`)**
- Hero bölümü
- Tanıtım metni
- Admin panelinden tamamen düzenlenebilir içerik

**3. Tanışma Günleri (`/meeting-days`)**
- Dinamik içerik yönetimi
- Tanıtım bölümü (markdown desteği ile **kalın** metin)
- Takvim kutusu (tarih ve saat bilgileri)
- Form bilgilendirme kutusu
- Read-only başvuru formu önizlemesi
- Tüm metinler admin panelinden düzenlenebilir

**4. İletişim (`/contact`)**
- İletişim formu (EmailJS entegrasyonu)
- Google Maps entegrasyonu
- Adres, telefon, e-posta bilgileri
- Hızlı başvuru bağlantıları
- Admin panelinden düzenlenebilir içerik

**5. Randevu Sistemi (`/appointment`)**
- Veli-öğretmen görüşme randevusu talep formu
- EmailJS ile otomatik bildirim

**6. Personel Başvurusu (`/apply-personnel`)**
- Dinamik form yapısı
- Ad, e-posta, telefon, pozisyon, ön yazı alanları
- Admin paneline otomatik aktarım

**7. Öğrenci Başvurusu (`/apply-student`)**
- Öğrenci kayıt formu
- Veli bilgileri toplama
- Admin paneline otomatik aktarım

**8. Yemek Listesi (`/food-list`)**
- Haftalık yemek menüsü görüntüleme
- Admin panelinden güncellenen içerik

**9. Ders Programı (`/schedule`)**
- Sınıf bazlı ders programı
- Admin panelinden yönetilen içerik

**10. Öğretmenler (`/teachers`)**
- Öğretmen kadrosu listeleme
- Fotoğraf, isim, branş bilgileri
- Admin panelinden yönetilen içerik

**11. Dinamik Form Sayfaları (`/form/:slug`)**
- URL bazlı dinamik form yükleme
- Özel slug yapısı ile erişim
- Örnek: `/form/personel-basvuru-formu`

---

### 🛠 Yönetim Paneli (Admin Dashboard)

#### **Güvenlik**
- OTP (One-Time Password) tabanlı giriş sistemi
- E-posta doğrulama (patikayuva@gmail.com)
- 6 haneli doğrulama kodu
- Test modu: Ekranda OTP gösterimi
- 24 saat geçerli oturum
- Güvenli çıkış yapma

#### **1. İçerik Yönetimi (Site İçerikleri)**

**Anasayfa İçerikleri**
- Hero başlık
- Birincil ve ikincil buton metinleri/linkleri
- Masallar bölümü (başlık, metin, vurgu)
- Gerçekler bölümü (başlık, metin, vurgu)
- Formlar bölümü başlığı
- Değerler bölümü başlığı
- Değerler kartları (başlık, açıklama, Material icon)

**Hakkımızda İçerikleri**
- Hero başlık
- Tanıtım başlığı ve metni
- Tüm alanlar anlık güncellenebilir

**Tanışma Günleri İçerikleri**
- Sayfa başlığı (Hero)
- Bölüm başlığı
- Giriş metni (Markdown desteği)
- Takvim kutusu (başlık ve zaman)
- Detay metni
- Form bilgilendirme kutusu (başlık ve metin)

**İletişim İçerikleri**
- Sayfa başlığı ve alt başlığı
- Adres bilgisi
- Telefon numarası ve çalışma saatleri
- E-posta adresi
- Google Maps linki
- Hızlı başvuru bağlantıları başlığı

**Dokümanlar**
- İndirilebilir form linkleri yönetimi
- Form adı, URL, icon, renk ayarları
- Ekleme, düzenleme, silme

#### **2. Form Yönetimi**

**Dinamik Form Oluşturucu**
- Sürükle-bırak ile alan sıralama
- Alan tipleri: text, email, tel, date, textarea, select
- Zorunlu/opsiyonel alan ayarı
- Placeholder metinleri
- Form aktif/pasif durumu
- Slug bazlı URL yönetimi

**Korunan Formlar (Self-Healing)**
- `contact` - İletişim Formu
- `personnel` - Personel Başvuru Formu
- `school_register` - Okul Kayıt Formu
- `meeting_request` - Tanışma Günü Başvuru Formu

**Form Başvuruları**
- Tüm form başvurularını görüntüleme
- Form bazlı filtreleme
- Detaylı başvuru görünümü
- Başvuru silme

#### **3. Öğretmen Yönetimi**

- Öğretmen ekleme, düzenleme, silme
- Fotoğraf URL'i
- Ad, soyad, branş bilgileri
- Biyografi metni
- Liste görünümü

#### **4. Sınıf Yönetimi**

- Sınıf oluşturma, düzenleme, silme
- Sınıf adı ve kapasitesi
- Öğretmen atama
- Öğrenci sayısı takibi
- Kapasite doluluk oranı

#### **5. Yemek Menüsü**

- Haftalık menü planlama
- Gün bazlı yemek ekleme
- Sabah, öğle, ikindi öğünleri
- Menü düzenleme ve silme

#### **6. Ders Programı**

- Sınıf bazlı program oluşturma
- Gün ve saat dilimi yönetimi
- Ders adı ve öğretmen atama
- Program düzenleme

#### **7. Toplantı Yönetimi**

**Toplantı Formları**
- Form oluşturma ve düzenleme
- Tarih, saat, konum bilgileri
- Katılımcı sayısı limiti
- Form aktif/pasif durumu

**Toplantı Talepleri**
- Gelen talepleri görüntüleme
- Onaylama/reddetme
- Detaylı talep bilgileri

**Toplantı Takvimi**
- Aylık takvim görünümü
- Toplantı ekleme, düzenleme, silme
- Tarih ve saat seçimi
- Başlık ve açıklama

#### **8. Başvuru Yönetimi**

- Tüm başvuruları listeleme
- Başvuru detaylarını görüntüleme
- Başvuru silme
- Form tipi bazlı filtreleme

#### **9. Sistem Ayarları**

**E-posta Yapılandırması**
- EmailJS Service ID
- EmailJS Template ID
- EmailJS Public Key
- SMTP ayarları (backend için hazır)

**Google Calendar Entegrasyonu**
- Calendar ID yapılandırması
- Toplantı senkronizasyonu için hazır altyapı

---

## 💾 Veri Yönetimi

### LocalStorage Anahtarları

| Anahtar | Açıklama | Versiyon |
|---------|----------|----------|
| `patika_home_content_v3` | Anasayfa içerikleri | v3 |
| `patika_about_content` | Hakkımızda içerikleri | - |
| `patika_contact_content_v2` | İletişim içerikleri | v2 |
| `patika_meeting_days_content` | Tanışma günleri içerikleri | - |
| `patika_documents` | İndirilebilir dokümanlar | - |
| `patika_custom_forms` | Dinamik formlar ve başvurular | - |
| `patika_teachers` | Öğretmen listesi | - |
| `patika_classes` | Sınıf tanımları | - |
| `patika_food_menu` | Yemek menüsü | - |
| `patika_schedule` | Ders programı | - |
| `patika_meeting_forms` | Toplantı formları | - |
| `patika_meeting_requests` | Toplantı talepleri | - |
| `patika_system_settings` | Sistem ayarları | - |
| `patika_admin_session` | Admin oturum bilgisi | - |

### Self-Healing Mekanizması

Sistem, kritik formların her zaman mevcut olmasını garanti eder. Admin paneli her yüklendiğinde:
1. Korunan formlar kontrol edilir
2. Eksik formlar otomatik oluşturulur
3. Mevcut form yapısı güncellenir

---

## 🏗 Teknoloji Yığını

### Frontend
- **React:** 19.2.3
- **TypeScript:** 5.8.2
- **React Router DOM:** 7.10.1
- **Tailwind CSS:** (Vite plugin ile)

### Build & Dev Tools
- **Vite:** 6.2.0
- **@vitejs/plugin-react:** 5.0.0

### UI & Icons
- **Material Symbols:** Google Material Icons
- **Lucide React:** Modern icon seti

### Utilities
- **date-fns:** Tarih işlemleri
- **@hello-pangea/dnd:** Sürükle-bırak işlevselliği
- **recharts:** 3.6.0 (Grafik ve veri görselleştirme)

### Entegrasyonlar
- **EmailJS:** @emailjs/browser 4.4.1
- **Google Gemini AI:** @google/genai 1.33.0

---

## 💻 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js (v18 veya üzeri önerilir)
- npm veya yarn

### Kurulum

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **Geliştirme modunda çalıştırın:**
   ```bash
   npm run dev
   ```

3. **Tarayıcıda görüntüleyin:**
   ```
   http://localhost:5173
   ```

### Production Build

1. **Build oluşturun:**
   ```bash
   npm run build
   ```

2. **Build'i önizleyin:**
   ```bash
   npm run preview
   ```

3. **Dist klasörü:**
   - Build dosyaları `dist/` klasöründe oluşturulur
   - Bu klasör doğrudan web sunucusuna yüklenebilir

---

## 🔐 Güvenlik Notları

### Admin Paneli Erişimi
- **E-posta:** patikayuva@gmail.com
- **OTP Sistemi:** 6 haneli doğrulama kodu
- **Test Modu:** OTP ekranda gösterilir (production'da EmailJS ile gönderilmeli)
- **Oturum Süresi:** 24 saat

### Önemli Uyarılar
> [!CAUTION]
> - Admin paneli şu anda localStorage tabanlıdır
> - Production ortamında backend ve veritabanı entegrasyonu önerilir
> - EmailJS yapılandırması gereklidir
> - OTP test modunu production'da kapatın

---

## 📋 Özellik Listesi (Özet)

### ✅ Tamamlanan Özellikler

**Web Sitesi**
- [x] Responsive tasarım (mobil, tablet, desktop)
- [x] Dark mode desteği
- [x] Dinamik içerik yönetimi (tüm sayfalar)
- [x] Form sistemi (dinamik ve statik)
- [x] EmailJS entegrasyonu
- [x] Google Maps entegrasyonu
- [x] Markdown desteği (Tanışma Günleri)

**Admin Paneli**
- [x] OTP tabanlı güvenli giriş
- [x] İçerik yönetimi (5 sayfa)
- [x] Dinamik form oluşturucu
- [x] Form başvuru yönetimi
- [x] Öğretmen yönetimi
- [x] Sınıf yönetimi
- [x] Yemek menüsü yönetimi
- [x] Ders programı yönetimi
- [x] Toplantı yönetimi
- [x] Toplantı takvimi
- [x] Sistem ayarları
- [x] Self-healing form sistemi

**Veri Yönetimi**
- [x] LocalStorage persistence
- [x] Versiyonlu içerik anahtarları
- [x] Otomatik form onarımı

### 🔮 Gelecek Özellikler (Database Sonrası)

- [ ] Backend API entegrasyonu
- [ ] Veritabanı (PostgreSQL/MySQL)
- [ ] Kullanıcı rolleri ve yetkilendirme
- [ ] Dosya yükleme sistemi
- [ ] Google Calendar senkronizasyonu
- [ ] E-posta bildirimleri (SMTP)
- [ ] Raporlama ve analitik
- [ ] Öğrenci takip sistemi
- [ ] Veli portalı

---

## 📁 Proje Yapısı

```
patika-çocuk-yuvası/
├── public/
│   ├── logo.png
│   └── docs/
├── src/
│   ├── components/
│   │   ├── DynamicFormRenderer.tsx
│   │   ├── PublicLayout.tsx
│   │   └── ResponsiveHero.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   ├── MeetingDays.tsx
│   │   ├── Contact.tsx
│   │   ├── Admin.tsx
│   │   ├── Appointment.tsx
│   │   ├── PersonnelForm.tsx
│   │   ├── StudentForm.tsx
│   │   ├── FoodList.tsx
│   │   ├── Schedule.tsx
│   │   ├── Teachers.tsx
│   │   └── DynamicFormPage.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 🚀 Deployment

### RunCloud Deployment

Detaylı deployment talimatları için `RUNCLOUD_GUIDE.md` dosyasına bakınız.

**Hızlı Adımlar:**
1. Build oluşturun: `npm run build`
2. `dist/` klasörünü sunucuya yükleyin
3. Nginx yapılandırması (SPA için)
4. SSL sertifikası ekleyin

---

## 📝 Lisans

Bu proje Patika Çocuk Yuvası için özel olarak geliştirilmiştir.

---

## 👨‍💻 Geliştirici Notları

### Önemli Dosyalar
- **Admin.tsx:** Tüm admin panel mantığı (3000+ satır)
- **DynamicFormRenderer.tsx:** Form render motoru
- **ResponsiveHero.tsx:** Responsive hero bileşeni
- **PublicLayout.tsx:** Genel site layout'u

### Kod Standartları
- TypeScript strict mode
- Functional components (React Hooks)
- Tailwind CSS utility-first
- LocalStorage için tip güvenliği

### Versiyon Notları
**1.0.0-pre-db**
- İlk stabil sürüm
- Tüm temel özellikler tamamlandı
- Database entegrasyonu öncesi son sürüm
- Production'a hazır (backend hariç)

---

*Patika Çocuk Yuvası için sevgiyle geliştirildi. 🌟*
