# Patika Web - Ubuntu 22.04 Deployment Guide

This guide describes how to deploy the application on a fresh Ubuntu 22.04 server.

## 1. Initial Server Setup

Update system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

Install Git and Nginx:
```bash
sudo apt install -y git nginx curl
```

## 2. Install Node.js v20 (LTS)

Ubuntu 22.04 supports modern Node versions. We will use NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify version (should be v20.x.x)
node -v
```

Install PM2 globally:
```bash
sudo npm install -g pm2
```

## 3. Clone Repository

1. **Connect via SSH** to your server.
2. Go to your webapp directory (RunCloud created this):
```bash
cd /home/runcloud/webapps/patika-api
```
3. Remove default files (if any):
```bash
rm -rf *
```
4. Clone the project:
```bash
git clone https://github.com/delicezeytin/patikaweb .
```

## 4. Frontend Setup

Install and build the React application:
```bash
# In the root project directory (/home/runcloud/webapps/patika-api)
npm install
npm run build
```
*This creates the `dist` folder.*

## 5. Backend Setup

Navigate to server directory:
```bash
cd server
```

Install and build the Express API:
```bash
npm install
npm run build
```

Configure Environment Variables:
```bash
cp .env.example .env
nano .env
```
*Fill in your DATABASE_URL (MySQL connection string), NODE_ENV=production, JWT_SECRET, and EmailJS keys.*

Initialize Database:
```bash
npx prisma generate
npx prisma db push
```

## 6. Start Application with PM2

Start the backend server:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 7. RunCloud Nginx Configuration

Since you are using RunCloud, you don't need to edit files manually.

1. **Go to RunCloud Dashboard > Web Application > Nginx Config**.
2. Click **Create Config**.
3. Select **TYPE: location.root**.
4. In **Location Name**, enter: `/api`
5. In **Content**, paste this proxy configuration:

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
6. Click **Add Config**.
7. **Rebuild Web App Config** (important!).

**Note on Public Path:**
Ensure your RunCloud "Public Path" is set to:
`/home/runcloud/webapps/patika-api/dist`
(This ensures the built React app is served correctly).

## 8. SSL Configuration

Use the RunCloud **SSL/TLS** menu to generate a generic Let's Encrypt certificate for your domain.

Your site is now live! 🚀
