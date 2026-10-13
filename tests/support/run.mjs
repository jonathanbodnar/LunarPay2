// `npm test` — runs every tests/*.test.ts with Node's built-in runner and the
// TypeScript loader in ./register.mjs. Module mocking (used by the webhook
// routing tests) needs Node >= 22.3; on older Node those tests skip themselves.
// Extra args go to the runner, e.g. `npm test -- --test-name-pattern=ACH`.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const files = readdirSync(path.join(root, 'tests'))
  .filter((f) => f.endsWith('.test.ts'))
  .sort()
  .map((f) => path.join('tests', f));

const [major, minor] = process.versions.node.split('.').map(Number);
const moduleMocks = major > 22 || (major === 22 && minor >= 3);

const args = [
  ...(moduleMocks ? ['--experimental-test-module-mocks'] : []),
  '--import',
  './tests/support/register.mjs',
  ...process.argv.slice(2),
  '--test',
  ...files,
];
const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
process.exit(result.status ?? 1);
