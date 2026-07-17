import Mustache from 'mustache'
import zshTemplate from './templates/complete.zsh?raw'
import powershellTemplate from './templates/complete.ps1?raw'

export function generateZshRelay(name: string, execCmd: string): string {
  return Mustache.render(zshTemplate, { name, execCmd })
}

export function generatePowerShellRelay(name: string, execCmd: string): string {
  const safeName = name.replace(/[-:]/g, '_')
  return Mustache.render(powershellTemplate, { name, execCmd, safeName })
}
