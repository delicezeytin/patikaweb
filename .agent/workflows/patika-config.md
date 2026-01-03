---
description: Patika Çocuk Yuvası proje yapılandırması ve korunan öğeler
---

# Patika Web Projesi Yapılandırma Rehberi

Bu dosya, projenin kritik yapılandırma bilgilerini içerir. Yapılan değişikliklerin sistemi bozmaması için bu kurallara uyulmalıdır.

## 🛡️ KORUNAN FORMLAR

Aşağıdaki formlar **SİLİNEMEZ** ve **DEĞİŞTİRİLEMEZ**. Self-healing mekanizması ile korunurlar:

1. **İletişim Formu** (`contact`)
   - Slug: `iletisim-formu`
   - Amaç: Web sitesi iletişim sayfası

2. **Personel Başvuru Formu** (`personnel`)
   - Slug: `personel-basvuru-formu`
   - Amaç: İş başvuruları
   - NOT: E-posta alanı ZORUNLU

3. **Okul Kayıt Formu** (`school_register`)
   - Slug: `okul-kayit-formu`
   - Amaç: Yeni öğrenci ön kayıtları

## 📧 E-POSTA SİSTEMİ

**KULLANILAN:** EmailJS (tarayıcı tabanlı)
**KULLANILMAYAN:** SMTP (backend gerektirir)

E-posta gönderimi için Admin > Ayarlar > EmailJS Ayarları doldurulmalıdır.

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
| `Admin.tsx` | Self-healing mekanizması | ⚠️ DİKKATLİ |
| `DynamicFormPage.tsx` | Dinamik form sayfası | ✅ Güvenli |
| `App.tsx` | Route tanımları | ⚠️ DİKKATLİ |

## 🗄️ LOCALSTORAGE ANAHTARLARI

Bu anahtarlar kullanılıyor ve değiştirilmemeli:
- `patika_custom_forms` - Form tanımları
- `patika_home_content` - Anasayfa içerikleri
- `patika_contact_content` - İletişim bilgileri
- `patika_system_settings` - EmailJS ayarları

## ⚠️ YAPILMAMASI GEREKENLER

1. **Zorunlu formları (contact, personnel, school_register) silmek**
2. **Personnel formunun email alanını kaldırmak**
3. **Self-healing useEffect hook'unu kaldırmak veya değiştirmek**
4. **SMTP ayarlarını backend olmadan kullanmaya çalışmak**

---
*Bu dosya projenin tutarlılığını korumak için oluşturulmuştur.*
