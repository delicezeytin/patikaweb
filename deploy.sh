#!/bin/bash

# Stop on error
set -e

echo "🚀 Starting Deployment Process..."

# 1. Install Dependencies
echo "📦 Installing Dependencies..."
npm install

# 2. Build the Project
echo "🔨 Building Project..."
npm run build

# 3. Package for RunCloud
echo "🎁 Packaging for RunCloud..."

# Create a clean release folder or directly zip dist
# We will zip the CONTENTS of dist into release.zip so when extracted, files are at root
if [ -f release.zip ]; then
    rm release.zip
fi

cd dist
zip -r ../release.zip .
cd ..

echo "✅ Build & Package Complete!"
echo "📂 Upload 'release.zip' to your RunCloud Web App root."
