import { CmdOption, Command } from '../types'

/**
 *
 * refer: https://github.com/zsh-users/zsh-completions/blob/master/zsh-completions-howto.org#writing-your-own-completion-functions
 *
 * @param conf
 */
export function generateZshAutoCompletion(conf: Command) {
  const program = conf.name

  const functions = new Map<string, CodeLine[]>()

  const mainCodes: CodeLine[] = [
    `zstyle ':completion:*:*:bun:*' group-name ''`,
    `zstyle ':completion:*:*:bun-grouped:*' group-name ''`,
    `zstyle ':completion:*:*:bun::descriptions' format '%F{green}-- %d --%f'`,
    `zstyle ':completion:*:*:bun-grouped:*' format '%F{green}-- %d --%f'`,
    '',
    `typeset -A opt_args`,
    `local curcontext="$curcontext" state line context`,
    '',
    // todo, generate commands and options
    ...generateCommands(conf),
  ]

  const mainFnName = generateFnName([program])

  createFn(mainFnName, mainCodes)

  const lines: CodeLine[] = [
    //
    `#compdef ${program}`,
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

  function createFn(name: string, codes: CodeLine[]) {
    functions.set(name, [
      //
      `${name}() {`,
      codes,
      `}`,
    ])
    //
  }

  function generateCommands(conf: Command): CodeLine[] {
    // sub commands
    const names = conf.commands?.map((item) => item.name) || []

    if (!names.length) {
      return generateOptions(conf.options)
    }

    return [
      `_arguments -s \\`,
      [
        //
        `'1: :->cmd' \\`,
        `'*: :->args' &&`,
        `ret=0`,
      ],
      `case $state in`,
      `cmd)`,
      [
        //
        ...generateAllCommandNames(conf.commands),
        `;;`,
      ],
      `args)`,
      [
        `case $line[1] in`,
        ...(conf.commands || [])
          //
          ?.map((command) => generateSubCommand(conf.name, command))
          .flat(),
        `esac`,
        `;;`,
      ],
      `esac`,
    ]
  }

  function generateAllCommandNames(commands?: Command[]) {
    const codes: string[] = []

    if (!commands?.length) {
      return codes
    }

    for (const cmd of commands) {
      codes.push(`${cmd.name}\\:${JSON.stringify(cmd.description)} \\`)

      if (cmd.alias && cmd.alias !== cmd.name) {
        codes.push(`${cmd.alias}\\:${JSON.stringify(cmd.description)} \\`)
      }
    }

    const fnName = generateFnName(['commands'])

    // args:custom arg:((a\:"description a" b\:"description b" c\:"description c"))
    createFn(fnName, [`_alternative 'args:custom arg:((\\`, codes, `))'`])

    return [fnName]
  }

  function generateSubCommand(parentName: string, command: Command) {
    const codes = generateOptions(command.options)

    const fnName = generateFnName([parentName, command.name, 'option'])

    createFn(fnName, codes)

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

function generateOptions(options?: CmdOption[]): CodeLine[] {
  const codes: string[] = []

  if (!options) {
    return codes
  }

  for (const opt of options) {
    const defaultValue = opt.defaultValue != null ? ` @default is ${opt.defaultValue}` : ''

    const desc = `[${opt.description}${defaultValue}]`

    codes.push(`'--${opt.name}${desc}' \\`)

    if (opt.alias && opt.alias !== opt.name) {
      codes.push(`'-${opt.alias}${desc}' \\`)
    }
  }

  return [
    `_arguments -s -C \\`,
    [
      //
      `'1: :->null' \\`,
      `'*: :->null' \\`,
      ...codes,
      '&& ret=0',
    ],
  ]
}

function generateFnName(tokens: string[]) {
  return '_' + [...tokens].join('_')
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

type CodeLine = string | CodeLine[]
