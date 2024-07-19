#!/usr/bin/env tsx

import { sliver, type ActionParsedArgs } from '../src'

const ins = sliver`
v1.0.0 @help @autocompletion

Silver [@type:type], is a library for create command line interface quickly. ${fn}

-t --test @test:t1, Test autocompletion.

up/upgrade <@test:dir> [...other] #stopEarly, an sub command. ${upFn}

-s --string @string:default, sub command option.
--small @bool, other option.
`

ins.type('test', ['t1', 't2', 't3:dev'])

ins.type('type', () => [...ins.typeMapper.keys()])

/**
 *
 * @param opt
 */
function fn(_params: string[], opt: ActionParsedArgs) {
  console.log(JSON.stringify(opt, null, 2))
}
function upFn(_params: string[], opt: ActionParsedArgs) {
  console.log('update action', _params)
}
