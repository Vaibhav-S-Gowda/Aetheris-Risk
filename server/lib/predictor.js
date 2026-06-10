/**
 * predict.js – Modular ML inference bridge.
 *
 * Spawns a Python child process that loads the serialised Random Forest model
 * and returns a risk probability score for the given input object.
 */
const { spawn } = require('child_process');
const path = require('path');

const PREDICT_SCRIPT = path.join(__dirname, '..', 'predict.py');

let pyProcess = null;
let isReady = false;
let pendingResolves = [];

function startWorker() {
  console.log('Starting persistent Python predictor worker...');
  
  let pythonCmd = 'python3';
  let proc = spawn(pythonCmd, [PREDICT_SCRIPT]);
  let stdoutBuffer = '';

  function setupProcess(p, cmd) {
    p.on('error', (err) => {
      if (err.code === 'ENOENT' && cmd === 'python3') {
        console.warn('python3 not found. Falling back to python...');
        proc = spawn('python', [PREDICT_SCRIPT]);
        setupProcess(proc, 'python');
      } else {
        console.error(`Python spawn error (${cmd}):`, err.message);
        // Fail any pending predictions
        const active = pendingResolves;
        pendingResolves = [];
        active.forEach(({ reject }) => reject(err));
      }
    });

    p.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString();
      let lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop();
      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        if (line === 'READY') {
          isReady = true;
          console.log('Python worker is READY.');
          continue;
        }
        if (pendingResolves.length > 0) {
          const { resolve, reject } = pendingResolves.shift();
          try {
            const resVal = JSON.parse(line);
            if (resVal.error) reject(new Error(resVal.error));
            else resolve(resVal.probability);
          } catch (e) {
            reject(e);
          }
        }
      }
    });

    p.stderr.on('data', (chunk) => {
      console.warn('Python Stderr:', chunk.toString().trim());
    });

    p.on('close', (code) => {
      console.warn(`Python worker exited with code ${code}`);
      isReady = false;
      const active = pendingResolves;
      pendingResolves = [];
      active.forEach(({ reject }) => reject(new Error('Python worker process closed')));
      // Restart after a brief delay
      setTimeout(startWorker, 3000);
    });

    pyProcess = p;
  }

  setupProcess(proc, pythonCmd);
}

// Initialize the worker process
startWorker();

/**
 * @param {Object} inputData  – keyed by feature names expected by the model
 * @returns {Promise<number>} – default probability (class=1, i.e. default)
 */
function predict(inputData) {
  return new Promise((resolve, reject) => {
    if (!pyProcess) {
      return reject(new Error('Python worker process is not running'));
    }
    
    // Push resolver to FIFO queue
    pendingResolves.push({ resolve, reject });
    
    // Write input JSON line to stdin
    pyProcess.stdin.write(JSON.stringify(inputData) + '\n');
  });
}

module.exports = { predict };

