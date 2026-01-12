# Patika Web - Ubuntu 24.04 Deployment Guide (RunCloud)

**Server IP:** 164.92.244.15
**OS:** Ubuntu 24.04 LTS

## 1. RunCloud Panel Setup

1. **Web App Creation:**
   - Go to **Web Apps > Create Web App**.
   - **Name:** `patika-api`
   - **Domain:** `patika.noxdo.com` (or your domain)
   - **User:** `runcloud`
   - **Public Path:** `/home/runcloud/webapps/patika-api/dist`  <-- IMPORTANT
   - **Stack:** Native Nginx + Custom Config

2. **Database Creation:**
   - Go to **Databases > Create Database**.
   - **Database Name:** `patika_db` (or whatever you choose)
   - **Database User:** `patika_test` (As provided)
   - **Password:** `HtIeDsTDITuyeknJ79jQDQeDfUTgTGqi` (As provided)

## 2. Server Terminal Setup (SSH)

Connect to your server via SSH:
```bash
ssh runcloud@164.92.244.15
```

### A. Clone Repository
```bash
cd /home/runcloud/webapps/patika-api
rm -rf *  # Warning: partial clean
git clone https://github.com/delicezeytin/patikaweb .
```

### B. Frontend Setup
```bash
# In the root project directory
npm install
npm run build
```
*(This creates the `dist` folder which Nginx will serve)*

### C. Backend Setup
```bash
cd server
npm install
npm run build
```

### D. Configure Environment (.env)
Create the `.env` file:
```bash
cp .env.example .env
nano .env
```
**Paste the following (Update DATABASE_NAME):**
```env
# Database (Update 'patika_db' with your actual DB name)
DATABASE_URL="mysql://patika_test:HtIeDsTDITuyeknJ79jQDQeDfUTgTGqi@localhost:3306/patika_db"

# Security
JWT_SECRET="guclu-bir-sifre-belirleyin-2025"

# Server
PORT=3001
NODE_ENV=production
ADMIN_EMAIL="patikayuva@gmail.com"

# EmailJS (Add your keys here for contact form)
EMAILJS_SERVICE_ID=""
EMAILJS_TEMPLATE_ID=""
EMAILJS_PUBLIC_KEY=""
```
*Save: CTRL+X, Y, Enter*

### E. Initialize Database
```bash
npx prisma db push
```
*(Should say: "Your database is now in sync with your Prisma schema")*

### F. Start Backend with PM2
First install PM2 locally (since you are restricted user):
```bash
npm install pm2
```

Start the application:
```bash
npx pm2 start ecosystem.config.js --env production
npx pm2 save
```

## 3. RunCloud Nginx Proxy Config

1. Go to **RunCloud Dashboard > Web Apps > patika-api > Nginx Config**.
2. Click **Add Config**.
3. **Type:** `location.root`
4. **Location Name:** `/api`
5. **Content:**
```nginx
proxy_pass http://127.0.0.1:3001;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_cache_bypass $http_upgrade;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```
6. Click **Add Config** and then **Rebuild Web App Config**.

Your site is ready! 🚀
