---
applyTo: 'src/**/*.js,scripts/**/*.js,playground/**/*.js'
---

# utils-project-update: Tooling Patterns

This is a Node.js ESM utility library that reads `.iqgeorc.jsonc` project configuration files and updates or pulls IQGeo project template files.

## Module System

- Use ESM (`import`/`export`). Do **not** use `require()` or `module.exports`.
- Always include the `.js` extension in local import paths:
    ```js
    import { readConfig } from '../config.js';
    ```
- Use the `node:` protocol prefix for Node.js built-ins:
    ```js
    import { spawnSync } from 'node:child_process';
    import fs from 'node:fs';
    import path from 'node:path';
    ```

## Type System (JSDoc)

Source files are plain JavaScript checked via `jsconfig.json` with `checkJs: true` and `strict: true`. Use JSDoc for all type information — do **not** add a TypeScript build step.

- Define shared types in `src/typedef.js` using `@typedef`.
- Annotate function parameters and return types with `@param` and `@returns`.
- Use `@type` for variable annotations:
    ```js
    /** @type {Record<string, string>} */
    const mapping = {};
    ```
- Use `@satisfies` for arrays and objects that must match a type without widening:
    ```js
    /** @satisfies {ReadonlyArray<TemplateFilePath>} */
    const INCLUDE_FILES = [ ... ];
    ```
- Use `// @ts-expect-error` (with a brief explanation) only when a genuine JSDoc limitation prevents correct inference.

## Transformer Pattern

File content transformers follow the `Transformer` typedef:

```js
/**
 * @type {Transformer}
 */
const myModifier = (config, content) => {
    const section = config.modules
        .filter(m => ...)
        .map(m => `...`)
        .join('\n');

    return content.replace(
        /(# START SECTION my-section.*)[\s\S]*?(# END SECTION)/,
        `$1\n${section}\n$2`
    );
};
```

- Transformers are pure functions: `(config: Config, content: string) => string`.
- Always return a non-empty string — the caller throws if the result is falsy.
- Use named regex capture groups or positional groups to preserve surrounding content.
- Export all transformers via the `fileTransformers` record in `transform.js`, keyed by relative file path.

## Config

The `Config` object is read from `.iqgeorc.jsonc` via `readConfig(root)`:

- Use `jsonc-parser` (not `JSON.parse`) whenever parsing JSONC files.
- Treat `config` as read-only in transformers — never mutate it.
- Apply defaults inside `readConfig`, not at call sites:
    ```js
    if (!config.registry) config.registry = 'harbor.delivery.iqgeo.cloud/releases';
    ```

## Progress Handler

Functions that perform I/O accept a `ProgressHandler` object instead of logging directly:

```js
export function update({ progress = defaultProgress } = {}) { ... }
```

- Call `progress.log(level, info)` for informational messages.
- Call `progress.warn(level, info)` for non-fatal issues (continue execution).
- Call `progress.error(level, info)` for fatal issues (halt or return early).
- Do **not** call `console.log` / `console.warn` / `console.error` directly in library code.

## Error Handling

- Wrap file system operations in `try/catch` and report via the progress handler:
    ```js
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        progress.warn(2, `Failed to read file ${filePath}`);
        return false;
    }
    ```
- Let unexpected errors propagate to the top-level caller for logging.
- Do not swallow errors silently.

## Shell Commands

Use `spawnSync` from `run()` in `helpers.js` rather than calling `spawnSync` directly:

```js
import { ensureCleanWorkingTree, run } from '../helpers.js';

run('git', ['clone', '--depth', '1', url, dest]);
ensureCleanWorkingTree(cwd); // throws if working tree is dirty
```

- Always pass `cwd` explicitly — do not rely on `process.cwd()` in library functions.
- Capture output with `{ stdio: 'pipe' }` when the result needs inspection; use `{ stdio: 'inherit' }` (default) otherwise.

## File Layout

```
src/
  config.js         # readConfig() — reads .iqgeorc.jsonc
  helpers.js        # run(), ensureCleanWorkingTree()
  typedef.js        # shared @typedef declarations
  index.js          # public API re-exports
  update/
    index.js        # update() entry point
    transform.js    # fileTransformers record
  pull/
    index.js        # pull() entry point
    diff.js         # compareIqgeorc(), mergeCustomSections()
scripts/
  release.js        # version bump helper (not part of public API)
```

- Keep `typedef.js` as the single source of truth for shared types.
- Do not add new top-level files to `src/` without updating `src/index.js`.
