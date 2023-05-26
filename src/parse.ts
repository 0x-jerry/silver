import { createAutoIncrementGenerator, isPrimitive } from '@0x-jerry/utils'
import { CliConf, CliOption, CliProgram } from './types'

const TOKEN_ID_PREFIX = '$x@x$'
const nextId = createAutoIncrementGenerator(TOKEN_ID_PREFIX)

const tokenIdReg = new RegExp(`${TOKEN_ID_PREFIX}\\d+$`)

export function defineCli(raw: TemplateStringsArray, ...tokens: any[]): CliProgram {
  const tokenMapper = new Map<string, Function>()
  const tokenIdMapper = new Map<Function, string>()

  tokens.forEach((token) => {
    if (isPrimitive(token)) {
      return
    }

    const id = nextId()
    tokenMapper.set(id, token)
    tokenIdMapper.set(token, id)
  })

  const finalStr = raw.reduce((pre, cur, idx) => {
    const token = tokens[idx]

    const tokenId = tokenIdMapper.get(token)

    return pre + cur + (tokenId ? `${tokenId}` : token ?? '')
  }, '')

  let appCli: CliConf | null = null
  let currentCli: CliConf | null = null

  const lines = finalStr.trim().split('\n+')

  for (let line of lines) {
    line = line.trim()

    // skip blank string
    if (!line) continue

    if (line.startsWith('-')) {
      // is an option description

      const opt = parseOption(line)

      if (!currentCli) {
        throw new Error(`Invalid cli option, please specify a cli name first. ${line}`)
      }
      currentCli.options ||= []
      currentCli.options.push(opt)
      // todo, check duplicate name?
    } else {
      // is a cli description

      if (!appCli) {
        appCli = parseCli(line)
        currentCli = appCli
      } else {
        currentCli = parseCli(line)

        appCli.subCommands ||= []
        appCli.subCommands.push(currentCli)
      }
    }
  }

  if (!appCli) throw new Error('Parse CLI description failed!')

  const program = parseAction(appCli)

  return program

  function parseAction(cliConf: CliConf): CliProgram {
    const program: CliProgram = {
      ...cliConf,
      subCommands: undefined,
    }

    for (const subCliConf of cliConf.subCommands || []) {
      const subProgram = parseAction(subCliConf)

      program.subCommands ||= []
      program.subCommands.push(subProgram)
    }

    if (!cliConf.description) {
      return program
    }

    const [tokenId] = cliConf.description.trim().match(tokenIdReg) || []

    if (!tokenId) {
      return program
    }

    const fn = tokenMapper.get(tokenId)

    program.action = fn

    return program
  }
}

/**
 * Cli option description example:
 *
 * ```txt
 * -n --number #global @number:123.34, an number option with default value, and it's a global option.
 * ----------- ------- --------------  --------------
 * required    opt-in  opt-in          opt-in
 * ```
 */
function parseOption(description: string): CliOption {
  const conf: CliOption = {
    name: '',
  }

  const [opt, desc] = description.split(',')

  const segments = opt.split(/\s+/)

  segments.forEach((segment) => {
    if (segment.startsWith('-')) {
      // is name

      if (segment.startsWith('--')) {
        conf.name = segment.slice(2)
      } else {
        conf.alias = segment.slice(1)
      }
    } else if (segment.startsWith('#')) {
      // is flag

      conf.flags ||= []
      conf.flags.push(segment.slice(1))
    } else if (segment.startsWith('@')) {
      // is type

      const [type, defaultValue] = segment.split(':')

      conf.type = type.slice(1)

      if (['bool', 'boolean'].includes(conf.type!)) {
        conf.defaultValue = defaultValue === 'true'
      } else if (conf.type === 'number') {
        const n = parseFloat(defaultValue)
        conf.defaultValue = Number.isNaN(n) ? undefined : n
        // todo, warning ?
      } else {
        conf.defaultValue = defaultValue
      }
    } else {
      // unknown, just ignore
    }
  })

  conf.description = desc

  // fix name
  if (conf.alias && !conf.name) {
    conf.name = conf.alias
  }

  // check name
  if (!conf.name) {
    throw new Error(`Parse cli option failed: ${description}`)
  }

  return conf
}

/**
 * example:
 *
 * ```txt
 * commandName, A library for create command line interface quickly. ${command}
 * ```
 *
 */
function parseCli(description: string): CliConf {
  const conf: CliConf = {
    name: '',
  }

  const [name, desc] = description.split(',')

  conf.name = name

  conf.description = desc

  if (!name) {
    throw new Error(`Parse cli description failed: ${description}`)
  }

  return conf
}
