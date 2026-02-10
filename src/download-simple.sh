#!/bin/bash

# Bitfrost Project Download Script (Simple)
# Run this with: bash download-simple.sh

OUTPUT_FILE="bitfrost-app.zip"

echo "🚀 Creating Bitfrost project zip file..."
echo ""

# Create zip file excluding unnecessary files
zip -r "$OUTPUT_FILE" . \
  -x "node_modules/*" \
  -x "dist/*" \
  -x ".git/*" \
  -x "*.log" \
  -x "*.md" \
  -x "docs/*" \
  -x ".DS_Store" \
  -x "download-*.sh" \
  -x "download-*.js"

echo ""
echo "✅ Success!"
echo "📦 Created: $OUTPUT_FILE"
echo ""
echo "💡 Extract this file and run:"
echo "   npm install"
echo "   npm run dev"
