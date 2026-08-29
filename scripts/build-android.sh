#!/usr/bin/env bash
set -e

echo "🚀 [CI/CD] Starting Android Build for Chant (com.kaisoft.chant)..."
npm install
npm run build
npx cap sync android

cd android
./gradlew clean bundleRelease
cd ..

echo "✅ [CI/CD] Android AAB Bundle created successfully at android/app/build/outputs/bundle/release/app-release.aab"
