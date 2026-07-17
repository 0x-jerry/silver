import { parseCliProgram } from '../parser'
import type { Silver } from '../core'
import { runCompletion, formatOutput } from '../completion/engine'
import { generateZshRelay, generatePowerShellRelay } from '../completion/shells/index'

export const COMPLETE_COMMAND_NAME = 'complete'

export function createCompleteCommand(ins: Silver) {
  const conf = parseCliProgram`
${COMPLETE_COMMAND_NAME} [@shell:shell] [...args] #stopEarly, Generate shell completion script or handle completion requests.
  `

  ins.type('shell', ['zsh', 'powershell'])

  conf.command.action = '__complete__'

  return {
    cmd: conf.command,
    action,
  }

  async function action(params: string[]) {
    const [shell] = params

    if (shell) {
      const rootName = ins.conf!.command.name

      switch (shell) {
        case 'zsh':
          console.log(generateZshRelay(rootName, rootName))
          break
        case 'powershell':
          console.log(generatePowerShellRelay(rootName, rootName))
          break
        default:
          console.error(`Unsupported shell: ${shell}`)
          console.error('Supported shells: zsh, powershell')
          break
      }
      return
    }

    const rawArgs = extractRawCompletionArgs(process.argv)
    const output = await runCompletion(ins, rawArgs)
    process.stdout.write(formatOutput(output))
  }
}

function extractRawCompletionArgs(argv: string[]): string[] {
  const completeIdx = argv.indexOf(COMPLETE_COMMAND_NAME)
  if (completeIdx === -1) return []

  const afterComplete = argv.slice(completeIdx + 1)
  const separatorIdx = afterComplete.indexOf('--')

  if (separatorIdx === -1) return afterComplete
  return afterComplete.slice(separatorIdx + 1)
}
