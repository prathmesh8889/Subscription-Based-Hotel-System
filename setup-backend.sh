#!/bin/bash

# ============================================================
# BACKEND SETUP SCRIPT
# ============================================================
# Run this script to setup the backend for production
# ============================================================

echo "🚀 RestroFlow Backend Setup"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Navigate to backend directory
cd backend || exit

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your database credentials!"
    echo "   Required variables:"
    echo "   - DATABASE_URL"
    echo "   - JWT_SECRET"
    echo "   - CORS_ORIGINS"
    echo ""
    read -p "Press Enter after editing .env file..."
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated"
echo ""

# Run database migrations
echo "🗄️  Running database migrations..."
read -p "Do you want to run migrations? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate deploy
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to run migrations"
        exit 1
    fi
    
    echo "✅ Migrations completed"
    echo ""
    
    # Seed database
    read -p "Do you want to seed the database with demo data? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run prisma:seed
        
        if [ $? -ne 0 ]; then
            echo "❌ Failed to seed database"
            exit 1
        fi
        
        echo "✅ Database seeded"
    fi
fi

echo ""

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed"
echo ""

# Start the server
echo "🚀 Starting server..."
echo ""
echo "Backend will run at: http://localhost:5000"
echo "Health check: http://localhost:5000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
