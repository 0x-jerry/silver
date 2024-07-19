import { textTableToString } from '@0x-jerry/utils'
import type { Command, Program } from '../types'
import pc from 'picocolors'

export function generateHelpMsg(conf: Command, program: Program) {
  const msgs: string[] = []

  const commandName = getCommandName(conf)

  const commandVersion = program.version ? `/${program.version}` : ''
  const commandDescription = `${pc.bold(pc.cyan(commandName + commandVersion))} ${conf.description}`
  msgs.push(commandDescription, '')

  const hasCommand = conf.commands?.length ? '<command>' : ''
  const usage = `Usage: ${commandName} ${hasCommand} [...flags] [...args]`

  msgs.push(pc.bold(usage), '')

  if (conf.commands?.length) {
    msgs.push(pc.bold('Commands:'), '')

    const commands = conf.commands.map((item) => [getCommandName(item), '    ', item.description])

    const s = textTableToString(commands)
    msgs.push(s, '')
  }

  if (conf.options?.length) {
    msgs.push(pc.bold('Options:'), '')

    const options = conf.options.map((item) => {
      const names = [`--${item.name}`, item.alias ? `-${item.alias}` : '']

      return [...names, '    ', item.description]
    })

    const s = textTableToString(options)

    msgs.push(s, '')
  }

  return msgs.join('\n')
}

function getCommandName(cmd: Command, min_width?: number) {
  const str = [cmd.alias, cmd.name].filter(Boolean).join('/')

  return min_width ? str.padEnd(min_width, ' ') : str
}
