import { parseCliProgram } from './parser'
import {
  type ActionParsedArgs,
  type Program,
  type Command,
  type CompletionType,
  CommandFlag,
  ProgramFlag,
} from './types'
import minimist from 'minimist'
import { isType, builtinType } from './utils'
import { sleep, toValue, type Value } from '@0x-jerry/utils'
import { generateHelpMsg } from './builtins/helpOption'
import { createCompletionCommand } from './builtins/completionCommand'

export class Sliver {
  conf?: Program

  typeMapper = new Map<string, Value<CompletionType | Promise<CompletionType>>>()

  parse(raw: TemplateStringsArray, ...tokens: any[]) {
    this.conf = parseCliProgram(raw, ...tokens)

    if (this.conf.flags?.includes(ProgramFlag.Help)) {
      // add help option
      this.conf.command.options ||= []

      this.conf.command.options.push({
        name: 'help',
        alias: 'h',
        type: 'bool',
        description: 'Print help messages.',
      })
    }

    if (this.conf.flags?.includes(ProgramFlag.Autocompletion)) {
      const { cmd, action } = createCompletionCommand(this)

      this.conf.command.commands ||= []
      this.conf.command.commands.push(cmd)

      this.conf.actions ||= new Map()

      this.conf.actions.set(cmd.action!, action)
    }
  }

  async getCompletion(type: string) {
    const value = this.typeMapper.get(type)

    return (await toValue(value)) || []
  }

  type(name: string, getType: Value<CompletionType | Promise<CompletionType>>) {
    this.typeMapper.set(name, getType)

    return this
  }

  execute(argv: string[]) {
    if (!this.conf) return

    // get all sub command names
    const commandMapper = this.conf.command.commands?.reduce((names, item) => {
      names.set(item.name, item)

      if (item.alias) {
        names.set(item.alias, item)
      }

      return names
    }, new Map<string, Command>())

    let command = this.conf.command

    // if it is a sub command
    if (commandMapper?.has(argv[0])) {
      command = commandMapper.get(argv[0])!
      argv = argv.slice(1)
    }

    const args = parseArgv(argv, command)

    if (this.conf.flags?.includes(ProgramFlag.Help) && (args.help || args.h)) {
      // force to print help message
      console.log(generateHelpMsg(command))

      return
    }

    // todo, validate required parameters and options

    const action = this.conf.actions?.get(command.action!)
    action?.(args._, args)
  }
}

/**
@example

```ts
import { sliver, type ActionParsedArgs } from '@0x-jerry/sliver'

const ins = sliver`
\@help \@autocompletion

xx [@type:type], A library for create command line interface quickly. ${fn}

-t --test \@test:t1, Test autocompletion.

# aliasName/commandName
up/upgrade <@test:dir> [...other] #stopEarly, an sub command. ${fn}

-s --string \@string:default, sub command option.
-sm --small \@bool, other option.
`

ins.type('test', ['t1', 't2', 't3:dev'])

ins.type('type', () => [...ins.typeMapper.keys()])

function fn(_params: string[], opt: ActionParsedArgs) {
  console.log(JSON.stringify(opt, null, 2))
}
```
 */
export function sliver(raw: TemplateStringsArray, ...tokens: any[]) {
  const ins = new Sliver()

  ins.parse(raw, ...tokens)

  if (!ins.conf?.flags?.includes(ProgramFlag.Manual)) {
    sleep().then(() => {
      const argv = process.argv.slice(2)
      ins.execute(argv)
    })
  }

  return ins
}

function parseArgv(argv: string[], program: Command) {
  const config = {
    alias: {} as Record<string, string>,
    default: {} as Record<string, any>,
    boolean: [] as string[],
    '--': true,
    stopEarly: !!program.flags?.includes(CommandFlag.StopEarly),
  }

  for (const opt of program.options || []) {
    if (opt.alias && opt.name) {
      config.alias[opt.name] = opt.alias
    }

    if (opt.defaultValue != null) {
      const nameOrAlias = opt.name || opt.alias
      if (nameOrAlias) {
        config.default[nameOrAlias] = opt.defaultValue
      }
    }

    if (isType(opt.type!, builtinType.boolean)) {
      const nameOrAlias = opt.name || opt.alias
      if (nameOrAlias) {
        config.boolean.push(nameOrAlias)
      }
    }
  }

  const args = minimist(argv, config)

  args['--'] ||= []

  return args as ActionParsedArgs
}
