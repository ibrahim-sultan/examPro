#!/bin/bash
set -e

echo "==> Installing backend dependencies..."
cd backend
npm ci || npm install

echo "==> Installing frontend dependencies..."
cd ../frontend
npm ci || npm install

echo "==> Building frontend..."
npm run build

echo "==> Build complete!"
