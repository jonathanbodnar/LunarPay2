# Tailwind CSS v4 → v3 Downgrade Fix

## Problem
Tailwind CSS v4 requires native binaries (lightningcss) that aren't compatible with Railway's Linux build environment.

## Solution
Downgraded to stable Tailwind CSS v3.4.15

## Files Changed
- `package.json` - Downgraded tailwindcss and postcss packages
- `tailwind.config.ts` - Updated to v3 format
- `postcss.config.mjs` - Updated to standard v3 config

## Push Command

Run in your terminal:

```bash
cd /Users/jonathanbodnar/lunarpay2
rm package-lock.json
npm install
git add -A
git commit -m "fix: Downgrade to Tailwind CSS v3 for Railway compatibility"
git push origin main
```

Railway will then build successfully! ✅

