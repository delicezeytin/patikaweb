#!/bin/bash

# Patika Server Deployment Script
# Run this on your RunCloud server after uploading the server folder

echo "🚀 Starting Patika API deployment..."

# Navigate to server directory
cd /home/runcloud/webapps/patika-api

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run database migrations (creates tables)
echo "🗄️ Running database migrations..."
npx prisma db push

# Build TypeScript
echo "🏗️ Building TypeScript..."
npm run build

# Start/Restart with PM2
echo "🔄 Starting server with PM2..."
pm2 delete patika-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo "✅ Deployment complete!"
echo "📊 Check status: pm2 status"
echo "📋 Check logs: pm2 logs patika-api"
