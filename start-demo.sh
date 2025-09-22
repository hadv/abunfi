#!/bin/bash

# 🚀 Abunfi Demo Startup Script
# Starts the backend and frontend services

echo "🚀 Starting Abunfi Demo..."

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "Port $1 is already in use. Stopping existing process..."
        kill $(lsof -t -i:$1) 2>/dev/null || true
        sleep 2
    fi
}

# Check and clear ports
check_port 3000
check_port 3001

# Start backend
echo "📡 Starting backend API server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 10

# Check if backend is running
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend started successfully"
else
    echo "❌ Backend failed to start. Check if dependencies are installed:"
    echo "   cd backend && npm install"
    exit 1
fi

# Start frontend
echo "🌐 Starting frontend application..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to initialize..."
sleep 15

echo ""
echo "🎉 Abunfi Demo Started!"
echo ""
echo "📱 Frontend Application: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "📊 API Health Check: http://localhost:3001/api/health"
echo ""
echo "🔐 Demo Pages:"
echo "   • Landing Page: http://localhost:3000"
echo "   • Login: http://localhost:3000/login"
echo "   • Dashboard: http://localhost:3000/dashboard"
echo "   • Savings: http://localhost:3000/savings"
echo "   • Social Verification: http://localhost:3000/social-verification"
echo "   • Rate Limits: http://localhost:3000/rate-limits"
echo "   • Strategy Manager: http://localhost:3000/strategy-manager"
echo ""
echo "Press Ctrl+C to stop the demo"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping demo..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "✅ Demo stopped"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Wait for user interrupt
wait
