const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Paths
const projectRoot = path.resolve(__dirname, '..');
const cppDir = path.join(projectRoot, 'cpp');
const sorterSource = path.join(cppDir, 'sorter.cpp');
const sorterExe = path.join(cppDir, 'sorter.exe');

// Check C++ compiler and build sorter.exe if needed
function ensureCppEngine() {
  if (fs.existsSync(sorterExe)) {
    // If sorter.exe exists and is newer than sorter.cpp, ready to go
    try {
      const exeMtime = fs.statSync(sorterExe).mtimeMs;
      const cppMtime = fs.statSync(sorterSource).mtimeMs;
      if (exeMtime >= cppMtime) {
        return { ready: true, path: sorterExe };
      }
    } catch (e) {
      // Continue to rebuild
    }
  }

  // Attempt compilation using g++
  console.log('[Backend] Compiling C++ sorting engine...');
  try {
    const compileCmd = `g++ -std=c++11 -O2 "${sorterSource}" -o "${sorterExe}" -lpsapi`;
    execSync(compileCmd, { cwd: cppDir, stdio: 'inherit' });
    console.log('[Backend] C++ engine compiled successfully.');
    return { ready: true, path: sorterExe };
  } catch (err) {
    console.error('[Backend] Failed to compile C++ engine:', err.message);
    return { ready: false, error: err.message };
  }
}

// Initial engine check
let engineStatus = ensureCppEngine();

// API Health / Status endpoint
app.get('/api/status', (req, res) => {
  let compilerVersion = 'Unknown';
  try {
    compilerVersion = execSync('g++ --version').toString().split('\n')[0].trim();
  } catch (e) {
    compilerVersion = 'g++ not found in PATH';
  }

  const exists = fs.existsSync(sorterExe);
  res.json({
    engineReady: exists,
    sorterExePath: sorterExe,
    compiler: compilerVersion,
    algorithms: ['insertion', 'merge', 'quick', 'heap', 'adaptive']
  });
});

// API Benchmark / Sort Endpoint
// Strictly delegates all sorting work to the native C++ executable!
app.post('/api/sort', (req, res) => {
  const { algorithm, data } = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or empty data array provided.'
    });
  }

  // Ensure sorter.exe is built
  if (!fs.existsSync(sorterExe)) {
    engineStatus = ensureCppEngine();
    if (!engineStatus.ready) {
      return res.status(500).json({
        success: false,
        error: 'C++ sorting engine binary is not compiled and g++ build failed.'
      });
    }
  }

  const requestedAlgo = (algorithm || 'all').toLowerCase();
  const validAlgos = ['insertion', 'merge', 'quick', 'heap', 'adaptive', 'all'];

  if (!validAlgos.includes(requestedAlgo)) {
    return res.status(400).json({
      success: false,
      error: `Unknown algorithm "${algorithm}". Valid options: ${validAlgos.join(', ')}`
    });
  }

  // Spawn C++ binary
  const child = spawn(sorterExe, ['--algo', requestedAlgo], {
    cwd: cppDir
  });

  // Watchdog timer (30s) to terminate hanging or deadlocked child process
  const timeoutId = setTimeout(() => {
    try {
      child.kill();
    } catch (e) {}
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        error: 'C++ sorting engine process timed out (exceeded 30s limit).'
      });
    }
  }, 30000);

  let stdoutData = '';
  let stderrData = '';

  child.stdout.on('data', (chunk) => {
    stdoutData += chunk.toString();
  });

  child.stderr.on('data', (chunk) => {
    stderrData += chunk.toString();
  });

  // Prevent EPIPE uncaught exceptions if child terminates early
  child.stdin.on('error', (err) => {
    console.warn('[Backend] Child stdin error (ignored):', err.message);
  });

  child.on('error', (err) => {
    clearTimeout(timeoutId);
    console.error('[Backend] Failed to start C++ process:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: `Failed to invoke C++ sorting engine: ${err.message}`
      });
    }
  });

  child.on('close', (code) => {
    clearTimeout(timeoutId);
    if (code !== 0) {
      console.error(`[Backend] C++ process exited with code ${code}. Stderr: ${stderrData}`);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: `C++ engine exited with code ${code}. Details: ${stderrData || stdoutData}`
        });
      }
    }

    try {
      const parsed = JSON.parse(stdoutData.trim());
      res.json(parsed);
    } catch (parseErr) {
      console.error('[Backend] Failed to parse C++ JSON output:', parseErr, stdoutData);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to parse JSON response from C++ sorting engine.',
          rawOutput: stdoutData
        });
      }
    }
  });

  // Write integer data to child stdin as comma-separated stream
  // To avoid huge string allocations on huge arrays, write in chunks
  const chunkSize = 5000;
  for (let i = 0; i < data.length; i += chunkSize) {
    const slice = data.slice(i, i + chunkSize);
    const chunkStr = slice.join(',') + (i + chunkSize < data.length ? ',' : '\n');
    child.stdin.write(chunkStr);
  }
  child.stdin.end();
});

// API Visualizer Trace Endpoint
// Generates step-by-step trace events directly from the native C++ engine
app.post('/api/trace', (req, res) => {
  const { algorithm, data } = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or empty data array provided.'
    });
  }

  // Ensure sorter.exe is built
  if (!fs.existsSync(sorterExe)) {
    engineStatus = ensureCppEngine();
    if (!engineStatus.ready) {
      return res.status(500).json({
        success: false,
        error: 'C++ sorting engine binary is not compiled and g++ build failed.'
      });
    }
  }

  const requestedAlgo = (algorithm || 'adaptive').toLowerCase();
  const validAlgos = ['insertion', 'merge', 'quick', 'heap', 'adaptive'];

  if (!validAlgos.includes(requestedAlgo)) {
    return res.status(400).json({
      success: false,
      error: `Unknown algorithm "${algorithm}" for visualization. Valid options: ${validAlgos.join(', ')}`
    });
  }

  // Spawn C++ binary with --trace flag
  const child = spawn(sorterExe, ['--algo', requestedAlgo, '--trace'], {
    cwd: cppDir
  });

  // Watchdog timer (30s) to terminate hanging or deadlocked child process
  const timeoutId = setTimeout(() => {
    try {
      child.kill();
    } catch (e) {}
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        error: 'C++ trace generation process timed out (exceeded 30s limit).'
      });
    }
  }, 30000);

  let stdoutData = '';
  let stderrData = '';

  child.stdout.on('data', (chunk) => {
    stdoutData += chunk.toString();
  });

  child.stderr.on('data', (chunk) => {
    stderrData += chunk.toString();
  });

  // Prevent EPIPE uncaught exceptions if child terminates early
  child.stdin.on('error', (err) => {
    console.warn('[Backend] Child trace stdin error (ignored):', err.message);
  });

  child.on('error', (err) => {
    clearTimeout(timeoutId);
    console.error('[Backend] Failed to start C++ trace process:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: `Failed to invoke C++ sorting engine: ${err.message}`
      });
    }
  });

  child.on('close', (code) => {
    clearTimeout(timeoutId);
    if (code !== 0) {
      console.error(`[Backend] C++ trace process exited with code ${code}. Stderr: ${stderrData}`);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: `C++ engine exited with code ${code}. Details: ${stderrData || stdoutData}`
        });
      }
    }

    try {
      const parsed = JSON.parse(stdoutData.trim());
      res.json(parsed);
    } catch (parseErr) {
      console.error('[Backend] Failed to parse C++ trace JSON output:', parseErr, stdoutData);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to parse JSON response from C++ sorting engine trace.',
          rawOutput: stdoutData
        });
      }
    }
  });

  // Write integer data to child stdin
  const chunkSize = 2000;
  for (let i = 0; i < data.length; i += chunkSize) {
    const slice = data.slice(i, i + chunkSize);
    const chunkStr = slice.join(',') + (i + chunkSize < data.length ? ',' : '\n');
    child.stdin.write(chunkStr);
  }
  child.stdin.end();
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`Adaptive Sorting Benchmarking Backend running on port ${PORT}`);
  console.log(`C++ Engine: ${sorterExe}`);
  console.log(`=======================================================`);
});
