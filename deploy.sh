#!/bin/bash

# LunarPay 2.0 - Quick Deploy Script

echo "🚀 Deploying LunarPay 2.0..."

cd /Users/jonathanbodnar/lunarpay2

echo "📦 Adding files to git..."
git add -A

echo "💾 Committing changes..."
git commit -m "fix: Update to Node 20 for Railway deployment + complete frontend"

echo "⬆️  Pushing to GitHub..."
git push origin main

echo "✅ Deploy complete!"
echo ""
echo "Next steps:"
echo "1. Railway will auto-deploy from GitHub"
echo "2. Monitor logs at: railway logs"
echo "3. Check build succeeds with Node 20"

