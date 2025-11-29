#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting iOS Release Build Process..."

# 1. Bump Version
echo "📦 Bumping version..."
node scripts/bump-version.js

# 2. Pod Install (to ensure Info.plist and other native changes are synced)
echo "🥥 Running pod install..."
cd ios
pod install
cd ..

# 3. Open Xcode or Archive
echo "✅ Version bump complete. "
echo "📲 Opening Xcode workspace..."
xed ios/MyCrossPlatformApp.xcworkspace

echo "⚠️  Please perform the Archive operation in Xcode:"
echo "   1. Select 'Product' > 'Archive' from the menu."
echo "   2. Ensure 'Any iOS Device' is selected as the destination."
echo "   3. Once archived, use 'Distribute App' to upload to App Store Connect or TestFlight."

