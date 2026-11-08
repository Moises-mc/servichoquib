import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(serverRoot, '..');
const roots = [
  path.join(projectRoot, 'js'),
  path.join(serverRoot, 'src'),
  path.join(serverRoot, 'test'),
];

function collectJavaScript(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScript(target);
    return entry.isFile() && target.endsWith('.js') ? [target] : [];
  });
}

const compatibilityEntrypoint = path.join(serverRoot, 'server.js');
const files = [...roots.flatMap(collectJavaScript), compatibilityEntrypoint].sort();
let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`\n[ERROR] ${path.relative(projectRoot, file)}\n${result.stderr || result.stdout}`);
  }
}

if (failed) process.exitCode = 1;
else console.log(`Sintaxis correcta: ${files.length} archivos JavaScript verificados.`);
