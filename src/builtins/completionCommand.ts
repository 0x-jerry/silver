import { isString } from '@0x-jerry/utils'
import { generateZshAutoCompletion, normalizeStr } from '../completion/zsh'
import type { Sliver } from '../core'
import { parseCliProgram } from '../parser'

export function createCompletionCommand(ins: Sliver) {
  const conf = parseCliProgram`
completion [type], Generate autocompletion for zsh.

--install, Install autocompletion for zsh, not implement yet.
--uninstall, Uninstall autocompletion for zsh, not implement yet.
  `

  conf.command.action = 'completion'

  return {
    cmd: conf.command,
    action,
  }

  async function action(params: string[], opt: { install?: boolean; uninstall?: boolean }) {
    const [type] = params

    if (type) {
      const completions = await ins.getCompletion(type)

      const s = completions
        .map((item) => {
          return isString(item)
            ? normalizeStr(item)
            : item.desc
              ? `${normalizeStr(item.label)}\\:${item.desc}`
              : normalizeStr(item.label)
        })
        .join('\n')
      process.stdout.write(s)
      return
    }

    if (opt.install) {
      return
    }

    if (opt.uninstall) {
      return
    }

    if (ins.conf?.command) {
      const zshCode = generateZshAutoCompletion(ins.conf?.command)

      console.log(zshCode)
    }
  }
}
