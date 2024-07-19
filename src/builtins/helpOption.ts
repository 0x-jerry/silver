import { textTableToString } from '@0x-jerry/utils'
import type { Command } from '../types'

export function generateHelpMsg(conf: Command) {
  const msgs: string[] = []

  const usageDescription = conf.commands?.length ? `[COMMAND] [OPTIONS]` : `[OPTIONS]`

  const composeAlias = (cmd: Command) => [cmd.alias, cmd.name].filter(Boolean).join('/')
  const usage = `${composeAlias(conf)} ${usageDescription} ${conf.description}`

  msgs.push(usage, '')

  if (conf.commands?.length) {
    const commands = conf.commands.map((item) => [composeAlias(item), item.description])

    const s = textTableToString(commands)
    msgs.push(s, '')
  }

  if (conf.options?.length) {
    const options = conf.options.map((item) => {
      const name =
        item.alias && item.alias !== item.name ? `--${item.name} -${item.alias}` : `--${item.name}`
      return [name, item.description]
    })

    const s = textTableToString(options)
    msgs.push(s, '')
  }

  return msgs.join('\n')
}
