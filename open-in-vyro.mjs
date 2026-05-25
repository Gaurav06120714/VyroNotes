// ─────────────────────────────────────────────────────────────────────────────
// open-in-vyro.mjs — Opens a URL in Vyro Browser if running, else default browser.
// Usage: node open-in-vyro.mjs http://localhost:3000
// ─────────────────────────────────────────────────────────────────────────────
import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { platform } from 'os';

const url = process.argv[2] || 'http://localhost:3000';
const os  = platform();

function findVyroMac() {
  const paths = [
    '/Applications/Vyro.app',
    `${process.env.HOME}/Applications/Vyro.app`,
  ];
  return paths.find(p => existsSync(p)) || null;
}

function findVyroWin() {
  const paths = [
    `${process.env.LOCALAPPDATA}\\Programs\\Vyro\\Vyro.exe`,
    `${process.env.ProgramFiles}\\Vyro\\Vyro.exe`,
  ];
  return paths.find(p => existsSync(p)) || null;
}

function isVyroRunningMac() {
  try {
    const out = execSync('pgrep -x Vyro 2>/dev/null || true').toString().trim();
    return out.length > 0;
  } catch { return false; }
}

function isVyroRunningWin() {
  try {
    const out = execSync('tasklist /FI "IMAGENAME eq Vyro.exe" 2>NUL', { shell: true }).toString();
    return out.includes('Vyro.exe');
  } catch { return false; }
}

function openUrl(url) {
  if (os === 'darwin') {
    const vyroPath = findVyroMac();
    if (vyroPath) {
      console.log(`🟣 Opening in Vyro Browser: ${url}`);
      spawn('open', ['-a', vyroPath, url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      console.log(`⚪ Vyro not found, opening in default browser: ${url}`);
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } else if (os === 'win32') {
    const vyroExe = findVyroWin();
    if (vyroExe) {
      console.log(`🟣 Opening in Vyro Browser: ${url}`);
      spawn(vyroExe, [url], { detached: true, stdio: 'ignore', shell: false }).unref();
    } else {
      console.log(`⚪ Vyro not found, opening in default browser: ${url}`);
      spawn('cmd', ['/c', 'start', url], { detached: true, stdio: 'ignore', shell: true }).unref();
    }
  } else {
    // Linux
    spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
  }
}

openUrl(url);
