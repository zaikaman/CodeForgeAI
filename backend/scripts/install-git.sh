#!/bin/bash
# Install git on Heroku at build time
# This script installs git using apt-get on Heroku

echo "📦 Installing git..."

# Only run on Heroku (check for /app directory)
if [ ! -d "/app" ]; then
    echo "⏭️  Not on Heroku, skipping git installation"
    exit 0
fi

# Check if git is already installed
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "✅ Git is already installed!"
    echo "📍 Version: $GIT_VERSION"
    exit 0
fi

# Try to install git with apt
echo "🔄 Installing git via apt..."
if apt-get update -qq 2>/dev/null && apt-get install -y -qq git 2>/dev/null; then
    GIT_VERSION=$(git --version)
    echo "✅ Git installed successfully!"
    echo "📍 Version: $GIT_VERSION"
else
    echo "⚠️  Could not install git via apt, checking if already available..."
    if command -v git &> /dev/null; then
        echo "✅ Git is available on the system"
    else
        echo "⚠️  Git installation encountered issues but continuing..."
    fi
fi

# Configure git for safe use in container
git config --global --add safe.directory /tmp 2>/dev/null || true
git config --global --add safe.directory /app 2>/dev/null || true

echo "✓ Git configuration complete"
