import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync(process.execPath, ['--test', 'server/test/api.test.js'], {
  cwd: projectRoot,
  env: { ...process.env, NODE_ENV: 'test', RAPYD_ACCESS_KEY: 'test_access', RAPYD_SECRET_KEY: 'test_secret' },
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
