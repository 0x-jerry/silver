// export function sliver() {}

import { defineCli } from './parse'

export class Sliver {}

export function sliver(raw: TemplateStringsArray, ...tokens: any[]) {
  const str = defineCli(raw, ...tokens)

  console.log(str)

  // console.log(raw, tokens)
  // return ''

  return {
    type(name: string, getType: () => string[]) {},
  }
}

const defaultCustom = 'a2'

const ins = sliver`
commandName, A library for create command line interface quickly. ${command}

-s --string @string:cool, An string option with default value.
-n --number #global @number:123.34, an number option with default value, and it's a global option.
-e --enum @custom:${defaultCustom}, an custom option with default value.

-b --bool @bool, an boolean option without default value.
-o --other, an option without specify a type will be a string.

subCommandName, an sub command. ${runGh}

-s --string @string:default, sub command option.
-sm --small @bool:true, other option.
`

ins.type('custom', () => ['a1', 'a2', 'a3'])

interface Option {
  string: string
  number: number
  enum: string

  bool?: boolean
  other?: string
}

function command(params: Option) {
  console.log(params)
}

function runGh() {
  console.log('cool gh')
}
