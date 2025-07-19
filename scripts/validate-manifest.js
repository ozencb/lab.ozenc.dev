#!/usr/bin/env node

/**
 * Manifest Validation Script
 * 
 * Validates the manifest.json file in the root directory to ensure:
 * - No duplicate slugs across projects
 * - No duplicate directory names across projects  
 * - All referenced directories exist and contain entry points
 * - All required fields are present and valid
 * 
 * Usage: node scripts/validate-manifest.js
 * Exit codes: 0 = success, 1 = validation errors found
 */

import fs from 'fs';
import path from 'path';

// Import validation utilities from shared package
import { validateManifestFile, formatValidationErrors } from '../shared/dist/utils/index.js';

async function main() {
  console.log('🔍 Validating manifest.json...\n');
  
  const manifestPath = path.join(process.cwd(), 'manifest.json');
  
  try {
    // Check if manifest.json exists
    if (!fs.existsSync(manifestPath)) {
      console.error('❌ Error: manifest.json not found in root directory');
      process.exit(1);
    }
    
    // Validate the manifest file using shared utilities
    const result = await validateManifestFile(manifestPath);
    
    if (result && result.isValid) {
      console.log('✅ Manifest validation passed!');
      
      // Re-read manifest to get project count
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      const projectCount = manifest.projects ? manifest.projects.length : 0;
      
      console.log(`📊 Validated ${projectCount} projects successfully\n`);
      
      // Display summary if projects were found
      if (projectCount > 0) {
        console.log('📋 Projects found:');
        // Re-read manifest to display project info
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);
        
        manifest.projects.forEach((project, index) => {
          console.log(`  ${index + 1}. ${project.name} (${project.slug})`);
          console.log(`     Directory: ${project.directory}`);
          console.log(`     Entry Point: ${project.entryPoint}`);
          if (project.description) {
            console.log(`     Description: ${project.description}`);
          }
          console.log('');
        });
      }
      
      process.exit(0);
    } else {
      console.log('❌ Manifest validation failed!\n');
      
      // Format and display validation errors
      if (result && result.errors) {
        const formattedErrors = formatValidationErrors(result);
        console.log(formattedErrors);
      } else {
        console.log('No detailed error information available.');
        console.log('Result structure:', result);
      }
      
      console.log('\n💡 Please fix the above issues and run validation again.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error during validation:');
    console.error(error.message);
    
    if (error.code === 'ENOENT') {
      console.error('\n💡 Make sure manifest.json exists in the root directory');
    } else if (error.name === 'SyntaxError') {
      console.error('\n💡 manifest.json contains invalid JSON syntax');
    } else {
      console.error('\n💡 Please check the manifest file format and try again');
    }
    
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Validation cancelled by user');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught exception:', error.message);
  process.exit(1);
});

// Run the validation
main().catch((error) => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
}); 
