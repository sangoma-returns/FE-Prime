#!/usr/bin/env node

/**
 * Bitfrost Project Download Script
 * Run this with: node download-project.js
 * 
 * This script will create a zip file of all essential project files
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const OUTPUT_FILENAME = 'bitfrost-app.zip';

// All essential files and directories to include
const INCLUDE_PATTERNS = [
  // Core files
  'index.html',
  'main.tsx',
  'App.tsx',
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'postcss.config.js',
  
  // Directories (will include all contents)
  'components/**/*',
  'hooks/**/*',
  'stores/**/*',
  'services/**/*',
  'lib/**/*',
  'config/**/*',
  'constants/**/*',
  'types/**/*',
  'utils/**/*',
  'styles/**/*',
  'imports/**/*',
  'public/**/*',
  
  // Exclude patterns
  '!node_modules/**',
  '!dist/**',
  '!.git/**',
  '!*.md',
  '!docs/**',
  '!*.log',
];

// Files to explicitly exclude
const EXCLUDE_FILES = [
  // Documentation files
  'ARCHITECTURE.md',
  'ARCHITECTURE_DETAILED.md',
  'AUTH_QUICK_START.md',
  'Attributions.md',
  'BACKEND_AUTH_ENABLED.md',
  'BACKEND_AUTH_SETUP.md',
  'BACKEND_STATUS.md',
  'BUILD_FIXES.md',
  'BUILD_VERIFICATION.md',
  'CODE_QUALITY_REVIEW.md',
  'DEVELOPER_GUIDE.md',
  'FINAL_FIX_SUMMARY.md',
  'IMPLEMENTATION_COMPLETE.md',
  'IMPORT_FIXES.md',
  'METAMASK_SDK_FIX_FINAL.md',
  'OPTIMIZATION_SUMMARY.md',
  'PACKAGE_JSON_FIX_PLAN.md',
  'PACKAGE_JSON_SUMMARY.md',
  'PRODUCTION_READINESS.md',
  'QUICK_REFERENCE.md',
  'README.md',
  'RENDER_WARNING_FIX.md',
  'SIWE_FIX_NOTES.md',
  'SIWE_IMPLEMENTATION.md',
  'SIWE_SUMMARY.md',
];

console.log('🚀 Creating Bitfrost project zip file...\n');

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(__dirname, OUTPUT_FILENAME));
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

// Listen to archive events
output.on('close', function() {
  console.log('\n✅ Success!');
  console.log(`📦 Created: ${OUTPUT_FILENAME}`);
  console.log(`📊 Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📁 Total files: ${archive.pointer()}`);
  console.log('\n💡 Extract this file and run:');
  console.log('   npm install');
  console.log('   npm run dev');
});

output.on('end', function() {
  console.log('Data has been drained');
});

archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('⚠️  Warning:', err.message);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Helper function to check if file should be excluded
function shouldExclude(filePath) {
  const fileName = path.basename(filePath);
  return EXCLUDE_FILES.includes(fileName) || 
         filePath.includes('node_modules') ||
         filePath.includes('.git') ||
         filePath.includes('dist/') ||
         filePath.endsWith('.log');
}

// Add files and directories
function addDirectory(dirPath, baseDir = '') {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const relativePath = path.join(baseDir, file);
    
    if (shouldExclude(relativePath)) {
      return;
    }
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      addDirectory(fullPath, relativePath);
    } else {
      archive.file(fullPath, { name: relativePath });
      console.log(`  ✓ ${relativePath}`);
    }
  });
}

console.log('📝 Adding files to archive:\n');

// Add all files from current directory
addDirectory(__dirname);

// Finalize the archive
archive.finalize();
