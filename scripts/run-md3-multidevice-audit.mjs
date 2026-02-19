import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const HOST = '127.0.0.1';
const PORT = 4173;
const BASE_URL = `http://${HOST}:${PORT}`;
const RUN_DATE = new Date().toISOString().slice(0, 10);

const DEVICES = [
  { id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { id: 'iphone-14-pro', label: 'iPhone 14 Pro', width: 393, height: 852, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  { id: 'ipad-mini', label: 'iPad Mini', width: 768, height: 1024, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { id: 'ipad-pro', label: 'iPad Pro', width: 1024, height: 1366, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { id: 'desktop-1440p', label: 'Desktop 1440p', width: 1440, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
  { id: 'desktop-4k', label: 'Desktop 4K', width: 3840, height: 2160, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
];

const ROUTES = [
  { id: 'settings', hash: '/settings', label: 'Settings' },
  { id: 'assignment_wizard', hash: '/wizards/assignment', label: 'Assignment wizard' },
  { id: 'return_wizard', hash: '/wizards/return', label: 'Return wizard' },
  { id: 'user_details', hash: '/users/1', label: 'User details' },
  { id: 'add_equipment', hash: '/inventory/add', label: 'Add equipment' },
  { id: 'audit_details', hash: '/audit/details', label: 'Audit details' },
  { id: 'category_details', hash: '/management/categories/1', label: 'Category details' },
  { id: 'import_locations', hash: '/locations/import', label: 'Import locations' },
  { id: 'import_models', hash: '/management/models/import', label: 'Import models' },
  { id: 'finance', hash: '/finance', label: 'Finance' },
];

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

const focusProbe = async (page, presses = 10) => {
  const focused = [];
  let hasVisibleFocus = false;

  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(90);
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || '',
        id: el.id || '',
        className: el.className || '',
        text: (el.textContent || '').trim().slice(0, 60),
        outlineStyle: style.outlineStyle || '',
        outlineWidth: style.outlineWidth || '',
        boxShadow: style.boxShadow || '',
      };
    });

    if (info) {
      focused.push(info);
      const hasOutline = info.outlineStyle !== 'none' && info.outlineWidth !== '0px';
      const hasShadow = info.boxShadow && info.boxShadow !== 'none';
      if (hasOutline || hasShadow) hasVisibleFocus = true;
    }
  }

  const uniqueFocusTargets = new Set(
    focused.map((f) => `${f.tag}|${f.role}|${f.id}|${String(f.className).slice(0, 64)}|${f.text}`)
  ).size;

  return {
    tabPresses: presses,
    uniqueFocusTargets,
    hasVisibleFocus,
    focusedSample: focused.slice(0, 6),
  };
};

const collectResponsiveMetrics = async (page) =>
  page.evaluate(() => {
    const controls = Array.from(
      document.querySelectorAll('button, [role="button"], input, select, textarea, a[href]')
    );

    const isVisible = (el) => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
        return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const visibleControls = controls.filter((el) => isVisible(el));
    const interactiveRects = visibleControls.map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || '',
        id: el.id || '',
        className: (el.className || '').toString().slice(0, 120),
        text: (el.textContent || '').trim().slice(0, 40),
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      };
    });

    const touchTargetTooSmall = interactiveRects.filter((r) => r.width < 48 || r.height < 48);
    const touchTargetTooSmallCount = touchTargetTooSmall.length;

    let touchSpacingViolationsCount = 0;
    for (let i = 0; i < interactiveRects.length; i += 1) {
      for (let j = i + 1; j < interactiveRects.length; j += 1) {
        const a = interactiveRects[i];
        const b = interactiveRects[j];

        const horizontalGap = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
        const verticalGap = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));

        if (horizontalGap < 8 && verticalGap < 8) {
          touchSpacingViolationsCount += 1;
        }
      }
    }

    const iconOnlyButtonsMissingLabel = Array.from(document.querySelectorAll('button'))
      .filter((btn) => {
        const text = (btn.textContent || '').trim();
        if (text.length > 0) return false;
        const aria = btn.getAttribute('aria-label');
        const title = btn.getAttribute('title');
        return !aria && !title;
      })
      .length;

    const root = document.documentElement;
    const horizontalOverflow = root.scrollWidth - window.innerWidth > 1;

    return {
      interactiveCount: visibleControls.length,
      iconOnlyButtonsMissingLabel,
      horizontalOverflow,
      touchTargetTooSmallCount,
      touchTargetTooSmallSample: touchTargetTooSmall.slice(0, 8),
      touchSpacingViolationsCount,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      title: document.title,
    };
  });

const run = async () => {
  let server = null;

  const stopServer = () => {
    if (server && !server.killed) {
      server.kill();
    }
  };

  try {
    server = startDevServer();
    await waitForServer(BASE_URL);

    const browser = await chromium.launch({ headless: true });
    const deviceResults = [];

    for (const device of DEVICES) {
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        isMobile: device.isMobile,
        hasTouch: device.hasTouch,
        deviceScaleFactor: device.deviceScaleFactor,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/#/`);
      await page.waitForTimeout(600);

      const emailInput = page.getByPlaceholder('Ex: nom@neemba.com');
      if (await emailInput.count()) {
        await emailInput.fill('alice.admin@neemba.com');
        await page.getByPlaceholder('Votre mot de passe').fill('demo-password');
        await page.getByRole('button', { name: /Se connecter/i }).click();
        await page.waitForTimeout(1300);
      }

      const flowResults = [];
      for (const route of ROUTES) {
        await page.goto(`${BASE_URL}/#${route.hash}`);
        await page.waitForTimeout(900);

        const responsiveMetrics = await collectResponsiveMetrics(page);
        const focusMetrics = await focusProbe(page, 10);

        const hasCriticalTouchIssue = device.hasTouch && responsiveMetrics.touchTargetTooSmallCount > 0;
        const pass = !responsiveMetrics.horizontalOverflow
          && responsiveMetrics.iconOnlyButtonsMissingLabel === 0
          && focusMetrics.uniqueFocusTargets >= 3
          && !hasCriticalTouchIssue;

        flowResults.push({
          ...route,
          responsiveMetrics,
          focusMetrics,
          pass,
        });
      }

      await context.close();

      const totals = {
        flows: flowResults.length,
        pass: flowResults.filter((r) => r.pass).length,
        fail: flowResults.filter((r) => !r.pass).length,
        overflowFailures: flowResults.filter((r) => r.responsiveMetrics.horizontalOverflow).length,
        touchTargetFailures: flowResults.filter((r) => r.responsiveMetrics.touchTargetTooSmallCount > 0).length,
      };

      deviceResults.push({
        device,
        totals,
        flows: flowResults,
      });
    }

    await browser.close();
    stopServer();

    const summary = {
      date: RUN_DATE,
      baseUrl: BASE_URL,
      totals: {
        devices: deviceResults.length,
        flows: deviceResults.reduce((acc, d) => acc + d.totals.flows, 0),
        pass: deviceResults.reduce((acc, d) => acc + d.totals.pass, 0),
        fail: deviceResults.reduce((acc, d) => acc + d.totals.fail, 0),
      },
      deviceResults,
    };

    const jsonPath = path.resolve(`docs/md3-multidevice-audit-results-${RUN_DATE}.json`);
    const mdPath = path.resolve(`docs/md3-multidevice-audit-results-${RUN_DATE}.md`);

    await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

    const lines = [];
    lines.push('# MD3 Multi-Device Audit Results');
    lines.push('');
    lines.push(`Date: ${RUN_DATE}`);
    lines.push(`Base URL: ${BASE_URL}`);
    lines.push('');
    lines.push(`- Devices checked: ${summary.totals.devices}`);
    lines.push(`- Flows checked: ${summary.totals.flows}`);
    lines.push(`- Pass: ${summary.totals.pass}`);
    lines.push(`- Fail: ${summary.totals.fail}`);
    lines.push('');
    lines.push('## Device Summary');
    lines.push('');
    lines.push('| Device | Viewport | Touch | Pass | Fail | Overflow issues | Touch target issues |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- |');

    for (const result of deviceResults) {
      lines.push(
        `| ${result.device.label} | ${result.device.width}x${result.device.height} | ${result.device.hasTouch ? 'Yes' : 'No'} | ${result.totals.pass} | ${result.totals.fail} | ${result.totals.overflowFailures} | ${result.totals.touchTargetFailures} |`
      );
    }

    lines.push('');
    lines.push('## Failures');
    lines.push('');
    lines.push('| Device | Flow | Route | Overflow | Small touch targets | Icon-only buttons missing label | Focus targets |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- |');

    let failureRows = 0;
    for (const result of deviceResults) {
      for (const flow of result.flows.filter((f) => !f.pass)) {
        failureRows += 1;
        lines.push(
          `| ${result.device.label} | ${flow.label} | \`${flow.hash}\` | ${flow.responsiveMetrics.horizontalOverflow ? 'Yes' : 'No'} | ${flow.responsiveMetrics.touchTargetTooSmallCount} | ${flow.responsiveMetrics.iconOnlyButtonsMissingLabel} | ${flow.focusMetrics.uniqueFocusTargets} |`
        );
      }
    }

    if (failureRows === 0) {
      lines.push('| None | - | - | - | - | - | - |');
    }

    lines.push('');
    lines.push('Notes:');
    lines.push('- Touch target checks use a 48x48 CSS px minimum for visible interactive controls.');
    lines.push('- Spacing checks are heuristic and reported in JSON for deeper triage.');
    lines.push('- Manual visual verification remains required for nuanced readability and UX quality.');

    await writeFile(mdPath, `${lines.join('\n')}\n`, 'utf8');

    process.stdout.write(`Multi-device audit report written:\n- ${jsonPath}\n- ${mdPath}\n`);

    if (summary.totals.fail > 0) {
      process.exitCode = 2;
    }
  } catch (error) {
    process.stderr.write(`MD3 multi-device audit failed: ${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  } finally {
    stopServer();
  }
};

run();
