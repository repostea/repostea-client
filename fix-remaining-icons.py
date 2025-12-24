#!/usr/bin/env python3
"""
Script to automatically fix remaining icon tests by replacing Font Awesome patterns with Iconify
"""

import re
import sys

# Map of Font Awesome class names to Iconify names
FA_TO_ICONIFY = {
    # Common icons
    'fa-plus': 'fa6-solid:plus',
    'fa-ellipsis': 'fa6-solid:ellipsis',
    'fa-chevron-down': 'fa6-solid:chevron-down',
    'fa-chevron-right': 'fa6-solid:chevron-right',
    'fa-user-secret': 'fa6-solid:user-secret',
    'fa-user-circle': 'fa6-solid:circle-user',
    'fa-filter': 'fa6-solid:filter',
    'fa-font': 'fa6-solid:font',
    'fa-link': 'fa6-solid:link',
    'fa-video': 'fa6-solid:video',
    'fa-music': 'fa6-solid:music',
    'fa-poll': 'fa6-solid:square-poll-vertical',
    'fa-flag': 'fa6-solid:flag',
    'fa-ellipsis-v': 'fa6-solid:ellipsis-vertical',
    'fa-exclamation-circle': 'fa6-solid:circle-exclamation',
    'fa-language': 'fa6-solid:language',
    'fa-palette': 'fa6-solid:palette',
    'fa-award': 'fa6-solid:award',
    'fa-ban': 'fa6-solid:ban',
}

def fix_simple_icon_test(content):
    """Fix simple icon existence tests like expect(wrapper.find('.fa-icon').exists()).toBe(true)"""
    pattern = r"expect\((\w+)\.find\('\.fa-(\w+(?:-\w+)*)'\)\.exists\(\)\)\.toBe\(true\)"

    def replacer(match):
        wrapper = match.group(1)
        icon_name = match.group(2)
        iconify_name = FA_TO_ICONIFY.get(f'fa-{icon_name}', f'fa6-solid:{icon_name}')
        return f"const icon = {wrapper}.find('.iconify-icon')\n      expect(icon.exists()).toBe(true)\n      expect(icon.attributes('name')).toBe('{iconify_name}')"

    return re.sub(pattern, replacer, content)

def fix_nested_icon_test(content):
    """Fix nested icon tests like expect(wrapper.find('button').find('.fa-icon').exists()).toBe(true)"""
    pattern = r"expect\((\w+)\.find\('([^']+)'\)\.find\('\.fa-(\w+(?:-\w+)*)'\)\.exists\(\)\)\.toBe\(true\)"

    def replacer(match):
        wrapper = match.group(1)
        selector = match.group(2)
        icon_name = match.group(3)
        iconify_name = FA_TO_ICONIFY.get(f'fa-{icon_name}', f'fa6-solid:{icon_name}')
        return f"const icon = {wrapper}.find('{selector}').find('.iconify-icon')\n      expect(icon.exists()).toBe(true)\n      expect(icon.attributes('name')).toBe('{iconify_name}')"

    return re.sub(pattern, replacer, content)

# Read test file paths from command line
if len(sys.argv) < 2:
    print("Usage: python3 fix-remaining-icons.py <test-file>")
    sys.exit(1)

file_path = sys.argv[1]

# Read file
with open(file_path, 'r') as f:
    content = f.read()

# Apply fixes
original = content
content = fix_simple_icon_test(content)
content = fix_nested_icon_test(content)

# Write back if changed
if content != original:
    with open(file_path, 'w') as f:
        f.write(content)
    print(f"Fixed {file_path}")
else:
    print(f"No changes needed for {file_path}")
