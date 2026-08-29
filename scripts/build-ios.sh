#!/usr/bin/env bash
set -e

echo "🚀 [CI/CD] Starting iOS Build for Chant (com.kaisoft.chant)..."
npm install
npm run build
npx cap sync ios

echo "📦 [CI/CD] Archiving Xcode project..."
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/Chant.xcarchive \
  clean archive

echo "✅ [CI/CD] iOS Archive created successfully at build/Chant.xcarchive"
