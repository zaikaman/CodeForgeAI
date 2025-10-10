#!/bin/bash
# Setup script to configure Heroku buildpacks for flyctl support
# This script adds the necessary buildpacks to enable flyctl CLI on Heroku dynos

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if app name is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: App name is required${NC}"
    echo "Usage: ./setup-heroku-flyctl.sh <app-name> [fly-api-token]"
    exit 1
fi

APP_NAME=$1
FLY_API_TOKEN=${2:-""}

echo -e "${CYAN}========================================"
echo "Heroku Flyctl Setup Script"
echo -e "========================================${NC}"
echo ""

# Check if Heroku CLI is installed
echo -e "${YELLOW}Checking for Heroku CLI...${NC}"
if command -v heroku &> /dev/null; then
    HEROKU_VERSION=$(heroku --version)
    echo -e "${GREEN}✓ Heroku CLI found: $HEROKU_VERSION${NC}"
else
    echo -e "${RED}✗ Heroku CLI not found. Please install it first: https://devcenter.heroku.com/articles/heroku-cli${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 1: Adding vendor binaries buildpack...${NC}"
if heroku buildpacks:add --index 1 https://github.com/diowa/heroku-buildpack-vendorbinaries.git -a $APP_NAME 2>/dev/null; then
    echo -e "${GREEN}✓ Vendor binaries buildpack added${NC}"
else
    echo -e "${YELLOW}⚠ Buildpack may already exist, continuing...${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Adding Node.js buildpack...${NC}"
if heroku buildpacks:add heroku/nodejs -a $APP_NAME 2>/dev/null; then
    echo -e "${GREEN}✓ Node.js buildpack added${NC}"
else
    echo -e "${YELLOW}⚠ Buildpack may already exist, continuing...${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Verifying buildpacks...${NC}"
heroku buildpacks -a $APP_NAME

echo ""
echo -e "${YELLOW}Step 4: Configuring PATH for flyctl...${NC}"
heroku config:set PATH="/app/vendor/flyctl:\$PATH" -a $APP_NAME
echo -e "${GREEN}✓ PATH configured${NC}"

# Set Fly.io API token if provided
if [ -n "$FLY_API_TOKEN" ]; then
    echo ""
    echo -e "${YELLOW}Step 5: Setting FLY_API_TOKEN...${NC}"
    heroku config:set FLY_API_TOKEN=$FLY_API_TOKEN -a $APP_NAME
    echo -e "${GREEN}✓ FLY_API_TOKEN configured${NC}"
else
    echo ""
    echo -e "${YELLOW}Step 5: Skipping FLY_API_TOKEN (not provided)${NC}"
    echo -e "${CYAN}To set it manually, run:${NC}"
    echo -e "  ${CYAN}heroku config:set FLY_API_TOKEN=your-token -a $APP_NAME${NC}"
    echo -e "${CYAN}Get your token by running: flyctl auth token${NC}"
fi

echo ""
echo -e "${CYAN}========================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Ensure Vendorfile exists in your project root"
echo "2. Commit and push your changes:"
echo -e "   ${CYAN}git add Vendorfile${NC}"
echo -e "   ${CYAN}git commit -m 'Add flyctl via Vendorfile'${NC}"
echo -e "   ${CYAN}git push heroku main${NC}"
echo ""
echo "3. Test flyctl installation after deploy:"
echo -e "   ${CYAN}heroku run flyctl version -a $APP_NAME${NC}"
echo ""
