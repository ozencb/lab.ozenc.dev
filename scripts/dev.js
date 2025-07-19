#!/usr/bin/env node

/**
 * Development Server Script
 * Provides enhanced development workflow with hot reloading, file watching, and automatic restarts
 */

import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const serverDir = path.join(rootDir, 'server');

// Development configuration
const DEV_CONFIG = {
  port: process.env.PORT || 3000,
  nodeEnv: 'development',
  clearScreen: true,
  watchFiles: [
    'server/src/**/*',
    'manifest.json',
    'apps/*/package.json',
    'shared/**/*'
  ],
  ignoreFiles: [
    'node_modules/**/*',
    '**/dist/**/*',
    '**/build/**/*',
    '**/*.test.ts',
    '**/*.spec.ts'
  ]
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader() {
  console.clear();
  colorLog('cyan', '🚀 lab.ozenc.dev Development Server');
  colorLog('blue', '=====================================');
  console.log();
  colorLog('green', '🔧 Development Features:');
  console.log('   • Hot reloading with tsx watch');
  console.log('   • Manifest.json file watching');
  console.log('   • Automatic cache invalidation');
  console.log('   • Enhanced error reporting');
  console.log('   • Development API endpoints');
  console.log();
}

function checkPrerequisites() {
  colorLog('yellow', '🔍 Checking prerequisites...');
  
  // Check if server directory exists
  if (!fs.existsSync(serverDir)) {
    colorLog('red', '❌ Server directory not found!');
    process.exit(1);
  }
  
  // Check if package.json exists
  const serverPackageJson = path.join(serverDir, 'package.json');
  if (!fs.existsSync(serverPackageJson)) {
    colorLog('red', '❌ Server package.json not found!');
    process.exit(1);
  }
  
  // Check if manifest.json exists
  const manifestPath = path.join(rootDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    colorLog('yellow', '⚠️  manifest.json not found - will be watched when created');
  }
  
  colorLog('green', '✅ Prerequisites check passed');
}

function installDependencies() {
  return new Promise((resolve, reject) => {
    colorLog('yellow', '📦 Installing/checking server dependencies...');
    
    const installProcess = spawn('pnpm', ['install'], {
      cwd: serverDir,
      stdio: 'pipe'
    });
    
    installProcess.on('close', (code) => {
      if (code === 0) {
        colorLog('green', '✅ Dependencies ready');
        resolve();
      } else {
        colorLog('red', '❌ Failed to install dependencies');
        reject(new Error('Dependency installation failed'));
      }
    });
    
    installProcess.on('error', (err) => {
      colorLog('red', `❌ Error installing dependencies: ${err.message}`);
      reject(err);
    });
  });
}

function buildSharedPackage() {
  return new Promise((resolve, reject) => {
    colorLog('yellow', '🔨 Building shared package...');
    
    const buildProcess = spawn('pnpm', ['build'], {
      cwd: path.join(rootDir, 'shared'),
      stdio: 'pipe'
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        colorLog('green', '✅ Shared package built');
        resolve();
      } else {
        colorLog('yellow', '⚠️  Shared package build failed - continuing anyway');
        resolve(); // Don't fail the whole process
      }
    });
    
    buildProcess.on('error', (err) => {
      colorLog('yellow', `⚠️  Error building shared package: ${err.message}`);
      resolve(); // Don't fail the whole process
    });
  });
}

function startDevelopmentServer() {
  colorLog('blue', '🚀 Starting development server...');
  console.log();
  
  // Set development environment variables
  const env = {
    ...process.env,
    NODE_ENV: DEV_CONFIG.nodeEnv,
    PORT: DEV_CONFIG.port,
    DEV_MODE: 'true'
  };
  
  // Start server with tsx watch
  const serverProcess = spawn('pnpm', ['dev'], {
    cwd: serverDir,
    stdio: 'inherit',
    env
  });
  
  // Handle server process events
  serverProcess.on('close', (code) => {
    if (code === 0) {
      colorLog('green', '✅ Development server stopped cleanly');
    } else {
      colorLog('red', `❌ Development server exited with code ${code}`);
    }
  });
  
  serverProcess.on('error', (err) => {
    colorLog('red', `❌ Error starting development server: ${err.message}`);
    process.exit(1);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    colorLog('yellow', '\n🔄 Shutting down development server...');
    serverProcess.kill('SIGINT');
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  });
  
  process.on('SIGTERM', () => {
    colorLog('yellow', '\n🔄 Shutting down development server...');
    serverProcess.kill('SIGTERM');
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  });
}

function printUsageInfo() {
  console.log();
  colorLog('cyan', '📖 Development Server Info:');
  console.log(`   • Server: http://localhost:${DEV_CONFIG.port}`);
  console.log(`   • Health: http://localhost:${DEV_CONFIG.port}/api/health`);
  console.log(`   • Projects: http://localhost:${DEV_CONFIG.port}/api/projects`);
  console.log(`   • Dev Status: http://localhost:${DEV_CONFIG.port}/api/dev/reload`);
  console.log();
  colorLog('magenta', '🔥 Hot Reload Features:');
  console.log('   • Server code changes (automatic restart)');
  console.log('   • Manifest.json changes (cache invalidation)');
  console.log('   • TypeScript compilation (on-the-fly)');
  console.log();
  colorLog('yellow', '💡 Usage:');
  console.log('   • Press Ctrl+C to stop the development server');
  console.log('   • Edit files in server/src/ to see hot reloading');
  console.log('   • Modify manifest.json to see cache invalidation');
  console.log();
}

// Main development workflow
async function main() {
  try {
    printHeader();
    checkPrerequisites();
    
    await installDependencies();
    await buildSharedPackage();
    
    printUsageInfo();
    startDevelopmentServer();
    
  } catch (error) {
    colorLog('red', `❌ Development setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Start the development environment
main().catch((error) => {
  colorLog('red', `❌ Fatal error: ${error.message}`);
  process.exit(1);
}); 
