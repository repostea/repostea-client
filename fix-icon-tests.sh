#!/bin/bash

# Script to automatically update icon tests from Font Awesome to Iconify format
# This replaces patterns like:
#   expect(wrapper.find('.fa-icon-name').exists()).toBe(true)
# with:
#   const icon = wrapper.find('.iconify-icon')
#   expect(icon.exists()).toBe(true)
#   expect(icon.attributes('name')).toBe('fa6-solid:icon-name')

echo "This script helps identify icon test patterns that need updating"
echo "Searching for icon test patterns in test files..."

# Find all test files with .fa- class selectors
grep -r "\.fa-" test/unit --include="*.js" | grep -v "node_modules" | cut -d: -f1 | sort -u

echo ""
echo "To see the specific patterns, run:"
echo "grep -n '\.fa-' test/unit/components/COMPONENT_NAME.test.js"
