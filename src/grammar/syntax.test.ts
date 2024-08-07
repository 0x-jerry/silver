import { parseProgram } from './semantics'

describe('syntax', () => {
  it('parse program', () => {
    const content = `
v1.0.0 @help @autocompletion

xx [@type:type:t1], A library for create command line interface quickly.

-t --test @test:t1, Test autocompletion.

up/upgrade <@test:dir> [...other] #stopEarly, an sub command.

-s --string @string:default, sub command option.
--small @bool, other option.
    `

    expect(parseProgram(content)).toMatchSnapshot()
  })
})
