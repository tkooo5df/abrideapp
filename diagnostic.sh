#!/bin/sh
echo "🚀 Starting diagnostic test..."
echo "📅 Timestamp: $(date)"
echo "🔧 Node.js version: $(node --version)"
echo "📦 npm version: $(npm --version)"
echo "📂 Current directory: $(pwd)"
echo "📁 Directory contents:"
ls -la

echo "\n🔍 Checking for server files:"
if [ -f "minimal-server.cjs" ]; then
  echo "✅ minimal-server.cjs found"
  echo "📄 File size: $(wc -c < minimal-server.cjs) bytes"
else
  echo "❌ minimal-server.cjs NOT found"
fi

if [ -f "server.cjs" ]; then
  echo "✅ server.cjs found"
  echo "📄 File size: $(wc -c < server.cjs) bytes"
else
  echo "❌ server.cjs NOT found"
fi

echo "\n🔍 Checking for dist directory:"
if [ -d "dist" ]; then
  echo "✅ dist directory found"
  echo "📁 Dist contents:"
  ls -la dist
  if [ -f "dist/index.html" ]; then
    echo "✅ dist/index.html found"
    echo "📄 File size: $(wc -c < dist/index.html) bytes"
  else
    echo "❌ dist/index.html NOT found"
  fi
else
  echo "❌ dist directory NOT found"
fi

echo "\n🔧 Environment variables:"
env | grep -i port || echo "No PORT variables found"
env | grep -i railway || echo "No RAILWAY variables found"

echo "\n🚀 Attempting to start minimal server..."
timeout 30 node minimal-server.cjs || echo "Server process ended or timed out"