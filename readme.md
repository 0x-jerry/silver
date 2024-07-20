# Silver

Let writing CLI like writing a document.

## Install

```sh
pnpm i @0x-jerry/silver
```

## Usage

Example:

```ts
import { silver } from '@0x-jerry/silver'
// @autocompletion will enable `completion` subcommand to generate autocomplete script
// Autocompletion only support zsh for now, and need to install manually
// Manual install: you need to append `source <(silver completion)` to `.zshrc`
const ins = sliver`
v1.0.0 @autocompletion

Silver, let you writing CLI like writing document. ${defaultAction}

-t --test @test:defaultValue, Test autocompletion.

up/upgrade <@test:dir> [...other] #stopEarly, an sub command. ${upgradeAction}

-s --string @string:default, sub command option.
--small @bool, other option.
`

// register autocomplete
ins.type('type', () => ['t1', 't2', 't3'])

function defaultAction([type], options) {
  console.log(type, options)
}

function upgradeAction([dir], options) {
  console.log(dir, options)
}
```

## Syntax Detail

Please see [syntax.ohm](./src/grammar//syntax.ohm).

## Thanks

- [vitest](https://vitest.dev/)
- [minimist](https://github.com/minimistjs/minimist)
- [tsup](https://tsup.egoist.dev)
- [ohm-js](https://ohmjs.org/)
