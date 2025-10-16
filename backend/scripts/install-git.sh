#!/bin/bash
# Install git on Heroku at build time
# This script installs git using apt-get on Heroku

set -e

echo "📦 Installing git..."

# Only run on Heroku (check for /app directory)
if [ ! -d "/app" ]; then
    echo "⏭️  Not on Heroku, skipping git installation"
    exit 0
fi

# Update apt cache and install git
echo "🔄 Updating package manager..."
apt-get update -qq

echo "⬇️  Installing git..."
apt-get install -y -qq git > /dev/null 2>&1

# Verify installation
GIT_VERSION=$(git --version)
echo "✅ Git installed successfully!"
echo "📍 Version: $GIT_VERSION"

# Configure git for safe use in container
git config --global --add safe.directory /tmp || true
git config --global --add safe.directory /app || true

echo "✓ Git ready for use"
