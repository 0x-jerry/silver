import type { Silver } from '../core'
import type { CmdOption, Command } from '../types'
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

type CompletionType = Array<string | { label: string; desc?: string }>

// --- Entry points ---

export async function runCompletion(
  ins: Silver,
  argv: string[],
): Promise<CompletionOutput> {
  if (!ins.conf) return { groups: [] }

  const completing = argv.length > 0 && argv[argv.length - 1] === ''
  if (completing) argv = argv.slice(0, -1)

  const current = argv[argv.length - 1] || ''
  const { command, positionalCount } = resolveCommand(ins.conf.command, argv)

  const ctx: CompletionContext = {
    command,
    completing,
    current,
    positionalCount,
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

export function formatOutput(output: CompletionOutput): string {
  return output.groups
    .flatMap((g) => [`##${g.name}`, ...g.values])
    .join('\n')
}

// --- Command resolution ---

function resolveCommand(program: Command, argv: string[]) {
  const positionalArgs = stripOptions(argv, program)
  let command = program

  for (const arg of positionalArgs) {
    const sub = command.commands?.find((c) => c.name === arg || c.alias === arg)
    if (sub) {
      command = sub
    } else {
      return { command, positionalCount: positionalArgs.length }
    }
  }

  return { command, positionalCount: positionalArgs.length }
}

function stripOptions(argv: string[], command: Command): string[] {
  const result: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('-')) {
      const opt = findOption(command, arg)
      if (opt && !isBooleanType(opt)) i++
    } else {
      result.push(arg)
    }
  }
  return result
}

// --- Option helpers ---

function collectOptions(command: Command): CmdOption[] {
  const options: CmdOption[] = []
  let cmd: Command | undefined = command
  while (cmd) {
    if (cmd.options) options.push(...cmd.options)
    cmd = cmd.parent
  }
  return options
}

function findOption(command: Command, flag: string): CmdOption | undefined {
  const cleanFlag = flag.replace(/=.*$/, '')
  return collectOptions(command).find((o) =>
    (o.name && cleanFlag === `--${o.name}`) ||
    (o.alias && cleanFlag === `-${o.alias}`),
  )
}

function isBooleanType(opt: CmdOption): boolean {
  if (!opt.type) return true
  return opt.type.split('|').some((t) => t === 'bool' || t === 'boolean')
}

// --- Completion ---

async function completeFlags(ctx: CompletionContext): Promise<CompletionGroup[]> {
  const { command, completing, current, getType } = ctx
  const eqIdx = current.indexOf('=')

  if (eqIdx !== -1) {
    const opt = findOption(command, current.slice(0, eqIdx))
    return opt?.type ? resolveTypeGroups(opt.type, getType, current.slice(0, eqIdx)) : []
  }

  if (completing) {
    const opt = findOption(command, current)
    if (opt && !isBooleanType(opt) && opt.type) {
      return resolveTypeGroups(opt.type, getType)
    }
  }

  return [flagNamesGroup(command)]
}

async function completeNonFlags(ctx: CompletionContext): Promise<CompletionGroup[]> {
  const { command, completing, current } = ctx
  const groups: CompletionGroup[] = []

  if (command.commands?.length) {
    groups.push(subcommandsGroup(command))
  }

  const flags = flagNamesGroup(command)
  if (flags.values.length > 0) groups.push(flags)

  const isCompletingCommandWord =
    !completing && (
      current === command.name || current === command.alias ||
      command.commands?.some((c) => c.name.startsWith(current) || c.alias?.startsWith(current))
    )

  if (isCompletingCommandWord) return groups

  groups.push(...await completePositional(ctx))
  return groups
}

function subcommandsGroup(command: Command): CompletionGroup {
  const values = (command.commands || []).flatMap((sub) => {
    const entries = [formatItem(sub.name, sub.description)]
    if (sub.alias) entries.push(formatItem(sub.alias, sub.description))
    return entries
  })
  return { name: 'commands', values }
}

function flagNamesGroup(command: Command): CompletionGroup {
  const flags: string[] = []
  const seen = new Set<string>()

  for (const opt of collectOptions(command)) {
    if (opt.name) {
      const flag = `--${opt.name}`
      if (!seen.has(flag)) {
        seen.add(flag)
        flags.push(formatItem(flag, opt.description))
      }
    }
    if (opt.alias) {
      const flag = `-${opt.alias}`
      if (!seen.has(flag)) {
        seen.add(flag)
        flags.push(formatItem(flag, opt.description))
      }
    }
  }

  return { name: 'options', values: flags }
}

async function completePositional(ctx: CompletionContext): Promise<CompletionGroup[]> {
  const { command, positionalCount, completing, getType } = ctx
  const params = command.parameters || []
  if (params.length === 0) return []

  const idx = completing ? positionalCount : Math.max(0, positionalCount - 1)
  const restIdx = params.findIndex((p) => p.handleRestAll)
  const paramIdx = restIdx >= 0 && restIdx <= idx ? restIdx : idx
  const param = params[paramIdx]

  return param?.type ? resolveTypeGroups(param.type, getType) : []
}

// --- Type resolution ---

async function resolveTypeGroups(
  typeStr: string,
  getType: (type: string) => Promise<CompletionType>,
  prefix?: string,
): Promise<CompletionGroup[]> {
  const parts = typeStr.split('|')
  const customTypes = parts.filter((t) => !t.startsWith('_'))
  const builtinTypes = parts.filter((t) => t === BuiltinType.File || t === BuiltinType.Dir)

  const groups: CompletionGroup[] = []

  if (customTypes.length > 0) {
    const values: string[] = []
    for (const type of customTypes) {
      const items = await getType(type)
      for (const item of items) {
        const v = typeof item === 'string' ? item : formatItem(item.label, item.desc)
        values.push(prefix ? `${prefix}=${v}` : v)
      }
    }
    if (values.length > 0) {
      groups.push({ name: customTypes[0], values })
    }
  }

  for (const type of builtinTypes) {
    groups.push({ name: type, values: [] })
  }

  return groups
}

// --- Formatting ---

function formatItem(value: string, description?: string): string {
  return description ? `${value}\t${description}` : value
}
