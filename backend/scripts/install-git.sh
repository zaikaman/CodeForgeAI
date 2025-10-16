#!/bin/bash
# Git installation orchestrator
# This script runs the binary installation and configuration

set -e

# First try to install git binary (for Heroku slug inclusion)
bash scripts/install-git-binary.sh

# Then configure git if available
if command -v git &> /dev/null; then
    echo "� Configuring git..."
    git config --global --add safe.directory /tmp 2>/dev/null || true
    git config --global --add safe.directory /app 2>/dev/null || true
    echo "✓ Git global config updated"
fi

echo "✓ Git setup complete"
