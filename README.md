# project-update

Update an IQGeo project based on options in a `.iqgeorc.jsonc` configuration file.

- [Installation](#installation)
- [Usage](#usage)
  - [CLI](#cli)
  - [JS](#js)
- [Commands](#commands)
  - [Default (update)](#default-update)
  - [`pull`](#pull)
    - [Custom sections](#custom-sections)
- [Contributing](#contributing)
  - [Playground](#playground)
  - [Debugging](#debugging)

## Installation

```bash
npm install github:IQGeo/utils-project-update#v<VERSION>
```

## Usage

### CLI

```bash
npx project-update
```

or via script:

```json
{
    "scripts": {
        "project-update": "project-update"
    }
}
```

```bash
npm run project-update
```

### JS

```js
import { update } from 'project-update';

update({
    /* options */
});
```

## Commands

### Default (update)

Updates a IQGeo project.

Project structure should be as per https://github.com/IQGeo/utils-project-template with
a `.iqgeorc.jsonc` configuration file at `root`.

| Option     | Type     | Description                             | Default                    | Via CLI |
| ---------- | -------- | --------------------------------------- | -------------------------- | ------- |
| `root`     | `string` | Path to the project root directory.     | `process.cwd()`            | Yes     |
| `progress` | `object` | Functions used to output progress logs. | `console.{log,warn,error}` | No      |

### `pull`

Pulls the latest IQGeo project template from GitHub and merges with existing files.

| Option     | Type     | Description                                              | Default                    | Via CLI |
| ---------- | -------- | -------------------------------------------------------- | -------------------------- | ------- |
| `out`      | `string` | The output directory for all template files and folders. | `./utils-project-template` | Yes     |
| `progress` | `object` | Functions used to output progress logs.                  | `console.{log,warn,error}` | No      |

#### Custom sections

To preserve content that isn't part of the project-template, you must wrap it in a custom section block:

```dockerfile
# CUSTOM SECTION START
...
# CUSTOM SECTION END
```

JSONC:

```jsonc
{
  // CUSTOM SECTION START
  ...
  // CUSTOM SECTION END
}
```

These sections will be sliced out and reinserted into the template files. Their positions will be preserved as best as possible, but please double-check to ensure nothing added or removed will affect it.

If content within a custom section is also detected in the template, the template content will be replaced in favour of the custom content.

**NOTE:** This doesn't apply to values pulled from the `.iqgeorc.jsonc` file. They will be re-inserted via [`update`](#default-update) once files have been pulled and merged.

## Contributing

### Playground

`playground/` contains a direct copy of [`utils-project-template`](https://github.com/IQGeo/utils-project-template) for manual testing.

Any changes made in that repo should be copied back to this repo. To do this, you can run `npm run playground:pull` - if you have any untracked changes in your working tree, you can comment out the check in [`./src/pull/index.js`](./src/pull/index.js) and rerun it.

To use the playground JS scripts, run `npm run link` to create a symlink dependency of this package in the playground's `node_modules`.

**TIP:** You can use `npm link` to create a symlink in `utils-vscode` for testing your changes in the VSCode extension.

### Debugging

There's a VSCode launch config for debugging.
