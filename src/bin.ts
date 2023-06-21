#!/usr/bin/env tsx

import { sliver } from '.'
import type { ActionParsedArgs } from './types'

const ins = sliver`
@help @autocompletion

xx [type:type], A library for create command line interface quickly. ${fn}

-t --test @test:t1, Test autocompletion.

# aliasName/commandName
up/upgrade <dir> [...other] #stopEarly, an sub command. ${fn}

-s --string @string:default, sub command option.
-sm --small @bool, other option.
`

ins.type('test', ['t1', 't2', 't3'])

ins.type('type', () => [...ins.typeMapper.keys()])

/**
 *
 * @param opt
 */
function fn(_params: string[], opt: ActionParsedArgs) {
  console.log(JSON.stringify(opt, null, 2))
}
