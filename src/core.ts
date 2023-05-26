import { Value } from '@0x-jerry/utils'
import { parseCliProgram } from './parse'
import { CliProgram } from './types'

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
}

export function sliver(raw: TemplateStringsArray, ...tokens: any[]) {
  const ins = new Sliver()

  ins.parse(raw, ...tokens)

  return ins
}
