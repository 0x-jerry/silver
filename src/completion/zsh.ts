import { type Arrayable, ensureArray } from '@0x-jerry/utils'
import { BuiltinType, type CmdOption, type CmdParameter, type Command } from '../types'
import { isBuiltinType } from '../utils'

/**
 *
 * refer: https://github.com/zsh-users/zsh-completions/blob/master/zsh-completions-howto.org#writing-your-own-completion-functions
 *
 * @param globalConf
 */
export function generateZshAutoCompletion(globalConf: Command) {
  const program = globalConf.name

  const functions = new Map<string, CodeLine[]>()

  const mainCodes: CodeLine[] = genMainProgram()

  const mainFnName = createFn(program, mainCodes)

  const lines: CodeLine[] = [
    //
    `#compdef ${program}`,
    '',
    `_get_type() {`,
    [
      `local scripts_list`,
      `IFS=$'\\n' scripts_list=($(SHELL=zsh ${program} completion "$1"))`,
      `scripts="scripts:scripts:(($scripts_list))"`,
      `_alternative "$scripts"`,
    ],
    `}`,
    '',
    ...[...functions.values()].flat(),
    '',
    `if ! command -v compinit >/dev/null; then`,
    [`autoload -U compinit && compinit`],
    `fi`,
    '',
    `compdef ${mainFnName} ${program}`,
  ]

  return generateCode(lines)

  function createFn(name: Arrayable<string>, codes: CodeLine[]) {
    const fnName = generateFnName(ensureArray(name))

    functions.set(fnName, [`${fnName}() {`, codes, `}`])

    return fnName
  }

  function genMainProgram() {
    const argumentsCode = warpLines([
      `_arguments -s`,
      //
      `'1: :->cmd'`,
      `'*: :->args'`,
    ])

    const codes = [
      ...argumentsCode,
      '',
      `case $state in`,
      `cmd)`,
      [
        //
        genCommands(),
        `;;`,
      ],
      `args)`,
      [
        //
        genSubCommands(),
        `;;`,
      ],
      `esac`,
    ]

    return codes
  }

  function genCommands() {
    const options = genGlobalOptions()

    const names = (globalConf.commands || [])
      .map((cmd) => {
        const codes: string[] = []
        const d = `${normalizeStr(cmd.name)}\\:${JSON.stringify(cmd.description || '')}`
        codes.push(d)

        if (cmd.alias) {
          const d = `${normalizeStr(cmd.alias)}\\:${JSON.stringify(cmd.description || '')}`
          codes.push(d)
        }

        return codes
      })
      .flat()

    const firstType = getOptionType(globalConf.parameters?.at(0)?.type)

    const commandsCode = warpLines([
      //
      '_alternative',
      `'commands:commands:((${names.join(' ')}))'`,
      `': :${firstType}'`,
    ])

    const firstCompletion = createFn(
      ['_', globalConf.name, 'commands_or_params'],
      [...commandsCode]
    )

    const params = generateParams(globalConf.parameters?.slice(1))

    const handleRest = params.some((item) => item.startsWith("'*"))
      ? ''
      : `'*: :${BuiltinType.File}'`

    const codes = warpLines([
      //
      `_arguments -s`,
      `': :{${firstCompletion}}'`,
      ...params,
      handleRest,
      ...options,
    ])

    return createFn(['_', globalConf.name, 'commands'], codes)
  }

  function genSubCommands() {
    const mainCodes = [
      `case $line[1] in`,
      ...(globalConf.commands || [])
        //
        ?.map((command) => _genSubCommand(globalConf.name, command))
        .flat(),
      '*)',
      [
        //
        genCommands(),
        ';;',
      ],
      `esac`,
    ]

    return createFn(['_', globalConf.name, 'sub_commands'], mainCodes)

    function _genSubCommand(parentName: string, command: Command) {
      const filteredOptions: CmdOption[] = command.options || []

      globalConf.options?.forEach((opt) => {
        const hit = filteredOptions.find((item) => {
          const sameName = item.name && item.name === opt.name
          const sameAlias = item.alias && item.alias === opt.alias

          return sameAlias || sameName
        })

        if (!hit) {
          filteredOptions.push(opt)
        }
      })

      const options = generateOptions(filteredOptions)

      const params = generateParams(command.parameters)

      const handleRest = params.some((item) => item.startsWith("'*"))
        ? []
        : [`'*: :${BuiltinType.File}'`]

      const codes = warpLines([
        //
        `_arguments -s`,
        `'1: :->null'`,
        ...handleRest,
        ...params,
        ...options,
      ])

      const fnName = createFn([parentName, command.name, 'option'], codes)

      const nameWithAlias = [
        command.alias && command.alias !== command.name ? command.alias : '',
        command.name,
      ]

      return [
        `${nameWithAlias.filter(Boolean).join('|')})`,
        //
        [fnName, `;;`],
      ]
    }
  }

  function genGlobalOptions() {
    return generateOptions(globalConf.options)
  }
}

function generateOptions(options?: CmdOption[]): string[] {
  const codes: string[] = []

  if (!options) {
    return codes
  }

  for (const opt of options) {
    const defaultValueDescription =
      opt.defaultValue != null ? ` @default is ${opt.defaultValue}` : ''

    const desc = `[${opt.description}${defaultValueDescription}]`

    const hasAlias = opt.name && opt.alias

    let type = getOptionType(opt.type)
    type = type ? `: :${type}` : ''

    const name = hasAlias
      ? `{-${opt.alias},--${opt.name}}`
      : opt.name
      ? `--${opt.name}`
      : `-${opt.alias}`

    if (hasAlias) {
      codes.push(`${name}'${desc}${type}'`)
    } else {
      codes.push(`'${name}${desc}${type}'`)
    }
  }

  return codes
}

function generateParams(params: CmdParameter[] = []): string[] {
  const codes = params.map((item) => {
    const type = getOptionType(item.type)

    return `'${item.handleRestAll ? '*' : ''}: :${type}'`
  })

  return codes
}

function getOptionType(type?: string) {
  if (!type) return BuiltinType.File

  if (isBuiltinType(type)) return ''

  if (type.startsWith('_')) return type

  return `{_get_type ${type}}`
}

function generateFnName(tokens: string[]) {
  return '_' + tokens.join('_')
}

function generateCode(lines: CodeLine[], indent = 0): string {
  const codes: string[] = []

  for (const line of lines) {
    if (typeof line === 'string') {
      codes.push(' '.repeat(indent) + line)
    } else {
      const multiLines = generateCode(line, indent + 2)
      codes.push(multiLines)
    }
  }

  return codes.join('\n')
}

function warpLines(codes: string[]) {
  return codes.map((line, idx) => {
    return idx === codes.length - 1 ? line : `${line} \\`
  })
}

type CodeLine = string | CodeLine[]

export function normalizeStr(item: string) {
  return item.replaceAll(':', '\\\\:')
}
