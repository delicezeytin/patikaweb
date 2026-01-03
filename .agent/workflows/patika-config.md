---
description: Patika Çocuk Yuvası proje yapılandırması ve korunan öğeler
---

# Patika Web Projesi Yapılandırma Rehberi

Bu dosya, projenin kritik yapılandırma bilgilerini içerir. Yapılan değişikliklerin sistemi bozmaması için bu kurallara uyulmalıdır.

## 🛡️ KORUNAN FORMLAR

Aşağıdaki formlar **SİLİNEMEZ** ve **DEĞİŞTİRİLEMEZ**. Self-healing mekanizması ile korunurlar:

1. **İletişim Formu** (`contact`)
   - Slug: `iletisim-formu`
   - URL: `/#/contact`
   - Amaç: Web sitesi iletişim sayfası

2. **Personel Başvuru Formu** (`personnel`)
   - Slug: `personel-basvuru-formu`
   - URL: `/#/apply-personnel`
   - Amaç: İş başvuruları
   - NOT: E-posta alanı ZORUNLU

3. **Okul Kayıt Formu** (`school_register`)
   - Slug: `okul-kayit-formu`
   - URL: `/#/apply-student`
   - Amaç: Yeni öğrenci ön kayıtları

## 📧 E-POSTA SİSTEMİ

**KULLANILAN:** EmailJS (tarayıcı tabanlı)
**KULLANILMAYAN:** SMTP (backend gerektirir)

E-posta gönderimi için Admin > Ayarlar > EmailJS Ayarları doldurulmalıdır.

## 📋 FORM BAŞVURULARI

### Başvuru Görüntüleme
- Admin Panel > Formlar > [Form] > Başvurular
- **Tablo**: İlk 4 alan gösterilir (okunabilirlik için)
- **Modal**: Satıra tıklanınca TÜM alanlar görünür
- **CSV Export**: Tüm alanlar dahil, Türkçe karakter desteği

### Dinamik Alan Desteği
Formlara eklenen yeni alanlar:
- ✅ Modal'da görüntülenir
- ✅ CSV export'ta yer alır
- ✅ Geriye dönük uyumluluk korunur

### Veri Saklama
Başvurular iki yerde saklanır:
1. `patika_custom_forms` → Form bazlı submissions
2. `patika_applications` → Panel Özeti için global liste

## 🔗 FORM URL YAPISI

Formlar şu formatta erişilebilir:
```
https://site.com/#/form/[slug]
```

Slug oluşturma kuralları:
- Türkçe karakterler dönüştürülür (ç→c, ğ→g, ş→s vb.)
- Boşluklar tire (-) ile değiştirilir
- Özel karakterler kaldırılır

## 📂 ÖNEMLİ DOSYALAR

| Dosya | Açıklama | DEĞİŞTİRME |
|-------|----------|------------|
| `Admin.tsx` | Self-healing, deduplication, form yönetimi | ⚠️ DİKKATLİ |
| `DynamicFormRenderer.tsx` | Form render, dual-key data mapping | ⚠️ DİKKATLİ |
| `StudentForm.tsx` | Okul kayıt formu | ✅ Güvenli |
| `PersonnelForm.tsx` | Personel başvuru formu | ✅ Güvenli |
| `Contact.tsx` | İletişim sayfası ve formu | ✅ Güvenli |
| `App.tsx` | Route tanımları | ⚠️ DİKKATLİ |

## 🗄️ LOCALSTORAGE ANAHTARLARI

Bu anahtarlar kullanılıyor ve değiştirilmemeli:
- `patika_custom_forms` - Form tanımları ve başvuruları
- `patika_applications` - Global başvuru listesi
- `patika_home_content` - Anasayfa içerikleri
- `patika_contact_content` - İletişim bilgileri
- `patika_system_settings` - EmailJS ayarları

## 🔧 SELF-HEALING MEKANİZMASI

`Admin.tsx` içindeki useState başlatıcısında çalışır:

1. **ID Normalizasyonu**: Eski ID'ler yeni standartlara dönüştürülür
   - `student` → `school_register`
   - `personel` → `personnel`
   - `iletisim` → `contact`

2. **ID Deduplication**: Aynı ID'li duplikeler kaldırılır

3. **Başlık Deduplication**: Aynı başlıklı formlar kaldırılır

4. **Zorunlu Form Ekleme**: Eksik zorunlu formlar eklenir

## ⚠️ YAPILMAMASI GEREKENLER

1. **Zorunlu formları (contact, personnel, school_register) silmek**
2. **Personnel formunun email alanını kaldırmak**
3. **Self-healing/deduplication kodunu kaldırmak veya değiştirmek**
4. **DynamicFormRenderer'ın dual-key mapping'ini bozmak**
5. **SMTP ayarlarını backend olmadan kullanmaya çalışmak**

---
*Son güncelleme: 2026-01-03*
*Bu dosya projenin tutarlılığını korumak için oluşturulmuştur.*
