import { isPrimitive } from '@0x-jerry/utils'
import { type Program, type CmdAction, type Command } from './types'
import { parseProgram } from './grammar'

let id = 0

const nextId = () => {
  return `__#${id++}#__`
}

const ActionTokenRE = /__#\d+#__\s*$/

export function parseCliProgram(raw: TemplateStringsArray, ...tokens: any[]): Program {
  const actionMapper = new Map<string, CmdAction>()
  const actionIdMapper = new Map<Function, string>()

  tokens.forEach((token) => {
    if (isPrimitive(token)) {
      return
    }

    // skip if exists
    if (actionIdMapper.has(token)) {
      return
    }

    const id = nextId()
    actionMapper.set(id, token)
    actionIdMapper.set(token, id)
  })

  const finalStr = raw.reduce((pre, cur, idx) => {
    const token = tokens[idx]

    const tokenId = actionIdMapper.get(token)

    return pre + cur + (tokenId ? `${tokenId}` : token ?? '')
  }, '')

  const conf = parseProgram(finalStr)

  conf.actions = actionMapper

  updateCommandAction(conf.command)

  conf.command.commands?.forEach((command) => {
    updateCommandAction(command)
  })

  return conf

  function updateCommandAction(command: Command) {
    if (!command.description) {
      return
    }

    command.description = command.description.replace(ActionTokenRE, (key) => {
      command.action = key
      return ''
    })
  }
}
