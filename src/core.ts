import { sleep, toValue, type Value } from '@0x-jerry/utils'
import minimist from 'minimist'
import { createCompletionCommand } from './builtins/completionCommand'
import { generateHelpMsg } from './builtins/helpOption'
import { parseCliProgram } from './parser'
import {
  type ActionParsedArgs,
  type Command,
  CommandFlag,
  type CompletionType,
  type Program,
  ProgramFlag,
} from './types'
import { builtinType, isType } from './utils'

export class Sliver {
  conf?: Program

  typeMapper = new Map<string, Value<CompletionType | Promise<CompletionType>>>()

  parse(raw: TemplateStringsArray, ...tokens: any[]) {
    this.conf = parseCliProgram(raw, ...tokens)
    // add help option
    this.conf.command.options ||= []

    this.conf.command.options.push({
      name: 'help',
      alias: 'h',
      type: 'bool',
      description: 'Print help text for command.',
    })

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

    if (args.help || args.h) {
      // force to print help message
      console.log(generateHelpMsg(command, this.conf))

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
import { silver } from '@0x-jerry/silver'
// \@autocompletion will enable completion subcommand to generate autocomplete script
const ins = sliver`
v1.0.0 \@autocompletion

Silver [@type:type], let you writing CLI like writing document. ${defaultAction}

-t --test \@test:defaultValue, Test autocompletion.

up/upgrade <@test:dir> [...other] #stopEarly, an sub command. ${upgradeAction}

-s --string \@string:default, sub command option.
--small \@bool, other option.
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
