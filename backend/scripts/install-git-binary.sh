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

# Check if git binary already exists from previous builds
if [ -f "bin/git" ]; then
    echo "✅ Git binary already exists in bin/"
    ./bin/git --version
    exit 0
fi

# Try to use system git first (from apt-get if available)
if command -v git &> /dev/null; then
    echo "✅ Git is already available in system PATH"
    GIT_VERSION=$(git --version)
    echo "📍 Version: $GIT_VERSION"
    
    # Still configure git
    git config --global --add safe.directory /tmp 2>/dev/null || true
    git config --global --add safe.directory /app 2>/dev/null || true
    echo "✓ Git global config updated"
    exit 0
fi

# If no system git, download pre-built binary
GIT_VERSION="2.43.0"

echo "⬇️  Downloading git v${GIT_VERSION} binary for Linux..."

# Try to download from GitHub releases (source tarball)
GIT_URL="https://github.com/git/git/releases/download/v${GIT_VERSION}/git-${GIT_VERSION}.tar.gz"

if curl -L --fail --silent --show-error "$GIT_URL" -o /tmp/git.tar.gz; then
    echo "📂 Extracting git..."
    tar -xzf /tmp/git.tar.gz -C /tmp
    cd /tmp/git-${GIT_VERSION}
    
    # Build git from source
    if command -v make &> /dev/null; then
        echo "🔨 Building git from source..."
        make configure 2>&1 | head -5
        ./configure --prefix=/app/bin 2>&1 | head -5
        make -j4 2>&1 | tail -3
        make install 2>&1 | tail -3
        
        if [ -f /app/bin/bin/git ]; then
            mv /app/bin/bin/git /app/bin/git
            rm -rf /app/bin/bin
            chmod +x /app/bin/git
            echo "✅ Git compiled and installed to /app/bin/git"
            /app/bin/git --version
            
            # Configure git
            /app/bin/git config --global --add safe.directory /tmp 2>/dev/null || true
            /app/bin/git config --global --add safe.directory /app 2>/dev/null || true
            echo "✓ Git global config updated"
            exit 0
        fi
    fi
fi

echo "⚠️  Could not download or build git binary"
echo "💡 Falling back to system git if available"
exit 0
