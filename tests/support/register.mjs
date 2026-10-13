// Test bootstrap: `node --import ./tests/support/register.mjs --test tests/*.test.ts`
// Registers the TypeScript loader in tests/support/ts-hooks.mjs.
import { register } from 'node:module';

register('./ts-hooks.mjs', import.meta.url);
