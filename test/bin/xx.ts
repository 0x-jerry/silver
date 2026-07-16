#!/usr/bin/env bun

import { sliver } from '../../src'

const ins = sliver`
v1.0.0 @help @autocomplete

xx [@xx|_files:test] [@xx:a2] [...@xx|_files:files], is a library for create command line interface quickly. ${fn}

-t --test @arg|_files, Test autocomplete.

up/upgrade <@up|_files:dir> [...@up|_files:other] #stopEarly, an sub command. ${upFn}

-s --string @string, sub command option.
--small, other option.
`

ins.type('xx', ['x1', 'x2', 'x3:dev'])
ins.type('up', ['up1', 'up2', 'up3:dev'])

ins.type('arg', () => [...ins.typeMapper.keys()])

/**
 *
 * @param opt
 */
function fn(_params: string[], opt: unknown) {
  console.log(JSON.stringify(opt, null, 2))
}

function upFn(_params: string[]) {
  console.log('update action', _params)
}
