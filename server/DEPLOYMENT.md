# Patika API Sunucu Kurulum Rehberi

Bu rehber, Patika API'sini RunCloud sunucunuza nasıl kuracağınızı adım adım anlatır.

## 1. RunCloud'da Web App Oluşturma

1. RunCloud paneline giriş yapın
2. **Web Applications** → **Create Web Application**
3. Ayarlar:
   - **Name**: `patika-api`
   - **Domain**: API için kullanacağınız subdomain (örn: `api.yourdomain.com`) veya ana domaine `/api` path'i
   - **Stack**: **Custom (Static Files Only)** - çünkü Node.js uygulaması PM2 ile çalışacak
   - **Public Path**: `/dist/public` (veya boş bırakın)
4. **Create** butonuna tıklayın

## 2. Dosyaları Sunucuya Yükleme

### Seçenek A: Git ile (Önerilen)

```bash
# Sunucuya SSH ile bağlanın
ssh runcloud@164.92.179.117

# Web app dizinine gidin
cd /home/runcloud/webapps/patika-api

# Git repo'yu klonlayın
git clone https://github.com/delicezeytin/patikaweb.git .

# Server klasörüne gidin
cd server
```

### Seçenek B: SFTP ile

1. FileZilla veya benzeri SFTP istemcisi kullanın
2. Host: `164.92.179.117`
3. Kullanıcı: RunCloud kullanıcınız
4. `/home/runcloud/webapps/patika-api/` dizinine `server/` klasörünün içeriğini yükleyin

## 3. Ortam Değişkenlerini Ayarlama

Sunucuda `.env` dosyası oluşturun:

```bash
cd /home/runcloud/webapps/patika-api
nano .env
```

İçeriği:
```env
# Database - Password URL encoded
DATABASE_URL="mysql://ptk_dbu_2009:331qvcF%40yDhakI_45MEVy%2B5%40StqPd%40VT@127.0.0.1:3306/patika_test"

# JWT Secret - ÖNEMLİ: Güvenli bir değer ile değiştirin!
JWT_SECRET="BURAYA-GÜVENLI-RASTGELE-BIR-DEĞER-YAZIN"

# Server
PORT=3001
NODE_ENV=production

# Admin Email
ADMIN_EMAIL="patikayuva@gmail.com"
```

## 4. Node.js ve PM2 Kurulumu

RunCloud sunucusunda Node.js zaten kurulu olmalı. PM2 kurulumu için:

```bash
# PM2'yi global olarak kurun
npm install -g pm2

# Startup script oluşturun (sunucu yeniden başladığında otomatik başlasın)
pm2 startup
# Çıkan komutu kopyalayıp çalıştırın
```

## 5. Uygulamayı Deploy Etme

```bash
cd /home/runcloud/webapps/patika-api

# Bağımlılıkları yükle
npm install

# Prisma Client oluştur
npx prisma generate

# Veritabanı tablolarını oluştur
npx prisma db push

# TypeScript'i derle
npm run build

# PM2 ile başlat
pm2 start ecosystem.config.js
pm2 save
```

## 6. Nginx Reverse Proxy Ayarı

RunCloud panelinden veya Nginx config dosyasından `/api` isteklerini Node.js'e yönlendirin:

```nginx
location /api {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

## 7. Test Etme

```bash
# Sunucuda:
curl http://localhost:3001/api/health

# Dışarıdan (Nginx ayarından sonra):
curl https://yourdomain.com/api/health
```

Beklenen yanıt:
```json
{"status":"ok","database":"connected","timestamp":"2026-01-09T..."}
```

## Sorun Giderme

```bash
# PM2 loglarını kontrol et
pm2 logs patika-api

# PM2 durumunu kontrol et
pm2 status

# Prisma hata ayıklama
npx prisma db push --force-reset  # DİKKAT: Tüm verileri siler!
```
