#!/bin/bash
# .profile.d script to add flyctl and git to PATH
# This runs every time a dyno starts

PATH_UPDATED=false

# Add flyctl to PATH if available
if [ -f /app/bin/flyctl ]; then
    export PATH="/app/bin:$PATH"
    echo "✅ Flyctl added to PATH"
    PATH_UPDATED=true
fi

# Add git to PATH if available (installed via apt-get)
if command -v git &> /dev/null; then
    GIT_PATH=$(command -v git)
    GIT_DIR=$(dirname "$GIT_PATH")
    if [[ ":$PATH:" != *":$GIT_DIR:"* ]]; then
        export PATH="$GIT_DIR:$PATH"
        echo "✅ Git added to PATH from $GIT_DIR"
        PATH_UPDATED=true
    else
        echo "✓ Git already in PATH"
    fi
else
    echo "⚠️  Git not found in PATH (will be installed at runtime if needed)"
fi

if [ "$PATH_UPDATED" = true ]; then
    echo "📍 Updated PATH: $PATH"
fi
