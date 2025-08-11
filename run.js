#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes
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

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader() {
  colorLog('========================================', 'cyan');
  colorLog('  StudySmart Pro - Quick Runner', 'cyan');
  colorLog('========================================', 'cyan');
  console.log();
}

function printUsage() {
  colorLog('Usage:', 'bright');
  colorLog('  node run.js [command]', 'yellow');
  console.log();
  colorLog('Available commands:', 'bright');
  colorLog('  dev          Start both frontend and backend', 'green');
  colorLog('  frontend     Start frontend only (port 8080)', 'green');
  colorLog('  backend      Start backend only (port 3001)', 'green');
  colorLog('  build        Build for production', 'green');
  colorLog('  install      Install dependencies', 'green');
  colorLog('  help         Show this help message', 'green');
  console.log();
  colorLog('Examples:', 'bright');
  colorLog('  node run.js dev', 'yellow');
  colorLog('  node run.js frontend', 'yellow');
  colorLog('  node run.js backend', 'yellow');
}

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkNodeJs() {
  try {
    await runCommand('node', ['--version']);
    colorLog('✓ Node.js is available', 'green');
  } catch (error) {
    colorLog('✗ Node.js is not installed or not in PATH', 'red');
    colorLog('Please install Node.js from https://nodejs.org/', 'yellow');
    process.exit(1);
  }
}

async function checkDependencies() {
  const fs = require('fs');
  if (!fs.existsSync('node_modules')) {
    colorLog('Installing dependencies...', 'yellow');
    try {
      await runCommand('npm', ['install']);
      colorLog('✓ Dependencies installed successfully', 'green');
    } catch (error) {
      colorLog('✗ Failed to install dependencies', 'red');
      process.exit(1);
    }
  }
}

async function main() {
  const command = process.argv[2];

  printHeader();

  if (!command || command === 'help') {
    printUsage();
    return;
  }

  await checkNodeJs();

  switch (command) {
    case 'dev':
      colorLog('Starting both frontend and backend...', 'yellow');
      console.log();
      colorLog('Frontend: http://localhost:8080', 'blue');
      colorLog('Backend: http://localhost:3001', 'blue');
      colorLog('API: http://localhost:3001/api', 'blue');
      console.log();
      await checkDependencies();
      await runCommand('npm', ['run', 'dev']);
      break;

    case 'frontend':
      colorLog('Starting frontend only...', 'yellow');
      console.log();
      colorLog('Frontend: http://localhost:8080', 'blue');
      console.log();
      await checkDependencies();
      await runCommand('npm', ['run', 'dev:client']);
      break;

    case 'backend':
      colorLog('Starting backend only...', 'yellow');
      console.log();
      colorLog('Backend: http://localhost:3001', 'blue');
      colorLog('API: http://localhost:3001/api', 'blue');
      console.log();
      await checkDependencies();
      await runCommand('npm', ['run', 'dev:server']);
      break;

    case 'build':
      colorLog('Building for production...', 'yellow');
      await checkDependencies();
      await runCommand('npm', ['run', 'build']);
      colorLog('✓ Build completed successfully!', 'green');
      break;

    case 'install':
      colorLog('Installing dependencies...', 'yellow');
      await runCommand('npm', ['install']);
      colorLog('✓ Dependencies installed successfully!', 'green');
      break;

    default:
      colorLog(`Unknown command: ${command}`, 'red');
      console.log();
      printUsage();
      process.exit(1);
  }
}

main().catch((error) => {
  colorLog(`Error: ${error.message}`, 'red');
  process.exit(1);
});
