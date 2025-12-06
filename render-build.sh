#!/usr/bin/env bash
set -e

echo "==> Installing backend dependencies..."
npm --prefix backend ci || npm --prefix backend install

echo "==> Installing frontend dependencies..."
npm --prefix frontend ci || npm --prefix frontend install

echo "==> Building frontend..."
npm --prefix frontend run build

echo "==> Build complete!"
