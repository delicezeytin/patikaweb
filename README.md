# Patika Çocuk Yuvası Web Platformu

Patika Çocuk Yuvası için geliştirilmiş, modern web teknolojileri kullanan kapsamlı bir yönetim ve tanıtım platformu. Bu proje, hem veliler için bilgilendirici bir web sitesi hem de okul yönetimi için detaylı bir admin paneli sunar.

## 🚀 Özellikler

### 🌐 Genel Web Sitesi
*   **Modern ve Duyarlı Tasarım:** React, TypeScript ve Tailwind CSS ile geliştirilmiş, tüm cihazlarla uyumlu şık arayüz.
*   **Anasayfa:** Dinamik hero bölümü, özellikler, galeri ve veli yorumları.
*   **Patikaya Dair (Hakkımızda):**
    *   Admin panelinden yönetilebilir içerik.
    *   Misyon, vizyon ve değerlerimiz bölümleri.
*   **Masallar ve Gerçekler:**
    *   Genç zihinler için eğitici masallar.
    *   Genişletilebilir masal kartları.
    *   Admin panelinden yeni masal ekleme/düzenleme özelliği.
*   **İletişim:** İletişim formu, harita ve okul bilgileri.
*   **Randevu Sistemi:** Velilerin okul ile görüşme talep edebileceği randevu formu.

### 🛠 Yönetim Paneli (Admin Dashboard)
Okul yönetiminin tüm süreçleri tek bir yerden kontrol edebileceği kapsamlı panel.

#### 1. İçerik Yönetimi (CMS)
*   **Site İçerikleri:** "Hakkımızda" sayfasındaki metinleri (Başlıklar, Misyon, Vizyon) anlık olarak güncelleme.
*   **Masal Yönetimi:** Yeni masal ekleme, mevcut masalları düzenleme ve silme.

#### 2. Akademik Yönetim
*   **Öğrenci İşleri:** Öğrenci kaydı, düzenleme ve listeleme.
*   **Öğretmen Yönetimi:** Öğretmen kadrosu oluşturma ve yönetme.
*   **Sınıf Yönetimi:** Sınıfları oluşturma, kapasite takibi ve öğretmen atama.

#### 3. Operasyonel Yönetim
*   **Yemek Menüsü:** Haftalık/Aylık yemek menüsü planlama ve yayınlama.
*   **Etkinlik Takvimi:** Okul etkinliklerini takvim üzerinde planlama.
*   **Randevu Talepleri:** Web sitesinden gelen veli görüşme taleplerini görüntüleme ve yönetme.

#### 4. Teknik Özellikler
*   **Veri Kalıcılığı (Persistence):** Tarayıcı `localStorage` kullanılarak verilerin (öğrenciler, öğretmenler, içerikler vb.) saklanması.
*   **Form Yönetimi:** Dinamik form oluşturucu ve başvuru takibi.
41: 
42: #### 5. Personel Başvuru Yönetimi (Yeni)
43: *   **Entegrasyon:** Web sitesindeki "İnsan Kaynakları" başvuru formunun Admin paneli ile tam entegrasyonu.
44: *   **Veri Haritalama:** Ad, E-posta, Telefon, Pozisyon ve Ön Yazı alanlarının eksiksiz ve doğru şekilde panele aktarılması (E-posta/Telefon karışıklığı giderildi).
45: *   **Detaylı Başvuru Görünümü:** Admin panelinde her bir form için özelleştirilmiş, tablo formatında detaylı başvuru listesi.
46: *   **Kendi Kendini Onaran Yapı:** Form yapısındaki güncellemelerin (örn. eksik alanlar) tarayıcı verilerine otomatik yansıtılması.
47: 
48: **🎥 Son Entegrasyon Videosu:**
49: ![Personel Formu Entegrasyonu](public/docs/personel_formu_entegrasyonu.webp)

## 💻 Kurulum ve Çalıştırma

Projede Node.js gereklidir.

1.  Bağımlılıkları yükleyin:
    ```bash
    npm install
    ```

2.  Uygulamayı geliştirme modunda çalıştırın:
    ```bash
    npm run dev
    ```

3.  Tarayıcıda görüntüleyin:
    `http://localhost:3000` (veya terminalde belirtilen port)

## 🏗 Teknoloji Yığını
*   **Frontend Library:** React 18
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Build Tool:** Vite
*   **Icons:** Material Symbols & Lucide React
*   **Date Handling:** date-fns

---
*Patika Çocuk Yuvası için sevgiyle geliştirildi.*
