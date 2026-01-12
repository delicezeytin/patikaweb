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

## 7. Nginx Configuration

Create a new configuration file:
```bash
sudo nano /etc/nginx/sites-available/patika
```

Paste the following configuration:
```nginx
server {
    listen 80;
    server_name patika.noxdo.com; # Replace with your domain

    root /home/runcloud/webapps/patika-api/dist;
    index index.html;

    # Frontend (React)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/patika /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default if present
sudo nginx -t # Test configuration
sudo systemctl restart nginx
```

## 8. SSL Configuration (Certbot)

Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain SSL certificate:
```bash
sudo certbot --nginx -d patika.noxdo.com
```

Your site is now live! 🚀
