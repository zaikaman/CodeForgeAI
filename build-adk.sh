#!/bin/bash
# Build ADK before deployment

echo "📦 Checking local ADK package..."

# Check if dist already exists and has files
if [ -d "adk-ts/packages/adk/dist" ] && [ "$(ls -A adk-ts/packages/adk/dist)" ]; then
    echo "✅ ADK dist already exists, skipping build"
    exit 0
fi

echo "📦 Building local ADK package..."

# Check if pnpm exists, if not install it
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm@9.0.0
fi

# Navigate to ADK directory and build
cd adk-ts/packages/adk

echo "Installing ADK dependencies..."
pnpm install --frozen-lockfile || npm install

echo "Building ADK..."
pnpm run build || npm run build

echo "✅ ADK build complete!"

# Go back to root
cd ../../..
