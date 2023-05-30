import { Value } from '@0x-jerry/utils'
import { parseCliProgram } from './parser'
import { CliProgram, ProgramFlag } from './types'
import minimist from 'minimist'

export class Sliver {
  conf?: CliProgram

  typeMapper = new Map<string, Value<string[]>>()

  parse(raw: TemplateStringsArray, ...tokens: any[]) {
    this.conf = parseCliProgram(raw, ...tokens)
  }

  type(name: string, getType: Value<string[]>) {
    this.typeMapper.set(name, getType)

    return this
  }

  execute(argv: string[]) {
    if (!this.conf) return

    // get all sub command names
    const commandMapper = this.conf.subCommands?.reduce((names, item) => {
      names.set(item.name, item)

      if (item.alias) {
        names.set(item.alias, item)
      }

      return names
    }, new Map<string, CliProgram>())

    let program = this.conf

    // if is sub command
    if (commandMapper?.has(argv[0])) {
      program = commandMapper.get(argv[0])!
      argv = argv.slice(1)
    }

    const args = minimist(argv, {
      stopEarly: !!program.flags?.includes(ProgramFlag.StopEarly),
    })

    // todo, validate required parameters
    program.action?.(args)
  }
}

export function sliver(raw: TemplateStringsArray, ...tokens: any[]) {
  const ins = new Sliver()

  ins.parse(raw, ...tokens)

  if (!ins.conf?.flags?.includes(ProgramFlag.Manual)) {
    const argv = process.argv.slice(2)
    ins.execute(argv)
  }

  return ins
}
