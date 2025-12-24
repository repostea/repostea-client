#!/usr/bin/env node

/**
 * Translation Audit Script for Nuxt i18n
 *
 * This script:
 * 1. Scans all Vue/TS/JS files for translation keys used in $t() and t() calls
 * 2. Loads all translation JSON files for each locale
 * 3. Compares used keys with available translations
 * 4. Reports missing translations
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname  } from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');
const i18nDir = join(projectRoot, 'i18n', 'locales');
const sourceDir = projectRoot;

// Regex patterns to find translation keys
const translationPatterns = [
  /\$t\(['"`]([^'"`]+)['"`]/g,
  /\bt\(['"`]([^'"`]+)['"`]/g,
  /\$tm\(['"`]([^'"`]+)['"`]/g,
  /\btm\(['"`]([^'"`]+)['"`]/g,
];

// File extensions to scan
const extensions = ['.vue', '.ts', '.js', '.mjs'];

/**
 * Recursively get all files with specific extensions
 */
function getAllFiles(dir, fileList = []) {
  try {
    const files = readdirSync(dir);

    files.forEach(file => {
      const filePath = join(dir, file);

      try {
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
          // Skip node_modules and .nuxt directories
          if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
            getAllFiles(filePath, fileList);
          }
        } else if (extensions.some(ext => file.endsWith(ext))) {
          fileList.push(filePath);
        }
      } catch {
        // Skip files that can't be accessed
      }
    });
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }

  return fileList;
}

/**
 * Extract translation keys from file content
 */
function extractKeysFromFile(filePath) {
  const keys = new Set();

  try {
    const content = readFileSync(filePath, 'utf-8');

    translationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const key = match[1];
        // Skip dynamic keys (variables)
        if (!key.includes('${') && !key.includes('+') && !key.includes('`')) {
          keys.add(key);
        }
      }
    });
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err.message);
  }

  return keys;
}

/**
 * Load all translations for a locale
 */
function loadLocaleTranslations(locale) {
  const translations = {};
  const localeDir = join(i18nDir, locale);

  try {
    const files = readdirSync(localeDir);

    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const filePath = join(localeDir, file);
          const content = JSON.parse(readFileSync(filePath, 'utf-8'));
          Object.assign(translations, content);
        } catch (err) {
          console.error(`Error loading ${locale}/${file}:`, err.message);
        }
      }
    });
  } catch {
    // Locale directory doesn't exist
  }

  return translations;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Main audit function
 */
function auditTranslations() {
  console.log('🔍 Scanning source files for translation keys...\n');

  // Get all source files
  const sourceFiles = getAllFiles(sourceDir);
  console.log(`Found ${sourceFiles.length} source files to scan\n`);

  // Extract all used translation keys
  const usedKeys = new Set();
  sourceFiles.forEach(file => {
    const keys = extractKeysFromFile(file);
    keys.forEach(key => usedKeys.add(key));
  });

  console.log(`Found ${usedKeys.size} unique translation keys in source code\n`);

  // Get available locales
  const locales = readdirSync(i18nDir).filter(item => {
    const itemPath = join(i18nDir, item);
    return statSync(itemPath).isDirectory();
  });

  console.log(`Found ${locales.length} locales: ${locales.join(', ')}\n`);
  console.log('=' .repeat(80));

  // Check each locale
  locales.forEach(locale => {
    console.log(`\n📋 Checking locale: ${locale}`);
    console.log('-'.repeat(80));

    const translations = loadLocaleTranslations(locale);
    const missingKeys = [];

    usedKeys.forEach(key => {
      const value = getNestedValue(translations, key);
      if (value === undefined) {
        missingKeys.push(key);
      }
    });

    if (missingKeys.length === 0) {
      console.log(`✅ All ${usedKeys.size} translation keys are present!`);
    } else {
      console.log(`❌ Missing ${missingKeys.length} translations:\n`);
      missingKeys.sort().forEach(key => {
        console.log(`  - ${key}`);
      });
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n✨ Translation audit complete!\n');
}

// Run the audit
auditTranslations();
