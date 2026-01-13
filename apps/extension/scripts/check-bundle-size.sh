#!/bin/bash

# Bundle Size Check Script
# Checks if bundle sizes are within acceptable limits

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/../dist/assets"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Size limits (in bytes)
MAX_APP_SIZE=20480        # 20KB gzipped
MAX_VENDOR_SIZE=120000    # 120KB gzipped
MAX_TOTAL_SIZE=500000     # 500KB gzipped

echo -e "${BLUE}📦 Checking bundle sizes...${NC}"
echo ""

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
    echo -e "${RED}❌ Error: dist directory not found${NC}"
    echo "Please run 'pnpm build' first"
    exit 1
fi

cd "$DIST_DIR"

# Function to format bytes to human readable
format_bytes() {
    local bytes=$1
    if [ "$bytes" -lt 1024 ]; then
        echo "${bytes}B"
    elif [ "$bytes" -lt 1048576 ]; then
        echo "$((bytes / 1024))KB"
    else
        echo "$((bytes / 1048576))MB"
    fi
}

# Function to check size
check_size() {
    local name=$1
    local actual=$2
    local limit=$3
    
    local actual_fmt=$(format_bytes $actual)
    local limit_fmt=$(format_bytes $limit)
    
    if [ "$actual" -gt "$limit" ]; then
        local excess=$((actual - limit))
        local excess_fmt=$(format_bytes $excess)
        echo -e "${RED}❌ $name: $actual_fmt (exceeds limit by $excess_fmt)${NC}"
        return 1
    else
        local remaining=$((limit - actual))
        local remaining_fmt=$(format_bytes $remaining)
        echo -e "${GREEN}✅ $name: $actual_fmt (${remaining_fmt} remaining)${NC}"
        return 0
    fi
}

FAILED=0

# Check App bundle
echo -e "${BLUE}Checking App bundle...${NC}"
if ls App-*.js.gz 1> /dev/null 2>&1; then
    APP_SIZE=$(stat -f%z App-*.js.gz 2>/dev/null || stat -c%z App-*.js.gz 2>/dev/null)
    if ! check_size "App bundle" "$APP_SIZE" "$MAX_APP_SIZE"; then
        FAILED=1
    fi
else
    echo -e "${YELLOW}⚠️  App bundle not found${NC}"
fi

echo ""

# Check Vendor bundle
echo -e "${BLUE}Checking Vendor (React) bundle...${NC}"
if ls vendor-react-*.js.gz 1> /dev/null 2>&1; then
    VENDOR_SIZE=$(stat -f%z vendor-react-*.js.gz 2>/dev/null || stat -c%z vendor-react-*.js.gz 2>/dev/null)
    if ! check_size "Vendor bundle" "$VENDOR_SIZE" "$MAX_VENDOR_SIZE"; then
        FAILED=1
    fi
else
    echo -e "${YELLOW}⚠️  Vendor bundle not found${NC}"
fi

echo ""

# Check Total size
echo -e "${BLUE}Checking total bundle size...${NC}"
TOTAL_SIZE=0
for file in *.js.gz; do
    if [ -f "$file" ]; then
        SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%z "$file" 2>/dev/null)
        TOTAL_SIZE=$((TOTAL_SIZE + SIZE))
    fi
done

if ! check_size "Total bundles" "$TOTAL_SIZE" "$MAX_TOTAL_SIZE"; then
    FAILED=1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Show all bundles
echo -e "${BLUE}📊 All bundles (gzipped):${NC}"
echo ""
for file in *.js.gz; do
    if [ -f "$file" ]; then
        SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%z "$file" 2>/dev/null)
        SIZE_FMT=$(format_bytes $SIZE)
        printf "  %-40s %10s\n" "$file" "$SIZE_FMT"
    fi
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All bundle sizes are within limits!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some bundles exceed size limits${NC}"
    echo ""
    echo "Recommendations:"
    echo "  1. Run 'pnpm analyze' to see what's in the bundles"
    echo "  2. Check for large dependencies that can be replaced"
    echo "  3. Ensure code splitting is working correctly"
    echo "  4. Consider lazy loading more features"
    exit 1
fi

