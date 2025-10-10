#!/bin/bash

# CodeForge AI - Quick Deployment Script for Vercel

echo "🚀 CodeForge AI - Vercel Deployment Setup"
echo "=========================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
else
    echo "✅ Vercel CLI is already installed"
fi

echo ""
echo "🔐 Required Environment Variables:"
echo "-----------------------------------"
echo "Backend:"
echo "  - OPENAI_API_KEY"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_KEY"
echo "  - NODE_ENV=production"
echo ""
echo "Frontend:"
echo "  - VITE_SUPABASE_URL"
echo "  - VITE_SUPABASE_ANON_KEY"
echo "  - VITE_API_URL"
echo ""
echo "📋 Next Steps:"
echo "-----------------------------------"
echo "1. Login to Vercel:"
echo "   vercel login"
echo ""
echo "2. Deploy the project:"
echo "   vercel"
echo ""
echo "3. For production deployment:"
echo "   vercel --prod"
echo ""
echo "4. Set environment variables in Vercel Dashboard:"
echo "   https://vercel.com/dashboard"
echo ""
echo "5. Run Supabase migrations"
echo ""
echo "📚 Full documentation: See DEPLOYMENT.md"
echo ""
