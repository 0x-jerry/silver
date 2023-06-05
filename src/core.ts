import { Value } from '@0x-jerry/utils'
import { parseCliProgram } from './parser'
import { ActionParsedArgs, Program, CommandFlag, Command, ProgramFlag } from './types'
import minimist from 'minimist'
import { isType, builtinType } from './utils'

export class Sliver {
  conf?: Program

  typeMapper = new Map<string, Value<string[]>>()

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
      const { cmd, action } = this._createCompletionCommand()

      this.conf.command.commands ||= []
      this.conf.command.commands.push(cmd)

      this.conf.actions ||= new Map()

      this.conf.actions.set(cmd.action!, action)
    }
  }

  _createCompletionCommand() {
    const conf = parseCliProgram`
completion [type], Generate autocompletion for zsh.

--install, Install autocompletion for zsh.
--uninstall, Uninstall autocompletion for zsh.
  `

    conf.command.action = 'completion'

    return {
      cmd: conf.command,
      action,
    }

    function action() {
      // todo, handle completion
    }
  }

  getCompletion(type: string) {
    const value = this.typeMapper.get(type)

    if (typeof value === 'function') {
      return value()
    }

    return value || []
  }

  type(name: string, getType: Value<string[]>) {
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

    // if is sub command
    if (commandMapper?.has(argv[0])) {
      command = commandMapper.get(argv[0])!
      argv = argv.slice(1)
    }

    const args = parseArgv(argv, command)

    if (this.conf.flags?.includes(ProgramFlag.Help) && args.help) {
      // force to print help message
      console.log(generateHelpMsg(this.conf))

      return
    }

    // todo, validate required parameters and options

    const action = this.conf.actions?.get(command.action!)
    action?.(args)
  }
}

export function sliver(raw: TemplateStringsArray, ...tokens: any[]) {
  const ins = new Sliver()

  ins.parse(raw, ...tokens)

  if (!ins.conf?.flags?.includes(ProgramFlag.Manual)) {
    const argv = process.argv.slice(2)
    ins.execute(argv)
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
    if (opt.alias) {
      config.alias[opt.name] = opt.alias
    }

    if (opt.defaultValue != null) {
      config.default[opt.name] = opt.defaultValue
    }

    if (isType(opt.type!, builtinType.boolean)) {
      config.boolean.push(opt.name)
    }
  }

  const args = minimist(argv, config)

  args['--'] ||= []

  return args as ActionParsedArgs
}

function generateHelpMsg(conf: Program) {
  const msgs: string[] = []

  // todo, generate help message

  return msgs.join('\n')
}
