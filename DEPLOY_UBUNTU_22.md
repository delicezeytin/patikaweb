# Patika Web - Ubuntu 22.04 Deployment Guide

This guide describes how to deploy the application on a fresh Ubuntu 22.04 server.

## 1. Verify Environment

RunCloud user does not have `sudo` access, which is expected.
Check if Node.js is already installed (Expected v18+):
```bash
node -v
```
*(If you see v18.x or v20.x, you are good to go!)*

## 2. Install PM2 (Locally)

Since validation failed for global install, we will install PM2 locally in the project:

```bash
# We will do this later inside the server directory
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

First, install PM2 locally (since global install is restricted):
```bash
npm install pm2
```

Start the backend server using `npx`:
```bash
npx pm2 start ecosystem.config.js --env production
npx pm2 save
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
