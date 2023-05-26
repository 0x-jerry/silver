import { createAutoIncrementGenerator, isPrimitive } from '@0x-jerry/utils'
import { CliConf } from './types'

const nextId = createAutoIncrementGenerator('$x@x$')

export function defineCli(raw: TemplateStringsArray, ...tokens: any[]): CliConf {
  const tokenMapper = new Map<string, any>()
  const tokenIdMapper = new Map<any, string>()

  tokens.forEach((token) => {
    if (isPrimitive(token)) {
      return
    }

    const id = nextId()
    tokenMapper.set(id, token)
    tokenIdMapper.set(token, id)
  })

  const finalStr = raw.reduce((pre, cur, idx) => {
    const token = tokens[idx]

    const tokenId = tokenIdMapper.get(token)

    return pre + cur + (tokenId ? `-${tokenId}-` : token ?? '')
  }, '')

  let appCli: CliConf | null = null

  const lines = finalStr.trim().split('\n+')

  lines.forEach((line) => {
    line = line.trim()

    // skip blank string
    if (!line) return

    if (line.startsWith('-')) {
      // is an option description
    } else {
      // is a cli description
    }
  })

  if (!appCli) throw new Error('Parse CLI description failed!')

  return appCli
}
