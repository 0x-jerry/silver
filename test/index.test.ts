import { sleep } from '@0x-jerry/utils'
import { generateZshAutoCompletion } from '../src/completion/zsh'
import { sliver } from '../src/core'

describe('silver', () => {
  it('should parse cli description', () => {
    const defaultCustom = 'a2'
    const fn = vi.fn()

    const ins = sliver`
@manual @autocompletion

commandName [dir], A library for create command line interface quickly. ${fn}

-s --string @string:cool, An string option with default value.
-n --number @number:123, an number option with default value, and it's a global option.
-e --enum @custom:${defaultCustom}, an custom option with default value.

-b --bool @bool, an boolean option without default value.
-o --other, an option without specify a type will be a string.

up/upgrade <dir> [...other] #stopEarly, an sub command. ${fn}

-s --string @string:default, sub command option.
--small @bool:true, other option.
`

    expect(ins.conf).toMatchSnapshot()
  })

  it('should execute by default', async () => {
    const fn = vi.fn()

    sliver`
x [dir], Test. ${fn}
`

    await sleep()
    expect(fn).toBeCalledTimes(1)
  })

  it('should execute sub command', async () => {
    const fn = vi.fn()

    const ins = sliver`
x [dir], Test.

sub, test command. ${fn}
`

    ins.execute(['sub', 'test'])

    expect(fn).toBeCalledTimes(1)
  })

  it('should generate zsh code', () => {
    const defaultCustom = 'a2'
    const fn = vi.fn()

    const ins = sliver`
@manual @autocompletion

xx [dir], A library for create command line interface quickly. ${fn}

-s --string @string:cool, An string option with default value.
-n --number @number:123, an number option with default value, and it is a global option.
-e --enum @custom:${defaultCustom}, an custom option with default value.

-b --bool @bool, an boolean option without default value.
-o --other, an option without specify a type will be a string.

up/upgrade <dir> [...other] #stopEarly, an sub : command. ${fn}

-s --string @string:default, sub command option.
--small @bool, other option.
`

    const code = generateZshAutoCompletion(ins.conf!.command)

    expect(code).toMatchFileSnapshot(`shell/completion.zsh`)
  })
})
