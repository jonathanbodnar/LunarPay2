// Minimal TypeScript loader for Node's built-in test runner — no new
// dependencies. Resolves the `@/` path alias (tsconfig paths → src/) and
// extensionless relative imports, then transpiles .ts with the project's own
// `typescript` devDependency (types are erased, never checked here; `npm run
// type-check` does that). Tests should import modules that are free of
// Next.js/Prisma runtime side effects and inject fakes for I/O.
import { existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = path.join(ROOT, 'src');

function probe(base) {
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const hit = probe(path.join(SRC, specifier.slice(2)));
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  } else if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    context.parentURL?.startsWith('file:')
  ) {
    const hit = probe(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier));
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    // Package subpaths without an exports map (e.g. `next/server`) resolve the
    // CommonJS way in the app's bundler; ESM needs the file extension.
    const bareSubpath = /^(@[^/]+\/)?[^./][^/]*\/.+/.test(specifier) && !/\.[cm]?js$/.test(specifier);
    if (err?.code === 'ERR_MODULE_NOT_FOUND' && bareSubpath) {
      return nextResolve(`${specifier}.js`, context);
    }
    throw err;
  }
}

export async function load(url, context, nextLoad) {
  // Test the path, not the URL: module mocks append a query string.
  if (url.startsWith('file:') && /\.tsx?$/.test(new URL(url).pathname)) {
    const filename = fileURLToPath(url);
    const source = await readFile(filename, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        inlineSourceMap: true,
      },
    });
    return { format: 'module', source: outputText, shortCircuit: true };
  }
  return nextLoad(url, context);
}
