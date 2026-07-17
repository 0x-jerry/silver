# dot-source this script to test PowerShell auto completion
# . .\test\test-pwsh-completion.ps1
$env:PATH = "$PSScriptRoot\bin;$env:PATH"
Invoke-Expression (xx complete powershell | Out-String)
