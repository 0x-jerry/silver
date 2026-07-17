# Silver

Let writing CLI like writing a document.

## Install

```sh
pnpm i @0x-jerry/silver
```

## Quick Start

```ts
import { silver } from "@0x-jerry/silver";

const cli = silver`
v1.0.0 @autocomplete

my-cli [file], A CLI that writes like a document. ${mainAction}

-t --test @type:defaultValue, Test autocomplete.
-o --output @string, Output file path.

up/upgrade <dir> [...extra] #stopEarly, Upgrade something. ${upgradeAction}

  -f --force @bool, Force upgrade.
`;

// Register custom completion types
cli.type("type", () => ["value1", "value2", "value3"]);

function mainAction([file], options) {
  console.log("file:", file, "options:", options);
}

function upgradeAction([dir, ...extra], options) {
  console.log("dir:", dir, "extra:", extra, "options:", options);
}
```

## Syntax Guide

Silver uses a template literal to define your CLI. Here's the full syntax:

### Program-level

```
v1.0.0 @autocomplete @manual
```

| Token           | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `v1.0.0`        | Version declaration (must be at the top)                   |
| `@autocomplete` | Enables `complete` subcommand for shell autocomplete       |
| `@manual`       | Prevents auto-execution; call `cli.execute(argv)` manually |

### Command Definition

```
commandName/alias [param] <reqParam> [...restParam] #stopEarly, Description text. ${actionFn}
```

| Part           | Example               | Description                               |
| -------------- | --------------------- | ----------------------------------------- |
| Name           | `install`             | Command name (alphanumeric + `_`)         |
| Alias          | `install/i`           | Shorthand alias via `/`                   |
| Optional param | `[name]`              | Optional positional parameter             |
| Required param | `<name>`              | Required positional parameter             |
| Rest param     | `[...items]`          | Collects remaining arguments as array     |
| Flag           | `#stopEarly`          | Command flag (see below)                  |
| Description    | `, Install packages.` | Text after comma is the description       |
| Action         | `${myFn}`             | Function to call when command is executed |

**Command flags:**

| Flag         | Description                                              |
| ------------ | -------------------------------------------------------- |
| `#stopEarly` | Stop parsing options after the first non-option argument |

### Options

```
-s --string @type, Description.
```

| Part        | Example          | Description             |
| ----------- | ---------------- | ----------------------- |
| Short name  | `-s`             | Single-letter alias     |
| Long name   | `--string`       | Full option name        |
| Type        | `@string`        | Option type (see below) |
| Description | `, Description.` | Text after comma        |

### Parameter Types

```
[@type:name]     // typed optional parameter
<@type:name>     // typed required parameter
[...@type|_files:name]  // typed rest param with file completion
```

Types are registered via `cli.type(name, getValues)`. Built-in types include `bool`, `boolean`, `number`, `string`. Special completion types `_files` and `_dirs` enable shell-native file/directory completion.

## Autocomplete

Set `@autocomplete` at the program level to enable shell completion.

### Shell Support

| Shell      | Command                                                          |
| ---------- | ---------------------------------------------------------------- |
| zsh        | `source <(your-cli complete zsh)`                                |
| PowerShell | `Invoke-Expression (your-cli complete powershell \| Out-String)` |

For persistent setup, add the output to your shell's config file (`.zshrc` or PowerShell profile).

### Custom Completion Types

```ts
cli.type("env", () => ["development", "production", "staging"]);

// Async types
cli.type("remote-branch", async () => {
  const res = await fetch("https://api.example.com/branches");
  return res.json();
});

// With descriptions (displayed in some shells)
cli.type("format", () => [
  { label: "json", desc: "JSON output" },
  { label: "yaml", desc: "YAML output" },
]);
```

### Built-in Completion Types

| Type     | Description                              |
| -------- | ---------------------------------------- |
| `_files` | File path completion (shell-native)      |
| `_dirs`  | Directory path completion (shell-native) |

These can be combined with custom types: `@custom|_files`.

## API

### `silver` (default export)

```ts
function silver(template: TemplateStringsArray, ...tokens: any[]): Silver;
```

Parses the template and optionally auto-executes with `process.argv`.

### `Silver` class

| Method                  | Description                                |
| ----------------------- | ------------------------------------------ |
| `type(name, getValues)` | Register a completion type (sync or async) |
| `execute(argv)`         | Execute the CLI with the given arguments   |
| `parse(raw, ...tokens)` | Parse a template literal programmatically  |

### Exported Types

```ts
import {
  silver,
  BuiltinType, // enum: File = '_files', Dir = '_dirs'
  type CompletionGroup, // { name: string, values: string[] }
  type CompletionOutput, // { groups: CompletionGroup[] }
  type Command,
  type CmdOption,
  type CmdParameter,
  type Program,
  type CmdAction,
  type ActionParsedArgs,
  ProgramFlag,
  CommandFlag,
} from "@0x-jerry/silver";
```

## Thanks

- [vitest](https://vitest.dev/)
- [minimist](https://github.com/minimistjs/minimist)
- [tsdown](https://tsup.egoist.dev)
- [ohm-js](https://ohmjs.org/)
- [mustache](https://github.com/janl/mustache.js)
- [picocolors](https://github.com/alexeyraspopov/picocolors)
