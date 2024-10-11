import { textTableToString } from '@0x-jerry/utils'
import type { CmdParameter, Command, Program } from '../types'
import pc from 'picocolors'

export function generateHelpMsg(conf: Command, program: Program) {
  const msgs: string[] = []

  const commandName = getCommandName(conf)

  const commandVersion = program.version ? `/${program.version}` : ''
  const commandDescription = `${commandName}${pc.dim(commandVersion)} ${conf.description}`
  msgs.push(commandDescription, '')

  const hasCommand = conf.commands?.length ? '<command>' : ''
  const programCommandName =
    program.command === conf ? commandName : `${program.command.name} ${commandName}`
  const argsHelpMsg = conf.parameters?.map((n) => parameterDescription(n)).join(' ')
  const usage = `Usage: ${programCommandName} ${hasCommand} [...options] ${argsHelpMsg}`.trim()

  msgs.push(pc.bold(usage), '')

  if (conf.commands?.length) {
    msgs.push(pc.bold('Commands:'), '')

    const commands = conf.commands.map((item) => {
      const cmdArgsHelpMsg = item.parameters?.map((n) => parameterDescription(n)).join(' ') || '  '

      return [getCommandName(item), pc.dim(` ${cmdArgsHelpMsg} `), item.description]
    })

    const s = textTableToString(commands)
    msgs.push(s, '')
  }

  if (conf.options?.length) {
    msgs.push(pc.bold('Options:'), '')

    const options = conf.options.map((item) => {
      const names = [pc.dim(item.alias ? `-${item.alias}` : ''), pc.cyan(`--${item.name}`)]

      const optType =
        [item.type && `@${item.type}`, item.defaultValue].filter(Boolean).join(':') || '  '

      return [...names, pc.dim(` ${optType} `), item.description]
    })

    const s = textTableToString(options)

    msgs.push(s, '')
  }

  return msgs.join('\n')
}

function parameterDescription(parameter: CmdParameter) {
  const { required = false, handleRestAll, name, type, defaultValue } = parameter

  const _name = [type ? `@${type}` : '', name, defaultValue].filter(Boolean).join(':')

  if (required) {
    return handleRestAll ? `<...${_name}>` : `<${_name}>`
  }

  return handleRestAll ? `[...${_name}]` : `[${_name}]`
}

function getCommandName(cmd: Command) {
  const str = pc.magenta(cmd.name) + (cmd.alias ? pc.dim(`(${cmd.alias})`) : '')

  return str
}
