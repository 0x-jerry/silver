import type { SpyInstance } from 'vitest'
import { sliver } from '../src'

describe('test help message', () => {
  const ins = sliver`
@help @autocompletion @manual

xx [@type:type], A library for create command line interface quickly.

-t --test @test:t1, Test autocompletion.

# aliasName/commandName
up/upgrade <@test:dir> [...other] #stopEarly, an sub command.

-s --string @string:default, sub command option.
-sm --small @bool, other option.
`

  const ctx = {
    logs: [] as any[],
    log: null as null | SpyInstance<any[], void>,
  }

  beforeEach(() => {
    ctx.logs = []

    ctx.log = vi.spyOn(console, 'log').mockImplementation((...msg: any) => {
      ctx.logs.push(...msg)
    })
  })
  afterEach(() => {
    ctx.log?.mockClear()
    ctx.logs = []
  })

  it('should print main help message', () => {
    ins.execute(['-h'])

    expect(ctx.logs).toMatchSnapshot()
  })

  it('should print sub command help message', () => {
    ins.execute(['up', '-h'])
    expect(ctx.logs).toMatchSnapshot()
  })
})
