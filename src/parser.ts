import { createAutoIncrementGenerator, isPrimitive } from '@0x-jerry/utils'
import type { Command, CmdOption, CmdParameter, Program, CmdAction } from './types'
import { builtinType, isType, splitFirst } from './utils'

const TOKEN_ID_PREFIX = '__token_id__'
const nextId = createAutoIncrementGenerator(TOKEN_ID_PREFIX)

const tokenIdReg = new RegExp(`${TOKEN_ID_PREFIX}\\d+`, 'g')

export function parseCliProgram(raw: TemplateStringsArray, ...tokens: any[]): Program {
  const actionMapper = new Map<string, CmdAction>()
  const actionIdMapper = new Map<Function, string>()

  tokens.forEach((token) => {
    if (isPrimitive(token)) {
      return
    }

    // skip if exists
    if (actionIdMapper.has(token)) {
      return
    }

    const id = nextId()
    actionMapper.set(id, token)
    actionIdMapper.set(token, id)
  })

  const finalStr = raw.reduce((pre, cur, idx) => {
    const token = tokens[idx]

    const tokenId = actionIdMapper.get(token)

    return pre + cur + (tokenId ? ` ${tokenId} ` : token ?? '')
  }, '')

  const conf = parseProgram(finalStr)

  conf.actions = actionMapper

  return conf
}

function parseProgram(finalStr: string): Program {
  const program: Partial<Program> = {}

  let mainCommand: Command | undefined
  let currentCommand: Command | undefined

  const lines = finalStr.trim().split(/\n+/)

  {
    // check program flags
    const flags = parseAppOption(lines[0])

    if (flags) {
      program.flags = flags
      lines.splice(0, 1)
    }
  }

  for (let line of lines) {
    line = line.trim()

    // skip blank string
    if (!line) continue
    // ignore comments
    if (line.startsWith('#')) continue

    if (line.startsWith('-')) {
      // is an option description
      const opt = parseOption(line)

      if (!currentCommand) {
        throw new Error(`Invalid cli option, please specify a cli name first. ${line}`)
      }

      currentCommand.options ||= []
      currentCommand.options.push(opt)
      // todo, check duplicate name?
    } else {
      // is a cli description
      if (!mainCommand) {
        mainCommand = parseCommand(line)
        currentCommand = mainCommand
      } else {
        currentCommand = parseCommand(line)

        mainCommand.commands ||= []
        mainCommand.commands.push(currentCommand)
      }
    }
  }

  program.command = mainCommand

  if (!program.command) {
    throw new Error('Parse CLI description failed!')
  }

  return program as Program
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
function parseOption(description: string): CmdOption {
  const conf: CmdOption = {
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

      if (isType(conf.type, builtinType.boolean)) {
        conf.defaultValue = defaultValue === 'true'
      } else if (isType(conf.type, builtinType.number)) {
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

  // check name
  if (!conf.name && !conf.alias) {
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
function parseCommand(description: string): Command {
  const conf: Command = {
    name: '',
  }

  // extract action identifier, use the last one if it has multiple.
  description = description.replace(tokenIdReg, (id) => {
    conf.action = id
    return ''
  })

  const [name, desc = ''] = splitFirst(description, ',')

  const [nameWithAlias, ...parameters] = name.split(/\s+/g)

  // up/upgrade
  // upgrade
  {
    const names = splitFirst(nameWithAlias, '/')

    if (names.length === 2) {
      conf.alias = names[0]
      conf.name = names[1]
    } else {
      conf.name = nameWithAlias
    }
  }

  // parameters
  {
    parameters.forEach((parameter) => {
      if (parameter.startsWith('#')) {
        // is flag
        conf.flags ||= []
        conf.flags.push(parameter.slice(1))
        return
      }

      const p = parseCommandParameter(parameter)

      if (p) {
        conf.parameters ||= []
        conf.parameters.push(p)
      }
    })
  }

  conf.description = desc.trim()

  if (!name) {
    throw new Error(`Parse command description failed: ${description}`)
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
function parseCommandParameter(description: string): CmdParameter | null {
  const l = description.slice(0, 1)
  const r = description.slice(-1)

  const conf: CmdParameter = {
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

/**
 *
 * @param description
 * @example
 *
 * ```txt
 * @manual @help
 * ```
 */
function parseAppOption(description: string) {
  if (!description.trim().startsWith('@')) return null

  const flags: string[] = []

  const segments = description.trim().split(/\s+/g)

  segments.forEach((item) => {
    if (!item.startsWith('@')) {
      return
    }

    flags.push(item.slice(1))
  })

  return flags
}
