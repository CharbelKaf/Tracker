import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const HOST = '127.0.0.1';
const PORT = 4173;
const BASE_URL = `http://${HOST}:${PORT}`;
const RUN_DATE = new Date().toISOString().slice(0, 10);
const UPDATE_BASELINE = process.argv.includes('--update');

const DEVICES = [
  { id: 'compact', label: 'Compact (iPhone 14 Pro)', width: 393, height: 852, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  { id: 'medium', label: 'Medium (iPad Mini)', width: 768, height: 1024, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { id: 'expanded', label: 'Expanded (Desktop 1440p)', width: 1440, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
];

const LOGIN_CHECKPOINT = { id: 'login', label: 'Login', hash: '/' };

const AUTH_CHECKPOINTS = [
  { id: 'settings', label: 'Settings', hash: '/settings' },
  { id: 'assignment_wizard', label: 'Assignment wizard', hash: '/wizards/assignment' },
  { id: 'return_wizard', label: 'Return wizard', hash: '/wizards/return' },
  { id: 'add_equipment', label: 'Add equipment', hash: '/inventory/add' },
  { id: 'user_details', label: 'User details', hash: '/users/1' },
  { id: 'audit_details', label: 'Audit details', hash: '/audit/details' },
  { id: 'finance', label: 'Finance', hash: '/finance' },
];

const TEMP_DIR = path.resolve(`docs/.tmp/md3-visual-regression/${RUN_DATE}`);
const BASELINE_DIR = path.resolve('docs/md3-visual-baseline');
const CURRENT_DIR = path.resolve(`docs/md3-visual-current/${RUN_DATE}`);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async (url, timeoutMs = 120000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Retry.
    }
    await wait(1000);
  }
  throw new Error(`Timed out waiting for server at ${url}`);
};

const sha256 = async (filePath) => {
  const bytes = await readFile(filePath);
  return createHash('sha256').update(bytes).digest('hex');
};

const startDevServer = () => {
  const viteBin = path.resolve('node_modules/vite/bin/vite.js');
  const child = spawn(process.execPath, [viteBin, '--host', HOST, '--port', String(PORT)], {
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  child.stdout.on('data', (chunk) => {
    const line = String(chunk).trim();
    if (line) process.stdout.write(`[vite] ${line}\n`);
  });
  child.stderr.on('data', (chunk) => {
    const line = String(chunk).trim();
    if (line) process.stderr.write(`[vite] ${line}\n`);
  });

  return child;
};

const bootstrapDeterministicSession = async (page) => {
  await page.goto(`${BASE_URL}/#/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      'neemba_settings',
      JSON.stringify({
        theme: 'light',
        accentColor: 'yellow',
      })
    );
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
};

const loginWithDemoAccount = async (page) => {
  const emailInput = page.getByPlaceholder('Ex: nom@neemba.com');
  if (await emailInput.count()) {
    await emailInput.fill('alice.admin@neemba.com');
    await page.getByPlaceholder('Votre mot de passe').fill('demo-password');
    await page.getByRole('button', { name: /Se connecter/i }).click();
    await page.waitForTimeout(1300);
  }
};

const waitForStablePaint = async (page) => {
  await page
    .waitForFunction(
      () =>
        !document.querySelector('[data-testid="route-loading-fallback"]')
        && !document.querySelector('[data-testid="app-shell-loading"]'),
      { timeout: 8000 }
    )
    .catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  });
  await page.waitForTimeout(250);
};

const snapshotCheckpoint = async (page, device, checkpoint) => {
  const routeUrl = `${BASE_URL}/#${checkpoint.hash}`;
  await page.goto(routeUrl, { waitUntil: 'networkidle' });
  await waitForStablePaint(page);

  const tempPath = path.join(TEMP_DIR, device.id, `${checkpoint.id}.png`);
  const baselinePath = path.join(BASELINE_DIR, device.id, `${checkpoint.id}.png`);
  await mkdir(path.dirname(tempPath), { recursive: true });
  await page.screenshot({
    path: tempPath,
    fullPage: false,
    animations: 'disabled',
    mask: [page.locator('img')],
    maskColor: '#888888',
  });

  if (!existsSync(baselinePath)) {
    await mkdir(path.dirname(baselinePath), { recursive: true });
    await copyFile(tempPath, baselinePath);

    const currentPath = path.join(CURRENT_DIR, device.id, `${checkpoint.id}.png`);
    await mkdir(path.dirname(currentPath), { recursive: true });
    await copyFile(tempPath, currentPath);

    return {
      status: 'baseline-created',
      pass: true,
      baselinePath,
      currentPath,
      hash: await sha256(tempPath),
    };
  }

  const [baselineHash, currentHash] = await Promise.all([sha256(baselinePath), sha256(tempPath)]);

  if (baselineHash === currentHash) {
    return {
      status: 'match',
      pass: true,
      baselinePath,
      currentPath: null,
      hash: currentHash,
    };
  }

  if (UPDATE_BASELINE) {
    await copyFile(tempPath, baselinePath);
    const currentPath = path.join(CURRENT_DIR, device.id, `${checkpoint.id}.png`);
    await mkdir(path.dirname(currentPath), { recursive: true });
    await copyFile(tempPath, currentPath);
    return {
      status: 'updated',
      pass: true,
      baselinePath,
      currentPath,
      hash: currentHash,
    };
  }

  const currentPath = path.join(CURRENT_DIR, device.id, `${checkpoint.id}.png`);
  await mkdir(path.dirname(currentPath), { recursive: true });
  await copyFile(tempPath, currentPath);
  return {
    status: 'changed',
    pass: false,
    baselinePath,
    currentPath,
    hash: currentHash,
  };
};

const run = async () => {
  let server = null;

  const stopServer = () => {
    if (server && !server.killed) {
      server.kill();
    }
  };

  try {
    await rm(TEMP_DIR, { recursive: true, force: true });
    await mkdir(TEMP_DIR, { recursive: true });
    server = startDevServer();
    await waitForServer(BASE_URL);

    const browser = await chromium.launch({ headless: true });
    const results = [];

    for (const device of DEVICES) {
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        isMobile: device.isMobile,
        hasTouch: device.hasTouch,
        deviceScaleFactor: device.deviceScaleFactor,
        reducedMotion: 'reduce',
      });

      const page = await context.newPage();
      await bootstrapDeterministicSession(page);

      const loginSnapshot = await snapshotCheckpoint(page, device, LOGIN_CHECKPOINT);
      results.push({
        device,
        checkpoint: LOGIN_CHECKPOINT,
        ...loginSnapshot,
      });

      await loginWithDemoAccount(page);

      for (const checkpoint of AUTH_CHECKPOINTS) {
        const snapshotResult = await snapshotCheckpoint(page, device, checkpoint);
        results.push({
          device,
          checkpoint,
          ...snapshotResult,
        });
      }

      await context.close();
    }

    await browser.close();
    stopServer();
    await rm(TEMP_DIR, { recursive: true, force: true });

    const totals = {
      checkpoints: results.length,
      match: results.filter((r) => r.status === 'match').length,
      baselineCreated: results.filter((r) => r.status === 'baseline-created').length,
      updated: results.filter((r) => r.status === 'updated').length,
      changed: results.filter((r) => r.status === 'changed').length,
      pass: results.filter((r) => r.pass).length,
      fail: results.filter((r) => !r.pass).length,
    };

    const summary = {
      date: RUN_DATE,
      baseUrl: BASE_URL,
      updateBaseline: UPDATE_BASELINE,
      totals,
      results: results.map((item) => ({
        device: item.device.id,
        checkpoint: item.checkpoint.id,
        route: item.checkpoint.hash,
        status: item.status,
        pass: item.pass,
        hash: item.hash,
        baselinePath: path.relative(process.cwd(), item.baselinePath).replace(/\\/g, '/'),
        currentPath: item.currentPath
          ? path.relative(process.cwd(), item.currentPath).replace(/\\/g, '/')
          : null,
      })),
    };

    const jsonPath = path.resolve(`docs/md3-visual-regression-results-${RUN_DATE}.json`);
    const mdPath = path.resolve(`docs/md3-visual-regression-results-${RUN_DATE}.md`);
    await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

    const lines = [];
    lines.push('# MD3 Visual Regression Results');
    lines.push('');
    lines.push(`Date: ${RUN_DATE}`);
    lines.push(`Base URL: ${BASE_URL}`);
    lines.push(`Mode: ${UPDATE_BASELINE ? 'Update baseline' : 'Check baseline'}`);
    lines.push('');
    lines.push(`- Checkpoints: ${totals.checkpoints}`);
    lines.push(`- Match: ${totals.match}`);
    lines.push(`- Baseline created: ${totals.baselineCreated}`);
    lines.push(`- Baseline updated: ${totals.updated}`);
    lines.push(`- Changed (regressions): ${totals.changed}`);
    lines.push(`- Pass: ${totals.pass}`);
    lines.push(`- Fail: ${totals.fail}`);
    lines.push('');
    lines.push('| Device | Checkpoint | Route | Status | Baseline | Current |');
    lines.push('| --- | --- | --- | --- | --- | --- |');

    for (const item of results) {
      const baselineLink = path.relative(process.cwd(), item.baselinePath).replace(/\\/g, '/');
      const currentLink = item.currentPath
        ? path.relative(process.cwd(), item.currentPath).replace(/\\/g, '/')
        : '-';
      lines.push(
        `| ${item.device.label} | ${item.checkpoint.label} | \`${item.checkpoint.hash}\` | ${item.status} | \`${baselineLink}\` | ${currentLink === '-' ? '-' : `\`${currentLink}\``} |`
      );
    }

    lines.push('');
    lines.push('Notes:');
    lines.push('- Baselines are stored in `docs/md3-visual-baseline/`.');
    lines.push('- Current run captures (new/updated/changed) are stored in `docs/md3-visual-current/<date>/`.');
    lines.push('- Use `npm run qa:visual:update` to accept intentional UI changes.');

    await writeFile(mdPath, `${lines.join('\n')}\n`, 'utf8');

    process.stdout.write(`Visual regression report written:\n- ${jsonPath}\n- ${mdPath}\n`);

    if (totals.fail > 0) {
      process.exitCode = 2;
    }
  } catch (error) {
    process.stderr.write(`MD3 visual regression failed: ${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  } finally {
    stopServer();
    await rm(TEMP_DIR, { recursive: true, force: true }).catch(() => {});
  }
};

run();
