#!/bin/bash

# Image Optimization Script for Aura Extension
# This script optimizes PNG and SVG images for better performance

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PUBLIC_DIR="$SCRIPT_DIR/../public"

echo "🖼️  Starting image optimization..."

# Check if required tools are installed
check_tool() {
    if ! command -v "$1" &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        echo "   Install with: brew install $2"
        return 1
    fi
    echo "✅ $1 is installed"
    return 0
}

# Check for required tools
echo ""
echo "Checking for required tools..."
TOOLS_OK=true

if ! check_tool "cwebp" "webp"; then
    TOOLS_OK=false
fi

if ! check_tool "svgo" "svgo"; then
    TOOLS_OK=false
fi

if [ "$TOOLS_OK" = false ]; then
    echo ""
    echo "Please install missing tools and try again."
    exit 1
fi

echo ""
echo "All required tools are installed!"
echo ""

# Optimize SVG files
echo "📐 Optimizing SVG files..."
for svg in "$PUBLIC_DIR"/*.svg; do
    if [ -f "$svg" ]; then
        filename=$(basename "$svg")
        echo "  Processing: $filename"
        
        # Create backup
        cp "$svg" "$svg.bak"
        
        # Optimize with svgo
        svgo "$svg" \
            --multipass \
            --pretty \
            --indent=2 \
            --config='{
                "plugins": [
                    "preset-default",
                    "removeDoctype",
                    "removeXMLProcInst",
                    "removeComments",
                    "removeMetadata",
                    "removeEditorsNSData",
                    "cleanupAttrs",
                    "mergeStyles",
                    "inlineStyles",
                    "minifyStyles",
                    "cleanupIds",
                    "removeUselessDefs",
                    "cleanupNumericValues",
                    "convertColors",
                    "removeUnknownsAndDefaults",
                    "removeNonInheritableGroupAttrs",
                    "removeUselessStrokeAndFill",
                    "removeViewBox",
                    "cleanupEnableBackground",
                    "removeHiddenElems",
                    "removeEmptyText",
                    "convertShapeToPath",
                    "convertEllipseToCircle",
                    "moveElemsAttrsToGroup",
                    "moveGroupAttrsToElems",
                    "collapseGroups",
                    "convertPathData",
                    "convertTransform",
                    "removeEmptyAttrs",
                    "removeEmptyContainers",
                    "mergePaths",
                    "removeUnusedNS",
                    "sortDefsChildren",
                    "removeTitle",
                    "removeDesc"
                ]
            }' 2>/dev/null || {
            echo "  ⚠️  SVGO failed, restoring backup"
            mv "$svg.bak" "$svg"
        }
        
        # Compare sizes
        if [ -f "$svg.bak" ]; then
            original_size=$(stat -f%z "$svg.bak")
            new_size=$(stat -f%z "$svg")
            savings=$((original_size - new_size))
            percent=$((savings * 100 / original_size))
            
            echo "    Original: $original_size bytes"
            echo "    Optimized: $new_size bytes"
            echo "    Saved: $savings bytes ($percent%)"
            
            # Remove backup
            rm "$svg.bak"
        fi
    fi
done

echo ""
echo "🎨 Converting PNG to WebP..."

# Convert PNG to WebP
for png in "$PUBLIC_DIR"/*.png; do
    if [ -f "$png" ]; then
        filename=$(basename "$png" .png)
        webp_file="$PUBLIC_DIR/$filename.webp"
        
        echo "  Converting: $filename.png → $filename.webp"
        
        # Convert with high quality
        cwebp -q 90 -m 6 -mt "$png" -o "$webp_file"
        
        # Compare sizes
        png_size=$(stat -f%z "$png")
        webp_size=$(stat -f%z "$webp_file")
        savings=$((png_size - webp_size))
        percent=$((savings * 100 / png_size))
        
        echo "    PNG: $png_size bytes"
        echo "    WebP: $webp_size bytes"
        echo "    Saved: $savings bytes ($percent%)"
    fi
done

echo ""
echo "✨ Image optimization complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Update manifest.config.ts to use .webp files"
echo "  2. Test the extension with optimized images"
echo "  3. Commit the optimized images"

