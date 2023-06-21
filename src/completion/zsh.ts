import { type Arrayable, toArray } from '@0x-jerry/utils'
import type { CmdOption, CmdParameter, Command } from '../types'
import { isBuiltinType } from '../utils'

/**
 *
 * refer: https://github.com/zsh-users/zsh-completions/blob/master/zsh-completions-howto.org#writing-your-own-completion-functions
 *
 * @param conf
 */
export function generateZshAutoCompletion(conf: Command) {
  const program = conf.name

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
    const fnName = generateFnName(toArray(name))

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

    const names = (conf.commands || [])
      .map((cmd) => {
        const codes: string[] = []
        const d = `${cmd.name}\\:${JSON.stringify(cmd.description || '')}`
        codes.push(d)

        if (cmd.alias) {
          const d = `${cmd.alias}\\:${JSON.stringify(cmd.description || '')}`
          codes.push(d)
        }

        return codes
      })
      .flat()

    const codes = warpLines([
      //
      `_arguments -s`,
      `'1: :((${names.join(' ')}))'`,
      // todo, custom type
      `'*: :_files'`,
      ...options,
    ])

    return createFn(['_', conf.name, 'commands'], codes)
  }

  function genSubCommands() {
    const mainCodes = [
      `case $line[1] in`,
      ...(conf.commands || [])
        //
        ?.map((command) => _genSubCommand(conf.name, command))
        .flat(),
      '*)',
      [
        //
        genCommands(),
        ';;',
      ],
      `esac`,
    ]

    return createFn(['_', conf.name, 'sub_commands'], mainCodes)

    function _genSubCommand(parentName: string, command: Command) {
      const filteredOptions: CmdOption[] = command.options || []

      conf.options?.forEach((opt) => {
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

      const codes = warpLines([
        //
        `_arguments -s`,
        `'1: :->null'`,
        `'*: :_files'`,
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
    return generateOptions(conf.options)
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

    const type = getOptionType(opt)

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

function generateParams(params: CmdParameter[]): string[] {
  const codes: string[] = []

  params.forEach((item) => {
    if (!item.type) {
      return '_file'
    }

    item.type
  })

  return codes
}

function getOptionType(opt: CmdOption) {
  if (!opt.type || isBuiltinType(opt.type)) return ''

  if (opt.type.startsWith('_')) return opt.type

  return `: :{_get_type ${opt.type}}`
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
