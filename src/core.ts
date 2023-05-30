import { Value } from '@0x-jerry/utils'
import { parseCliProgram } from './parser'
import { CliProgram } from './types'
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
    const args = argv.slice(2)

    minimist(args)
  }
}

export function sliver(raw: TemplateStringsArray, ...tokens: any[]) {
  const ins = new Sliver()

  ins.parse(raw, ...tokens)

  return ins
}
