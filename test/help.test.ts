import type { MockInstance } from 'vitest'
import { silver } from '../src'

describe('test help message', () => {
  const ins = silver`
v1.0.0 @autocomplete @manual

xx [@type:type], A library for create command line interface quickly.

-t --test @test, Test autocomplete.

up/upgrade <@test:dir> [...other] #stopEarly, an sub command.

-s --string @string, sub command option.
--small @bool, other option.
`

  const ctx = {
    logs: [] as any[],
    log: null as null | MockInstance<(...args: any[]) => void>,
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
