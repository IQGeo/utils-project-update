# project-update

Update an IQGeo project based on options in a `.iqgeorc.jsonc` configuration file.

-   [Installation](#installation)
-   [Usage](#usage)
    -   [CLI](#cli)
    -   [JS](#js)
-   [Configuration](#configuration)
-   [Contributing](#contributing)
    -   [Playground](#playground)
    -   [Debugging](#debugging)

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

## Configuration

| Option     | Type     | Description                             | Default                    | Via CLI |
| ---------- | -------- | --------------------------------------- | -------------------------- | ------- |
| `root`     | `string` | Path to the project root directory.     | `process.cwd()`            | Yes     |
| `progress` | `object` | Functions used to output progress logs. | `console.{log,warn,error}` | No      |

## Contributing

### Playground

`playground/` contains a direct copy of [`utils-project-template`](https://github.com/IQGeo/utils-project-template) for manual testing.

**NOTE:** Any changes made in that repo should be copied back to this repo. To do this, you can run `npm run playground:update`.

To use the playground dev scripts, first you have to set up symlinks via `npm link`:

1. Run `npm link` in the root of this repo
2. `cd playground`
3. Run `npm link project-update`

Then any changes made in `src/` will be reflected in the playground when you run the dev scripts.

### Debugging

There's a VSCode launch config for debugging.