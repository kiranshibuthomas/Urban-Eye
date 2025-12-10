#!/usr/bin/env node
/**
 * Cross-platform development startup script
 * Starts Node.js backend and React frontend
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Colors for console output
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}



function startNodeService() {
  return new Promise((resolve, reject) => {
    log('🚀 Starting Node.js backend...', 'blue');
    
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'server'),
      stdio: 'pipe',
      shell: true
    });
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log(`[SERVER] ${output}`, 'blue');
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error) {
        log(`[SERVER ERROR] ${error}`, 'red');
      }
    });
    
    serverProcess.on('error', (error) => {
      log(`❌ Failed to start server: ${error.message}`, 'red');
      reject(error);
    });
    
    resolve(serverProcess);
  });
}

function startReactApp() {
  return new Promise((resolve, reject) => {
    log('⚛️  Starting React frontend...', 'green');
    
    const clientProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'client'),
      stdio: 'pipe',
      shell: true
    });
    
    clientProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log(`[CLIENT] ${output}`, 'green');
      }
    });
    
    clientProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error) {
        log(`[CLIENT ERROR] ${error}`, 'red');
      }
    });
    
    clientProcess.on('error', (error) => {
      log(`❌ Failed to start client: ${error.message}`, 'red');
      reject(error);
    });
    
    resolve(clientProcess);
  });
}

async function main() {
  log('🏙️  UrbanEye Development Environment', 'bright');
  log('=====================================', 'bright');
  
  const processes = [];
  
  try {
    // Start Node.js backend
    const serverProcess = await startNodeService();
    processes.push(serverProcess);
    
    // Start React frontend
    const clientProcess = await startReactApp();
    processes.push(clientProcess);
    
    log('', 'reset');
    log('🎉 All services started successfully!', 'green');
    log('', 'reset');
    log('📱 Frontend: http://localhost:3000', 'cyan');
    log('🔧 Backend:  http://localhost:5000', 'cyan');
    log('', 'reset');
    log('Press Ctrl+C to stop all services', 'yellow');
    
  } catch (error) {
    log(`❌ Error starting services: ${error.message}`, 'red');
    
    // Clean up any started processes
    processes.forEach(process => {
      if (process && !process.killed) {
        process.kill();
      }
    });
    
    process.exit(1);
  }
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\n🛑 Shutting down all services...', 'yellow');
    
    processes.forEach(process => {
      if (process && !process.killed) {
        process.kill();
      }
    });
    
    log('✅ All services stopped', 'green');
    process.exit(0);
  });
}

main().catch(console.error);










