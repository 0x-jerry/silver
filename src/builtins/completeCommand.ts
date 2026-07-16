import { isString } from '@0x-jerry/utils'
import { escapeStr, generateZshAutoComplete } from '../completion/zsh'
import type { Sliver } from '../core'
import { parseCliProgram } from '../parser'

export const COMPLETE_COMMAND_NAME = 'complete'

export function createCompleteCommand(ins: Sliver) {
  const conf = parseCliProgram`
${COMPLETE_COMMAND_NAME} [type], Generate autocomplete for zsh.
--shell @shell, Shell script to generate, only support zsh.
  `

  ins.type('shell', ['zsh'])

  return {
    cmd: conf.command,
    action,
  }

  async function action(params: string[], opt: { shell?: boolean }) {
    if (opt.shell) {
      const zshCode = generateZshAutoComplete(ins.conf!.command)

      console.log(zshCode)
      return
    }

    const [type] = params

    if (!type) {
      return
    }

    const completions = await ins.getCompletion(type)

    const s = completions
      .map((item) => {
        return isString(item)
          ? escapeStr(item)
          : item.desc
            ? `${escapeStr(item.label)}\\:${item.desc}`
            : escapeStr(item.label)
      })
      .join('\n')
    process.stdout.write(s)
  }
}

export function generateCompleteCommandString(rootCmdName: string, type: string) {
  return `${rootCmdName} ${COMPLETE_COMMAND_NAME} ${type}`
}
