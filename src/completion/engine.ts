import type { Silver } from '../core'
import type { CmdOption, Command, CompletionType } from '../types'
import { BuiltinType } from './builtinTypes'

export interface CompletionGroup {
  name: string
  values: string[]
}

export interface CompletionOutput {
  groups: CompletionGroup[]
}

interface CompletionContext {
  command: Command
  completing: boolean
  current: string
  positionalCount: number
  getType: (type: string) => Promise<CompletionType>
}

export async function runCompletion(
  ins: Silver,
  argv: string[],
): Promise<CompletionOutput> {
  const completing = argv.length > 0 && argv[argv.length - 1] === ''
  if (completing) {
    argv = argv.slice(0, -1)
  }

  const current = argv[argv.length - 1] || ''
  const { command, positionalArgs } = matchCommand(ins.conf!.command, argv)

  const ctx: CompletionContext = {
    command,
    completing,
    current,
    positionalCount: positionalArgs.length,
    getType: (type) => ins.getCompletion(type),
  }

  const groups = current.startsWith('-')
    ? await completeFlags(ctx)
    : await completeNonFlags(ctx)

  return {
    groups: groups.filter(
      (g) => g.values.length > 0 || g.name === BuiltinType.File || g.name === BuiltinType.Dir,
    ),
  }
}

function matchCommand(
  program: Command,
  argv: string[],
): { command: Command; positionalArgs: string[] } {
  let command = program
  const stripped = stripOptions(argv, command)
  const positionalArgs: string[] = []

  for (const arg of stripped) {
    if (command.commands?.length) {
      const sub = command.commands.find((c) => c.name === arg || c.alias === arg)
      if (sub) {
        command = sub
        continue
      }
    }
    positionalArgs.push(arg)
  }

  return { command, positionalArgs }
}

function stripOptions(argv: string[], command: Command): string[] {
  const result: string[] = []
  let i = 0
  while (i < argv.length) {
    const arg = argv[i]
    if (arg.startsWith('-')) {
      const opt = findOption(command, arg)
      if (opt && !isBooleanType(opt)) {
        i++
      }
    } else {
      result.push(arg)
    }
    i++
  }
  return result
}

function findOption(command: Command, flag: string): CmdOption | undefined {
  const cleanFlag = flag.replace(/=.*$/, '')
  let cmd: Command | undefined = command
  while (cmd) {
    const opt = cmd.options?.find((o) => {
      if (o.name && cleanFlag === `--${o.name}`) return true
      if (o.alias && cleanFlag === `-${o.alias}`) return true
      return false
    })
    if (opt) return opt
    cmd = cmd.parent
  }
  return undefined
}

function isBooleanType(opt: CmdOption): boolean {
  if (!opt.type) return true
  return opt.type.split('|').some((t) => t === 'bool' || t === 'boolean')
}

async function completeFlags(ctx: CompletionContext): Promise<CompletionGroup[]> {
  const { command, completing, current, getType } = ctx
  const eqIdx = current.indexOf('=')

  if (eqIdx === -1) {
    if (completing) {
      const opt = findOption(command, current)
      if (opt && !isBooleanType(opt) && opt.type) {
        return groupsFromType(opt.type, getType)
      }
    }
    return [completeFlagNames(command)]
  }

  const flagPart = current.slice(0, eqIdx)
  const opt = findOption(command, flagPart)
  if (!opt?.type) return []

  return groupsFromType(opt.type, getType, flagPart)
}

async function completeNonFlags(ctx: CompletionContext): Promise<CompletionGroup[]> {
  const { command, completing, current } = ctx
  const groups: CompletionGroup[] = []

  if (command.commands?.length) {
    groups.push(completeSubcommands(command))
  }

  const flagsGroup = completeFlagNames(command)
  if (flagsGroup.values.length > 0) {
    groups.push(flagsGroup)
  }

  if (!completing) {
    if (command.name === current || command.alias === current) {
      return groups
    }
    if (command.commands?.some((c) => c.name.startsWith(current) || (c.alias && c.alias.startsWith(current)))) {
      return groups
    }
  }

  const positionalGroups = await completePositional(ctx)
  groups.push(...positionalGroups)

  return groups
}

function completeSubcommands(command: Command): CompletionGroup {
  const values: string[] = []
  for (const sub of command.commands || []) {
    values.push(formatCompletion(sub.name, sub.description))
    if (sub.alias) {
      values.push(formatCompletion(sub.alias, sub.description))
    }
  }
  return { name: 'commands', values }
}

function completeFlagNames(command: Command): CompletionGroup {
  const flags: string[] = []
  const seen = new Set<string>()
  let cmd: Command | undefined = command

  while (cmd) {
    for (const opt of cmd.options || []) {
      if (opt.name) {
        const flag = `--${opt.name}`
        if (!seen.has(flag)) {
          seen.add(flag)
          flags.push(formatCompletion(flag, opt.description))
        }
      }
      if (opt.alias) {
        const flag = `-${opt.alias}`
        if (!seen.has(flag)) {
          seen.add(flag)
          flags.push(formatCompletion(flag, opt.description))
        }
      }
    }
    cmd = cmd.parent
  }

  return { name: 'options', values: flags }
}

async function completePositional(ctx: CompletionContext): Promise<CompletionGroup[]> {
  const { command, positionalCount, completing, getType } = ctx
  const params = command.parameters || []
  if (params.length === 0) return []

  const idx = completing ? positionalCount : Math.max(0, positionalCount - 1)

  let paramIndex = -1
  for (let i = 0; i < params.length; i++) {
    if (params[i].handleRestAll || i === idx) {
      paramIndex = i
      break
    }
  }

  const param = paramIndex >= 0 ? params[paramIndex] : undefined
  if (!param?.type) return []

  return groupsFromType(param.type, getType)
}

async function groupsFromType(
  typeStr: string,
  getType: (type: string) => Promise<CompletionType>,
  prefix?: string,
): Promise<CompletionGroup[]> {
  const types = typeStr.split('|')
  const groups: CompletionGroup[] = []

  const values = await resolveType(typeStr, getType)
  if (values.length > 0) {
    const mapped = prefix ? values.map((v) => `${prefix}=${v}`) : values
    groups.push({ name: primaryTypeName(types), values: mapped })
  }

  for (const type of types) {
    if (type === BuiltinType.File || type === BuiltinType.Dir) {
      groups.push({ name: type, values: [] })
    }
  }

  return groups
}

function primaryTypeName(types: string[]): string {
  for (const type of types) {
    if (!type.startsWith('_')) return type
  }
  return types[0]
}

async function resolveType(
  typeStr: string,
  getType: (type: string) => Promise<CompletionType>,
): Promise<string[]> {
  const values: string[] = []

  for (const type of typeStr.split('|')) {
    if (type.startsWith('_')) continue

    const result = await getType(type)

    for (const item of result) {
      values.push(typeof item === 'string' ? item : formatCompletion(item.label, item.desc))
    }
  }

  return values
}

function formatCompletion(value: string, description?: string): string {
  return description ? `${value}\t${description}` : value
}

export function formatOutput(output: CompletionOutput): string {
  const lines: string[] = []
  for (const group of output.groups) {
    lines.push(`##${group.name}`)
    lines.push(...group.values)
  }
  return lines.join('\n')
}
