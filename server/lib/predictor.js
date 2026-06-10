/**
 * predict.js – Modular ML inference bridge.
 *
 * Spawns a Python child process that loads the serialised Random Forest model
 * and returns a risk probability score for the given input object.
 */
const { spawn } = require('child_process');
const path = require('path');

const PREDICT_SCRIPT = path.join(__dirname, '..', 'predict.py');

/**
 * @param {Object} inputData  – keyed by feature names expected by the model
 * @returns {Promise<number>} – default probability (class=1, i.e. default)
 */
function predict(inputData) {
  return new Promise((resolve, reject) => {
    const py = spawn('python', [PREDICT_SCRIPT, JSON.stringify(inputData)]);

    let stdout = '';
    let stderr = '';

    py.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    py.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    py.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`predict.py exited ${code}: ${stderr}`));
      }
      try {
        const result = JSON.parse(stdout.trim());
        resolve(result.probability);
      } catch (e) {
        reject(new Error(`Failed to parse predict.py output: ${stdout}`));
      }
    });
  });
}

module.exports = { predict };
