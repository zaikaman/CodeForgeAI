#!/bin/bash
# Install flyctl on Heroku at build time
# This script downloads and installs flyctl to vendor/flyctl directory

set -e

echo "📦 Installing flyctl..."

# Create vendor directory
mkdir -p /app/vendor/flyctl

# Download flyctl
FLYCTL_VERSION="0.3.193"
FLYCTL_URL="https://github.com/superfly/flyctl/releases/download/v${FLYCTL_VERSION}/flyctl_${FLYCTL_VERSION}_Linux_x86_64.tar.gz"

echo "⬇️  Downloading flyctl v${FLYCTL_VERSION}..."
curl -L "$FLYCTL_URL" -o /tmp/flyctl.tar.gz

# Extract to vendor directory
echo "📂 Extracting flyctl..."
tar -xzf /tmp/flyctl.tar.gz -C /app/vendor/flyctl

# Make executable
chmod +x /app/vendor/flyctl/flyctl

# Cleanup
rm /tmp/flyctl.tar.gz

echo "✅ Flyctl installed successfully!"
echo "📍 Location: /app/vendor/flyctl/flyctl"

# Verify installation
if [ -f /app/vendor/flyctl/flyctl ]; then
    /app/vendor/flyctl/flyctl version || echo "⚠️  Could not verify flyctl version"
else
    echo "❌ Flyctl installation failed!"
    exit 1
fi
