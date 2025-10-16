#!/bin/bash
# Install git binary on Heroku at build time
# Ensures git is available in /app/bin and persists in dyno slug
# Similar to how flyctl is installed

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
    
    # Still configure git
    git config --global --add safe.directory /tmp 2>/dev/null || true
    git config --global --add safe.directory /app 2>/dev/null || true
    exit 0
fi

# Try to copy system git to /app/bin (most reliable approach)
if command -v git &> /dev/null; then
    GIT_PATH=$(which git)
    echo "✅ Git found in system PATH: $GIT_PATH"
    
    # Copy git binary to bin/
    cp "$GIT_PATH" bin/git
    chmod +x bin/git
    
    # Try to copy required dependencies for git
    echo "📦 Copying git dependencies..."
    
    # Create lib directory
    mkdir -p bin/lib
    
    # Get the library dependencies for git
    if command -v ldd &> /dev/null; then
        # Get all dependencies
        LIBS=$(ldd "$GIT_PATH" | grep "=> /" | awk '{print $3}')
        for lib in $LIBS; do
            if [ -f "$lib" ]; then
                cp "$lib" bin/lib/ 2>/dev/null || true
            fi
        done
    fi
    
    # Also copy critical HTTPS support libraries
    for lib in libcurl.so.4 libssl.so.1.1 libcrypto.so.1.1 libcrypto.so.3 libssl.so.3; do
        if find /usr/lib -name "$lib" 2>/dev/null | head -1 | xargs -I {} cp {} bin/lib/ 2>/dev/null; then
            echo "✓ Copied $lib"
        fi
    done
    
    # Copy additional required libraries for HTTPS
    for lib in libz.so.1 libc.so.6 libdl.so.2; do
        if find /lib -name "$lib" 2>/dev/null | head -1 | xargs -I {} cp {} bin/lib/ 2>/dev/null; then
            echo "✓ Copied $lib"
        fi
    done
    
    # Copy ca-certificates
    if [ -d "/etc/ssl/certs" ]; then
        mkdir -p bin/etc/ssl/certs
        cp -r /etc/ssl/certs/* bin/etc/ssl/certs/ 2>/dev/null || true
        echo "✓ Copied SSL certificates"
    fi
    
    # Fallback: Try to copy ca-bundle.crt
    for cert_path in /etc/ssl/certs/ca-bundle.crt /etc/ssl/cert.pem /usr/local/share/ca-certificates/ca-bundle.crt; do
        if [ -f "$cert_path" ]; then
            cp "$cert_path" bin/etc/ssl/certs/ca-bundle.crt 2>/dev/null || true
            echo "✓ Copied ca-bundle.crt from $cert_path"
            break
        fi
    done
    
    # Copy git-core helpers (including git-remote-https!)
    if [ -d "/usr/libexec/git-core" ]; then
        mkdir -p bin/libexec/git-core
        cp -r /usr/libexec/git-core/* bin/libexec/git-core/ 2>/dev/null || true
        chmod +x bin/libexec/git-core/* 2>/dev/null || true
        echo "✓ Copied git-core helpers"
    elif [ -d "/usr/lib/git-core" ]; then
        mkdir -p bin/lib/git-core
        cp -r /usr/lib/git-core/* bin/lib/git-core/ 2>/dev/null || true
        chmod +x bin/lib/git-core/* 2>/dev/null || true
        echo "✓ Copied git-core helpers from /usr/lib/git-core"
    fi
    
    echo "✅ Git installed to /app/bin/git"
    ./bin/git --version
    
    # Configure git
    ./bin/git config --global --add safe.directory /tmp 2>/dev/null || true
    ./bin/git config --global --add safe.directory /app 2>/dev/null || true
    echo "✓ Git global config updated"
    exit 0
fi

# Fallback: Download and build git from source
GIT_VERSION="2.43.0"
echo "⬇️  System git not found, downloading source..."

GIT_URL="https://github.com/git/git/releases/download/v${GIT_VERSION}/git-${GIT_VERSION}.tar.gz"

if curl -L --fail --silent --show-error "$GIT_URL" -o /tmp/git.tar.gz; then
    echo "📂 Extracting git..."
    tar -xzf /tmp/git.tar.gz -C /tmp
    cd /tmp/git-${GIT_VERSION}
    
    # Build git from source
    if command -v make &> /dev/null; then
        echo "🔨 Building git from source..."
        make configure 2>&1 | head -3
        ./configure --prefix=/app/bin 2>&1 | head -3
        make -j4 2>&1 | tail -2
        make install 2>&1 | tail -2
        
        if [ -f /app/bin/bin/git ]; then
            mv /app/bin/bin/git /app/bin/git
            rm -rf /app/bin/bin
            chmod +x /app/bin/git
            echo "✅ Git compiled to /app/bin/git"
            /app/bin/git --version
            
            # Configure git
            /app/bin/git config --global --add safe.directory /tmp 2>/dev/null || true
            /app/bin/git config --global --add safe.directory /app 2>/dev/null || true
            echo "✓ Git global config updated"
            exit 0
        fi
    fi
fi

echo "⚠️  Could not install git to /app/bin"
echo "ℹ️  System git may still be available but won't persist in slug"
exit 0
