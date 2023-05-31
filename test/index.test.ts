import { sliver } from '../src/core'

describe('silver', () => {
  it('should parse cli description', () => {
    const defaultCustom = 'a2'
    const fn = vi.fn()

    const ins = sliver`@manual
commandName [dir], A library for create command line interface quickly. ${fn}

-s --string @string:cool, An string option with default value.
-n --number #global @number:123.34, an number option with default value, and it's a global option.
-e --enum @custom:${defaultCustom}, an custom option with default value.

-b --bool @bool, an boolean option without default value.
-o --other, an option without specify a type will be a string.

# aliasName/commandName
up/upgrade <dir> [...other] #stopEarly, an sub command. ${fn}

-s --string @string:default, sub command option.
-sm --small @bool:true, other option.
`

    expect(ins.conf).toMatchSnapshot()
  })

  it('should execute by default', () => {
    const fn = vi.fn()

    sliver`
x [dir], Test. ${fn}
`

    expect(fn).toBeCalledTimes(1)
  })

  it('should execute sub command', () => {
    const fn = vi.fn()

    const ins = sliver`
x [dir] #manual, Test.

sub, test command. ${fn}
`

    ins.execute(['sub', 'test'])

    expect(fn).toBeCalledTimes(1)
  })
})
