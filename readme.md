# Silver

Let writing CLI like writing a document.

## Install

```sh
pnpm i @0x-jerry/silver
```

## Usage

Default behaviour:

```ts
import { silver } from '@0x-jerry/silver'
// @help will enable -h option
// @autocompletion will enable completion subcommand to generate autocomplete script
const ins = sliver`
@help @autocompletion

silver [@type:type], Let writing CLI like writing document. ${defaultAction}

# -t/--test is a global option
-t --test @test:defultValue, Test autocompletion.

# A comment is start with a # symbol.
# aliasName/commandName, \`up\` is a sub command.
up/upgrade <@test:dir> [...other] #stopEarly, an sub command. ${upgradeAction}

-s --string @string:default, sub command option.
-sm --small @bool, other option.
`

// register autocomplete
ins.type('type', () => ['t1', 't2', 't3' ])

function defaultAction([type], options) {
    console.log(type, options)
}

function upgradeAction([dir], options) {
    console.log(dir, options)
}

```

## Syntax Detail

TODO

## Thanks

- [vitest](https://vitest.dev/)
- [minimist](https://github.com/minimistjs/minimist)
- [tsup](https://tsup.egoist.dev)