import { toValue, type AsyncFactory } from '@0x-jerry/utils'
import minimist from 'minimist'
import { createCompleteCommand } from './builtins/completeCommand'
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

export class Silver {
  conf?: Program

  typeMapper = new Map<string, AsyncFactory<CompletionType>>()

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

    if (this.conf.flags?.includes(ProgramFlag.Autocomplete)) {
      // Check for collision with existing 'complete' command
      const existingComplete = this.conf.command.commands?.find(
        (cmd) => cmd.name === 'complete' || cmd.alias === 'complete'
      )
      if (existingComplete) {
        console.warn('Warning: A command named "complete" already exists. Autocomplete will override it.')
      }

      const { cmd, action } = createCompleteCommand(this)

      this.conf.command.commands ||= []
      this.conf.command.commands.push(cmd)

      this.conf.actions ||= new Map()

      this.conf.actions.set(cmd.action!, action)
    }

    updateParentProp(this.conf.command)
  }

  async getCompletion(type: string) {
    const value = this.typeMapper.get(type)

    return (await toValue(value)) || []
  }

  type(name: string, getType: AsyncFactory<CompletionType>) {
    this.typeMapper.set(name, getType)

    return this
  }

  execute(argv: string[]) {
    if (!this.conf) return

    // Resolve nested subcommands
    let command = this.conf.command
    let currentArgv = argv

    while (currentArgv.length > 0) {
      const subCommand = command.commands?.find(
        (cmd) => cmd.name === currentArgv[0] || cmd.alias === currentArgv[0]
      )

      if (subCommand) {
        command = subCommand
        currentArgv = currentArgv.slice(1)
      } else {
        break
      }
    }

    const args = parseArgv(currentArgv, command)

    if (args.help || args.h) {
      // force to print help message
      console.log(generateHelpMsg(command, this.conf))
      return
    }

    // Validate required parameters
    const params = command.parameters || []
    const positionalArgs = args._

    for (let i = 0; i < params.length; i++) {
      const param = params[i]

      if (param.required && !param.handleRestAll) {
        if (positionalArgs[i] === undefined) {
          console.error(`Error: Missing required parameter: <${param.name}>`)
          console.log(generateHelpMsg(command, this.conf))
          return
        }
      }

      // For rest parameters, we don't need to validate as they collect remaining args
      if (param.handleRestAll) {
        break
      }
    }

    if (!command.action) return
    const action = this.conf.actions?.get(command.action)
    action?.(args._, args)
  }
}

/**
@example
```ts
import { silver } from '@0x-jerry/silver'
// \@autocomplete will enable completion subcommand to generate autocomplete script
const ins = silver`
v1.0.0 \@autocomplete

Silver [@type:type], let you writing CLI like writing document. ${defaultAction}

-t --test \@test:defaultValue, Test autocomplete.

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
export function silver(raw: TemplateStringsArray, ...tokens: any[]) {
  const ins = new Silver()

  ins.parse(raw, ...tokens)

  if (!ins.conf?.flags?.includes(ProgramFlag.Manual)) {
    // Use queueMicrotask for more predictable execution than sleep()
    // This ensures type registrations happen before execution
    queueMicrotask(() => {
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

function updateParentProp(conf: Command) {
  conf.commands?.forEach((cmd) => {
    cmd.parent = conf
    updateParentProp(cmd)
  })
}
