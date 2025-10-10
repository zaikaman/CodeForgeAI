#!/bin/bash
# Install flyctl on Heroku at build time
# This script downloads and installs flyctl to bin directory

set -e

echo "📦 Installing flyctl..."

# Only run on Heroku (check for /app directory)
if [ ! -d "/app" ]; then
    echo "⏭️  Not on Heroku, skipping flyctl installation"
    exit 0
fi

# Create bin directory in build dir (will be included in slug)
mkdir -p bin

# Download flyctl
FLYCTL_VERSION="0.3.193"
FLYCTL_URL="https://github.com/superfly/flyctl/releases/download/v${FLYCTL_VERSION}/flyctl_${FLYCTL_VERSION}_Linux_x86_64.tar.gz"

echo "⬇️  Downloading flyctl v${FLYCTL_VERSION}..."
curl -L "$FLYCTL_URL" -o /tmp/flyctl.tar.gz

# Extract to bin directory
echo "📂 Extracting flyctl..."
tar -xzf /tmp/flyctl.tar.gz -C bin

# Make executable
chmod +x bin/flyctl

# Cleanup
rm /tmp/flyctl.tar.gz

echo "✅ Flyctl installed successfully!"
echo "📍 Location: /app/bin/flyctl"

# Verify installation
if [ -f bin/flyctl ]; then
    ./bin/flyctl version || echo "⚠️  Could not verify flyctl version"
else
    echo "❌ Flyctl installation failed!"
    exit 1
fi
