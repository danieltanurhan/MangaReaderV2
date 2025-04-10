/**
 * Script to run both the frontend and backend servers together
 */
const { spawn } = require('child_process');

// Function to start a process with colored output
function startProcess(command, args, color, name) {
  const proc = spawn(command, args, {
    stdio: 'pipe',
    shell: true
  });
  
  const prefix = `\x1b[${color}m[${name}]\x1b[0m `;
  
  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim().length > 0) {
        console.log(`${prefix}${line}`);
      }
    });
  });
  
  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim().length > 0) {
        console.error(`${prefix}\x1b[31m${line}\x1b[0m`);
      }
    });
  });
  
  proc.on('close', (code) => {
    if (code !== 0) {
      console.log(`${prefix}Process exited with code ${code}`);
    }
  });
  
  return proc;
}

// Start the backend server
console.log('\x1b[36m%s\x1b[0m', '🚀 Starting MangaReader servers...');

// Start the backend proxy server
const backendServer = startProcess(
  'node', 
  ['./backend/nginx-proxy.js'],
  '36',  // Cyan color
  'PROXY'
);

// Wait a moment for backend to initialize before starting frontend
setTimeout(() => {
  // Start the Expo development server
  const frontendServer = startProcess(
    'npx',
    ['expo', 'start'],
    '35',  // Magenta color
    'EXPO '
  );
  
  // Handle exit
  process.on('SIGINT', () => {
    console.log('\n\x1b[33m%s\x1b[0m', '👋 Shutting down servers...');
    backendServer.kill();
    frontendServer.kill();
    process.exit(0);
  });
  
}, 2000);