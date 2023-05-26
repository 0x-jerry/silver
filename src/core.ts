import { parseCliProgram } from './parse'
import { CliProgram } from './types'

export class Sliver {
  conf?: CliProgram

  parse(raw: TemplateStringsArray, ...tokens: any[]) {
    this.conf = parseCliProgram(raw, ...tokens)
  }

  type(name: string, getType: () => string[]) {
    return this
  }
}

export function sliver(raw: TemplateStringsArray, ...tokens: any[]) {
  const ins = new Sliver()

  ins.parse(raw, ...tokens)

  return ins
}
