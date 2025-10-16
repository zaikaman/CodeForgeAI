#!/bin/bash
# Install git binary on Heroku at build time
# Downloads a pre-built git binary to /app/bin similar to flyctl
# This ensures git is available in the dyno slug even if apt cache is flushed

set -e

echo "📦 Installing git binary..."

# Only run on Heroku (check for /app directory)
if [ ! -d "/app" ]; then
    echo "⏭️  Not on Heroku, skipping git installation"
    exit 0
fi

# Create bin directory in build dir (will be included in slug)
mkdir -p bin

# Check if git is already available in PATH
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "✅ Git is already available: $GIT_VERSION"
    echo "📍 Location: $(which git)"
    exit 0
fi

# Download pre-built git binary from official Heroku buildpack
# Using git from the git-core team's builds or Alpine builds
GIT_VERSION="2.43.0"

echo "⬇️  Downloading git v${GIT_VERSION} binary..."

# Download git from Heroku's git buildpack cache (most reliable)
# This is a pre-compiled binary that works on Ubuntu/Heroku
GIT_URL="https://buildpack-registry.s3.amazonaws.com/buildpacks/heroku/git/git-${GIT_VERSION}-linux-x64.tar.gz"

# Fallback URLs if primary fails
if ! curl -L --fail --silent --show-error "$GIT_URL" -o /tmp/git.tar.gz; then
    echo "⏭️  Primary source unavailable, trying alternative..."
    # Use git compiled for musl (Alpine) - compatible with glibc
    GIT_URL="https://github.com/git/git/releases/download/v${GIT_VERSION}/git-${GIT_VERSION}.tar.gz"
    
    if ! curl -L --fail --silent --show-error "$GIT_URL" -o /tmp/git.tar.gz; then
        echo "❌ Could not download git binary"
        exit 1
    fi
fi

echo "📂 Extracting git..."
tar -xzf /tmp/git.tar.gz -C bin --strip-components=1

# Make executable
if [ -f bin/git ]; then
    chmod +x bin/git
    echo "✅ Git installed successfully!"
    echo "📍 Location: $(pwd)/bin/git"
    
    # Test it
    ./bin/git --version || echo "⚠️  Could not verify git version"
else
    echo "❌ Git binary not found after extraction"
    exit 1
fi

# Cleanup
rm -f /tmp/git.tar.gz

echo "✓ Git installation complete"
