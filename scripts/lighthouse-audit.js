#!/usr/bin/env node
/**
 * Lighthouse audit for the built Toolidi frontend.
 * Starts a static HTTP server for dist/toolidi, runs Lighthouse,
 * prints scores, and exits with a summary.
 *
 * Usage: node scripts/lighthouse-audit.js
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3689;
const DIST_DIR = path.resolve(__dirname, '../dist/toolidi');
const RESULTS_PATH = path.resolve(__dirname, '../lighthouse-results.json');

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(DIST_DIR, req.url === '/' ? '/index.html' : req.url);
      if (filePath.endsWith('/')) filePath += 'index.html';

      const ext = path.extname(filePath).toLowerCase();
      const mime = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.webmanifest': 'application/manifest+json',
      }[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
      const isStatic = /\.(js|css|png|jpg|jpeg|webp|svg|ico|woff|woff2|ttf|webmanifest)$/i.test(filePath);
      if (isStatic) {
        res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000, immutable' });
      } else {
        res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
      }
      res.end(data);
      });
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Static server running at http://127.0.0.1:${PORT}`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

async function waitForServer(url, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
    const res = await new Promise((resolve) => {
      const req = http.get(url, (r) => { resolve(r.statusCode); r.resume(); });
      req.on('error', () => resolve(null));
      req.setTimeout(2000, () => { req.destroy(); resolve(null); });
    });
      if (res === 200) return true;
    } catch (e) { /* ignore */ }
    await new Promise(r => setTimeout(r, 300));
  }
  return false;
}

async function runLighthouse(url) {
  // Patch chrome-launcher to skip EPERM cleanup
  try {
    const launcherPath = require.resolve('chrome-launcher/dist/chrome-launcher.js');
    const launcherCode = fs.readFileSync(launcherPath, 'utf8');
    if (!launcherCode.includes('// patched: skip cleanup')) {
      const patched = launcherCode.replace(
        /await\s+rmSync\(this\.userDataDir[^;]+;/,
        '// patched: skip cleanup to avoid EPERM'
      );
      fs.writeFileSync(launcherPath, patched);
    }
  } catch (e) { console.warn('Could not patch chrome-launcher:', e.message); }

  return new Promise((resolve, reject) => {
    const lh = spawn('node', [
      require.resolve('lighthouse/cli/index.js'),
      url,
      '--output=json',
      '--output-path=' + RESULTS_PATH,
      '--form-factor=mobile',
      '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage --disable-gpu --no-first-run --disable-background-networking --disable-default-apps --disable-extensions --disable-sync',
      '--save-assets',
    ]);

    let stderr = '';
    lh.stderr.on('data', (d) => (stderr += d));
    lh.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Lighthouse exited with code ${code}\n${stderr.slice(-500)}`));
        return;
      }
      try {
        const raw = fs.readFileSync(RESULTS_PATH, 'utf-8');
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
  });
}

function extractScores(report) {
  const categories = report.categories || {};
  const scores = {};
  for (const cat of Object.values(categories)) {
    scores[cat.title] = Math.round(cat.score * 100);
  }

  const audits = report.audits || {};
  const details = {
    pwa: {},
    performance: {},
  };

  const pwaKeys = ['service-worker', 'manifest.json', 'splash-screen', 'themed-omnibox', 'corner-ribbon', 'installable', 'pwa-optimized'];
  for (const k of pwaKeys) {
    const a = audits[k];
    if (a) details.pwa[k] = a.score === 1 ? 'PASS' : 'FAIL';
  }

  const perfKeys = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index', 'interactive', 'time-to-first-byte'];
  for (const k of perfKeys) {
    const a = audits[k];
    if (a && a.numericValue !== undefined) {
      details.performance[k] = a.numericValue;
    }
  }

  return { scores, details };
}

async function main() {
  console.log('Starting Lighthouse audit for Toolidi frontend...');
  console.log(`Built files: ${DIST_DIR}`);

  const server = await startServer();
  const url = `http://127.0.0.1:${PORT}/`;

  try {
    const ready = await waitForServer(url);
    if (!ready) { console.error('Server not responding, aborting.'); process.exit(1); }
    console.log('Running Lighthouse (mobile, headless Chrome)...');
    console.log('This may take 60-120 seconds...\n');
    const report = await runLighthouse(url);
    const { scores, details } = extractScores(report);

    console.log('\n═══════════════════════════════════════════════');
    console.log('  LIGHTHOUSE AUDIT RESULTS (Mobile)');
    console.log('═══════════════════════════════════════════════\n');

    console.log('SCORES:');
    for (const [name, score] of Object.entries(scores)) {
      const status = score >= 90 ? 'PASS' : score >= 50 ? 'AVG' : 'FAIL';
      console.log(`  ${name.padEnd(22)} ${score}/100  [${status}]`);
    }

    console.log('\nPWA CHECKS:');
    for (const [check, status] of Object.entries(details.pwa)) {
      console.log(`  ${check.padEnd(22)} ${status}`);
    }

    console.log('\nPERFORMANCE METRICS:');
    for (const [metric, value] of Object.entries(details.performance)) {
      if (value !== undefined && value !== null) {
        let formatted;
        if (metric === 'cumulative-layout-shift') {
          formatted = value.toFixed(4);
        } else if (value >= 1000) {
          formatted = `${(value / 1000).toFixed(2)}s`;
        } else {
          formatted = `${Math.round(value)}ms`;
        }
        console.log(`  ${metric.padEnd(22)} ${formatted}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════\n');

    const pwaScore = scores['PWA'] || 0;
    const perfScore = scores['Performance'] || 0;
    const gaps = [];
    if (pwaScore < 90) gaps.push(`PWA: ${pwaScore}/100 (target >= 90, gap: ${90 - pwaScore})`);
    if (perfScore < 80) gaps.push(`Performance: ${perfScore}/100 (target >= 80, gap: ${80 - perfScore})`);

    if (gaps.length === 0) {
      console.log('ALL TARGETS MET! PWA >= 90, Performance >= 80');
    } else {
      console.log('TARGETS NOT MET:');
      for (const g of gaps) console.log(`  - ${g}`);
    }

    // Write summary file
    fs.writeFileSync(
      path.resolve(__dirname, '../lighthouse-summary.txt'),
      `Lighthouse Audit - ${new Date().toISOString()}\n` +
      `Static server: http://127.0.0.1:${PORT}\n` +
      `PWA: ${pwaScore}/100 (target >= 90)\n` +
      `Performance: ${perfScore}/100 (target >= 80)\n` +
      `Accessibility: ${scores['Accessibility'] || 0}/100\n` +
      `Best Practices: ${scores['Best Practices'] || 0}/100\n` +
      `SEO: ${scores['SEO'] || 0}/100\n\n` +
      (gaps.length ? 'GAPS:\n' + gaps.join('\n') + '\n' : 'ALL TARGETS MET\n')
    );

    process.exit(gaps.length === 0 ? 0 : 1);
  } catch (err) {
    console.error('Audit failed:', err.message);
    process.exit(1);
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
