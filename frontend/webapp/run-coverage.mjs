import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function findChromeBinary() {
  const candidates = [];

  if (process.env.CHROME_BIN) {
    candidates.push(process.env.CHROME_BIN);
  }

  const localAppData = process.env.LOCALAPPDATA;
  const home = homedir();

  if (localAppData) {
    candidates.push(join(localAppData, 'ms-playwright'));
  }
  if (home) {
    candidates.push(join(home, 'AppData', 'Local', 'ms-playwright'));
  }

  const directPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  for (const candidate of directPaths) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  for (const root of candidates) {
    const found = findFirstExecutable(root);
    if (found) {
      return found;
    }
  }

  return undefined;
}

function findFirstExecutable(root) {
  if (!root || !existsSync(root)) {
    return undefined;
  }

  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    try {
      const entries = readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(fullPath);
          continue;
        }
        if (entry.isFile() && /(?:chrome|msedge)\.exe$/i.test(entry.name)) {
          return fullPath;
        }
      }
    } catch {
      // Ignore unreadable directories and continue searching elsewhere.
    }
  }

  return undefined;
}

const chromeBin = findChromeBinary();
if (!chromeBin) {
  console.error('Impossible de trouver Chrome/Chromium/Edge pour lancer les tests de couverture.');
  console.error('Définissez CHROME_BIN vers un exécutable Chrome, ou installez un navigateur compatible.');
  process.exit(1);
}

const ngJs = join(process.cwd(), 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const result = spawnSync(process.execPath, [
  ngJs,
  'test',
  '--watch=false',
  '--browsers=ChromeHeadless',
  '--code-coverage',
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    CHROME_BIN: chromeBin,
  },
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);






