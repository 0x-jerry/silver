import { createAutoIncrementGenerator, isPrimitive } from '@0x-jerry/utils'
import { CliConfig, CliOption, CliParameter, CliProgram } from './types'
import { builtinType, isType, splitFirst } from './utils'

const TOKEN_ID_PREFIX = '__token_id__'
const nextId = createAutoIncrementGenerator(TOKEN_ID_PREFIX)

const tokenIdReg = new RegExp(`${TOKEN_ID_PREFIX}\\d+$`)

export function parseCliProgram(raw: TemplateStringsArray, ...tokens: any[]): CliProgram {
  const tokenMapper = new Map<string, CliProgram['action']>()
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

  const conf = parseCliDescription(finalStr)

  if (!conf) throw new Error('Parse CLI description failed!')

  const program = covertToProgram(conf)

  return program

  function covertToProgram(conf: CliConfig): CliProgram {
    const program: CliProgram = {
      ...conf,
    }

    delete program.subCommands

    for (const subCliConf of conf.subCommands || []) {
      const subProgram = covertToProgram(subCliConf)

      program.subCommands ||= []
      program.subCommands.push(subProgram)
    }

    if (!program.description) {
      return program
    }

    program.description = program.description.trim()

    const [tokenId] = program.description.match(tokenIdReg) || []

    if (!tokenId) {
      return program
    }

    const fn = tokenMapper.get(tokenId)

    program.description = program.description.replace(tokenIdReg, '').trim()
    program.action = fn

    return program
  }
}

function parseCliDescription(finalStr: string) {
  let appCli: CliConfig | null = null
  let currentCli: CliConfig | null = null

  const lines = finalStr.trim().split(/\n+/)

  for (let line of lines) {
    line = line.trim()

    // skip blank string
    if (!line) continue
    // ignore comments
    if (line.startsWith('#')) continue

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
  return appCli
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

  const [opt, desc] = splitFirst(description, ',')

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

      const [type, defaultValue] = splitFirst(segment, ':')

      conf.type = type.slice(1)

      if (isType(conf.type!, builtinType.boolean)) {
        conf.defaultValue = defaultValue === 'true'
      } else if (isType(conf.type!, builtinType.number)) {
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

  conf.description = desc?.trim()

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
 * @example
 *
 * ```txt
 * aliasName/commandName <@file:dir> [...files] #flag, A library for create command line interface quickly. ${command}
 *
 * up/upgrade <@pkg:name:defaultPkgName> [version:latest] #flag, Upgrade package to the latest.
 * ```
 *
 */
function parseCli(description: string): CliConfig {
  const conf: CliConfig = {
    name: '',
  }

  const [name, desc] = splitFirst(description, ',')

  const [nameWithAlias, ...parameters] = name.split(/\s+/g)

  {
    // up/upgrade
    // upgrade
    const names = splitFirst(nameWithAlias, '/')

    if (names.length === 2) {
      conf.alias = names[0]
      conf.name = names[1]
    } else {
      conf.name = nameWithAlias
    }
  }

  {
    // parameters
    parameters.forEach((parameter) => {
      if (parameter.startsWith('#')) {
        // is flag
        conf.flags ||= []
        conf.flags.push(parameter.slice(1))
        return
      }

      const p = parseCliParameter(parameter)

      if (p) {
        conf.parameters ||= []
        conf.parameters.push(p)
      }
    })
  }

  conf.description = desc.trim()

  if (!name) {
    throw new Error(`Parse cli description failed: ${description}`)
  }

  return conf
}

/**
 *
 * <@pkg:name:defaultPkgName>
 * [@type:version:latest]
 * [...@file:files]
 *
 * @param description
 */
function parseCliParameter(description: string): CliParameter | null {
  const l = description.slice(0, 1)
  const r = description.slice(-1)

  const conf: CliParameter = {
    name: '',
  }

  if (l === '<' && r === '>') {
    conf.required = true
  } else if (l === '[' && r === ']') {
    conf.required = false
  } else {
    // invalid
    return null
  }

  let content = description.slice(1, -1)

  if (content.startsWith('...')) {
    conf.isArray = true
    content = content.slice(3)
  }

  const segments = content.split(':')

  const hasType = segments.at(0)?.startsWith('@')

  if (hasType) {
    conf.type = segments[0].slice(1)
    segments.splice(0, 1)
  }

  const [name, defaultValue] = segments

  conf.name = name
  conf.defaultValue = defaultValue

  return conf
}
