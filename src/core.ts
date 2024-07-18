import { type Value, sleep, textTableToString, isString, toValue } from '@0x-jerry/utils'
import { parseCliProgram } from './parser'
import {
  type ActionParsedArgs,
  type Program,
  CommandFlag,
  type Command,
  ProgramFlag,
  type CompletionType,
} from './types'
import minimist from 'minimist'
import { isType, builtinType } from './utils'
import { generateZshAutoCompletion, normalizeStr } from './completion/zsh'

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
 *
 * @example
 *
 * ```ts
 * const ins = sliver`@help @autocompletion
 *
 * xcat [...dir], Read file like \`cat\` command.
 *
 * -o --option \@bool, Global option.
 *
 * run [@scripts:scriptName], Run some script.
 *
 * -p --pattern \@string, Use glob pattern to run multiple scripts.
 * `
 *
 * ins.type('scripts', ['script1', 'script2']) // register auto completion for shell
 * ```
 *
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

function generateHelpMsg(conf: Command) {
  const msgs: string[] = []

  const usageDescription = conf.commands?.length ? `[COMMAND] [OPTIONS]` : `[OPTIONS]`

  const composeAlias = (cmd: Command) => [cmd.alias, cmd.name].filter(Boolean).join('/')
  const usage = `${composeAlias(conf)} ${usageDescription} ${conf.description}`

  msgs.push(usage, '')

  if (conf.commands?.length) {
    const commands = conf.commands.map((item) => [composeAlias(item), item.description])

    const s = textTableToString(commands)
    msgs.push(s, '')
  }

  if (conf.options?.length) {
    const options = conf.options.map((item) => {
      const name =
        item.alias && item.alias !== item.name ? `--${item.name} -${item.alias}` : `--${item.name}`
      return [name, item.description]
    })

    const s = textTableToString(options)
    msgs.push(s, '')
  }

  return msgs.join('\n')
}

function createCompletionCommand(ins: Sliver) {
  const conf = parseCliProgram`
completion [type], Generate autocompletion for zsh.

--install, Install autocompletion for zsh, not implement yet.
--uninstall, Uninstall autocompletion for zsh, not implement yet.
  `

  conf.command.action = 'completion'

  return {
    cmd: conf.command,
    action,
  }

  async function action(params: string[], opt: { install?: boolean; uninstall?: boolean }) {
    const [type] = params

    if (type) {
      const completions = await ins.getCompletion(type)

      const s = completions
        .map((item) => {
          return isString(item)
            ? normalizeStr(item)
            : item.desc
            ? `${normalizeStr(item.label)}\\:${item.desc}`
            : normalizeStr(item.label)
        })
        .join('\n')
      process.stdout.write(s)
      return
    }

    if (opt.install) {
      return
    }

    if (opt.uninstall) {
      return
    }

    if (ins.conf?.command) {
      const zshCode = generateZshAutoCompletion(ins.conf?.command)

      console.log(zshCode)
    }
  }
}
