import { type Arrayable, ensureArray, isString } from '@0x-jerry/utils'
import type { CmdOption, Command } from '../types'

/**
 * refer: https://github.com/zsh-users/zsh-completions/blob/master/zsh-completions-howto.org#writing-your-own-completion-functions
 */
class ZshCodeGenerator {
  _fns = new Map<string, CodeLine>()
  _codes: CodeLine = []

  constructor(public name: string) {}

  createFn(name: Arrayable<string>, codes: CodeLine) {
    const fnName = generateFnName([this.name, ...ensureArray(name)]).replaceAll('|', '_')

    const finalCodes = [`${fnName}() {`, codes, `}`]

    if (this._fns.has(fnName)) {
      const c1 = generateCode(finalCodes)
      const c2 = generateCode(this._fns.get(fnName) || [])
      if (c1 !== c2) {
        throw new Error(`Set different codes for function [${fnName}]\n${c1}\n${c2}`)
      }

      return fnName
    }

    this._fns.set(fnName, finalCodes)

    return fnName
  }

  setMainFnCodes(codes: CodeLine) {
    const programName = this.name

    this._codes = [
      `zstyle ':completion:*:*:${programName}:*' group-name ''`,
      `zstyle ':completion:*:*:${programName}:*' descriptions 'yes'`,
      `zstyle ':completion:*:*:${programName}:*' format '%F{green}-- %d --%f'`,
      '',
      `local program=${programName}`,
      `typeset -A opt_args`,
      '',
      ...codes,
    ]
  }

  generate() {
    const mainFnName = this.createFn([], this._codes)

    const lines: CodeLine = [
      //
      `#compdef ${this.name}`,
      ...[...this._fns.values()].flat(),
      '',
      `if ! command -v compinit >/dev/null; then`,
      [`autoload -U compinit && compinit`],
      `fi`,
      '',
      `compdef ${mainFnName} ${this.name}`,
    ]

    return this._generateCode(lines)
  }

  _generateCode(lines: CodeLine, indent = 0): string {
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

  _generateAlternativeBranches(type: string) {
    const types = type.split('|')

    const codes: string[] = []

    const branchesCode: string[] = []
    let count = 0

    for (const _type of types) {
      if (isNativeZshType(_type)) {
        branchesCode.push(`'${generateTypeName(_type)}:${generateTypeName(_type)}:${_type}'`)
      } else {
        const varName = `list_${count++}`
        codes.push(
          //
          `local -a ${varName}`,
          `IFS=$'\\n' ${varName}=($(SHELL=zsh ${this.name} completion ${_type}))`,
        )

        branchesCode.push(`'${_type}:${_type}:(($${varName}))'`)
      }
    }

    return {
      codes,
      branchesCode,
    }
  }

  generateAlternativeCode(opt: { type?: string; extraBranches?: string[] }): CodeLine {
    const { type, extraBranches } = opt
    if (!type && !extraBranches?.length) {
      throw new Error(`Must include one type!`)
    }

    const alternativeCode = type ? this._generateAlternativeBranches(type) : undefined

    const codes: CodeLine = [
      ...(alternativeCode?.codes || []),
      ...warpLines([
        //
        `_alternative`,
        ...(extraBranches || []),
        ...(alternativeCode?.branchesCode || []),
      ]),
    ]

    return codes
  }

  generateAlternativeCodeFn(opt: {
    type?: string
    extraBranches?: string[]
    namePrefixes?: Arrayable<string>
  }): CodeLine {
    const { type, extraBranches, namePrefixes } = opt

    const names = [...(namePrefixes || []), type].filter(isString)
    if (!names) {
      throw new Error(`Please set namePrefixes`)
    }

    const codes = this.generateAlternativeCode({ type, extraBranches })

    return this.createFn(['_type_', ...names], codes)
  }
}

interface GenerateArgumentsOption {
  branches: [string, null | CodeLine][]
  params?: ParamOption[]
}

interface ParamOption {
  label: string
  code?: CodeLine
}

function generateArgumentsCode(opt: GenerateArgumentsOption) {
  const { branches, params = [] } = opt
  const argumentArgCodes: string[] = []

  const caseCodes: CodeLine = []

  let idx = 0
  for (const [key, code] of branches) {
    const caseVarName = code ? `cmd_${idx++}` : 'null'
    argumentArgCodes.push(`  '${key}: :->${caseVarName}'`)

    if (code) {
      caseCodes.push(
        //
        `${caseVarName})`,
        [
          //
          ...ensureArray(code),
          ';;',
        ],
      )
    }
  }

  // code => name
  const nameFnMap: Record<string, string> = {}

  argumentArgCodes.push(
    ...params.map((param, idx) => {
      if (param.code?.length) {
        const codeStr = generateCode(param.code)
        const caseVarName = nameFnMap[codeStr] ?? `param_${idx}`

        if (!nameFnMap[codeStr]) {
          nameFnMap[codeStr] = caseVarName
          caseCodes.push(
            //
            `${caseVarName})`,
            [
              //
              ...param.code,
              ';;',
            ],
          )
        }

        return `  '${param.label}: :->${caseVarName}'`
      } else {
        return `  '${param.label}'`
      }
    }),
  )

  argumentArgCodes.push(`  && ret=0`)

  const codes: CodeLine = [
    ...warpLines([`_arguments -s -C`, ...argumentArgCodes]),
    '',
    `case $state in`,
    ...caseCodes,
    `esac`,
  ]

  return codes
}

/**
 *
 * refer: https://github.com/zsh-users/zsh-completions/blob/master/zsh-completions-howto.org#writing-your-own-completion-functions
 *
 * @param globalConf
 */
export function generateZshAutoCompletion(globalConf: Command) {
  const g = new ZshCodeGenerator(globalConf.name)

  const codes = _genCommandCodeByLine(g, globalConf)
  g.setMainFnCodes(codes)

  return g.generate()
}

function generateArgumentsBranches(g: ZshCodeGenerator, conf: Command, offset = 0) {
  const depth = calcCommandDepth(conf)
  return (conf.parameters || []).slice(offset).map((parameter, idx) => {
    const name = parameter.handleRestAll ? '*' : (idx + depth + offset).toString()
    const type = parameter.type

    if (!type) {
      return [name, null] as [string, CodeLine | null]
    }

    const code = g.generateAlternativeCodeFn({ type })

    return [name, code] as [string, CodeLine | null]
  })
}

function generateSkipArgumentsBranches(depth: number) {
  return Array(depth)
    .fill(0)
    .map((_, idx) => [(idx + 1).toString(), null] as [string, CodeLine | null])
}

function generateOptions(g: ZshCodeGenerator, conf: Command): ParamOption[] {
  const options: CmdOption[] = _getAllParentOptions(conf)
  const params: ParamOption[] = []

  if (!options) {
    return params
  }

  for (const opt of options) {
    const defaultValueDescription =
      opt.defaultValue != null ? ` @default is ${opt.defaultValue}` : ''

    const desc = `[${opt.description}${defaultValueDescription}]`

    const typeCode = opt.type ? g.generateAlternativeCodeFn({ type: opt.type }) : undefined

    if (opt.name) {
      params.push({
        label: `--${opt.name}${desc}`,
        code: typeCode ? [typeCode] : undefined,
      })
    }

    if (opt.alias) {
      params.push({
        label: `-${opt.alias}${desc}`,
        code: typeCode ? [typeCode] : undefined,
      })
    }
  }

  return params
}

function _genCommandCodeByLine(g: ZshCodeGenerator, conf: Command): CodeLine[] {
  const depth = calcCommandDepth(conf)

  if (!conf.commands?.length) {
    return _genCurrentCommandCode(g, conf)
  }

  const caseBranches = conf.commands.flatMap((subCmd) => {
    return [
      `${[subCmd.name, subCmd.alias].filter(isString).join('|')})`,
      [
        //
        ..._genCommandCodeByLine(g, subCmd),
        ';;',
      ],
    ]
  })

  const codes: CodeLine[] = [
    `case $line[${depth}] in`,
    ...caseBranches,
    '*)',
    [
      // fallback
      ..._genCurrentCommandCode(g, conf),

      ';;',
    ],
    `esac`,
  ]

  return generateArgumentsCode({
    branches: [['*', codes]],
  })
}
function _genCurrentCommandCode(g: ZshCodeGenerator, conf: Command): CodeLine[] {
  const depth = calcCommandDepth(conf)
  const hasSubCommands = conf.commands?.length

  const codes = generateArgumentsCode({
    branches: hasSubCommands
      ? [
          ...generateSkipArgumentsBranches(depth - 1),
          [depth.toString(), _generateFirstArgWithSubCommands()],
          ...generateArgumentsBranches(g, conf, 1),
        ]
      : [
          //
          ...generateSkipArgumentsBranches(depth - 1),
          ...generateArgumentsBranches(g, conf),
        ],
    params: generateOptions(g, conf),
  })

  return [g.createFn([conf.name], codes)]
  function _generateFirstArgWithSubCommands() {
    const subCommandDescriptions = (conf.commands || []).flatMap((cmd) => {
      const codes: string[] = []
      const d = `${escapeStr(cmd.name)}\\:${JSON.stringify(cmd.description || '')}`
      codes.push(d)

      if (cmd.alias) {
        const d = `${escapeStr(cmd.alias)}\\:${JSON.stringify(cmd.description || '')}`
        codes.push(d)
      }

      return codes
    })

    return g.generateAlternativeCodeFn({
      type: conf.parameters?.at(0)?.type,
      extraBranches: [`'sub-commands:sub-commands:((${subCommandDescriptions.join(' ')}))'`],
      namePrefixes: ['first_arg', ...getCommandPrefixes(conf)],
    })
  }
}

function _getAllParentOptions(conf: Command) {
  const options: CmdOption[] = []
  _visitCommandChain(conf, (cmd) => {
    const notExists = cmd.options?.filter(
      (o) => !options.find((opt) => opt.name === o.name || opt.alias === o.alias),
    )

    options.push(...(notExists || []))
  })

  return options
}

function _visitCommandChain(conf: Command, visitor: (conf: Command) => void) {
  let _conf: Command | undefined = conf
  while (_conf) {
    visitor(_conf)
    _conf = _conf.parent
  }
}

function isNativeZshType(type: string) {
  return type.startsWith('_')
}

function generateFnName(tokens: string[]) {
  return `_${tokens.join('_')}`
}

function generateCode(lines: CodeLine, indent = 0): string {
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

export function escapeStr(item: string) {
  return item.replaceAll(':', '\\:')
}

function generateTypeName(type: string) {
  const primaryType = type.split('|')[0]
  return isNativeZshType(primaryType) ? primaryType.slice(1) : primaryType
}

function calcCommandDepth(conf: Command) {
  let depth = 0
  let _conf: Command | undefined = conf

  while (_conf) {
    depth++
    _conf = _conf.parent
  }
  return depth
}

function getCommandPrefixes(conf: Command) {
  const names: string[] = []

  let _conf: Command | undefined = conf

  while (_conf) {
    names.push(_conf.name)
    _conf = _conf.parent
  }

  return names
}
