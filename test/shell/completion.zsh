#compdef commandName

_commands() {
  _alternative 'args:custom arg:((\
    upgrade\:"an sub command." \
    up\:"an sub command." \
  ))'
}
_commandName_upgrade_option() {
  _arguments -s -C \
    '1: :->null' \
    '*: :->null' \
    '--string[sub command option. @default is default]' \
    '-s[sub command option. @default is default]' \
    '--small[other option. @default is false]' \
    '-sm[other option. @default is false]' \
    && ret=0
}
_commandName() {
  zstyle ':completion:*:*:bun:*' group-name ''
  zstyle ':completion:*:*:bun-grouped:*' group-name ''
  zstyle ':completion:*:*:bun::descriptions' format '%F{green}-- %d --%f'
  zstyle ':completion:*:*:bun-grouped:*' format '%F{green}-- %d --%f'
  
  typeset -A opt_args
  local curcontext="$curcontext" state line context
  
  _arguments -s \
    '1: :->cmd' \
    '*: :->args' &&
    ret=0
  case $state in
  cmd)
    _commands
    ;;
  args)
    case $line[1] in
    up|upgrade)
      _commandName_upgrade_option
      ;;
    esac
    ;;
  esac
}

if ! command -v compinit >/dev/null; then
  autoload -U compinit && compinit
fi

compdef _commandName commandName