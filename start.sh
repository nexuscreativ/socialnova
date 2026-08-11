#!/bin/bash
echo "========================================"
echo "  SocialNova - Quick Start"
echo "========================================"
echo ""

echo "[1/4] Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    exit 1
fi
echo "  ✓ Node.js found"

if ! command -v python &> /dev/null; then
    echo "ERROR: Python is not installed"
    exit 1
fi
echo "  ✓ Python found"

echo ""
echo "[2/4] Installing dependencies..."
cd apps/web && npm install && cd ../..
cd apps/api && pip install -r requirements.txt && cd ../..

echo ""
echo "[3/4] Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "  Created .env from .env.example"
    echo "  Please edit .env with your API keys"
fi

echo ""
echo "[4/4] Starting services..."
echo ""
echo "Starting API server..."
cd apps/api && python -m uvicorn main:app --reload --port 8000 &
API_PID=$!

echo "Starting Web server..."
cd ../web && npm run dev &
WEB_PID=$!

echo ""
echo "========================================"
echo "  SocialNova is starting!"
echo "========================================"
echo ""
echo "  Web:  http://localhost:3000"
echo "  API:  http://localhost:8000"
echo "  Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"
wait
