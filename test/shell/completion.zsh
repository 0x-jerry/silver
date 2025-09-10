#compdef xx
_xx__type__string() {
  local -a list_0
  IFS=$'\n' list_0=($(SHELL=zsh xx completion string))
  _alternative \
  'string:string:(($list_0))'
}
_xx__type__bool() {
  local -a list_0
  IFS=$'\n' list_0=($(SHELL=zsh xx completion bool))
  _alternative \
  'bool:bool:(($list_0))'
}
_xx__type__number() {
  local -a list_0
  IFS=$'\n' list_0=($(SHELL=zsh xx completion number))
  _alternative \
  'number:number:(($list_0))'
}
_xx__type__custom() {
  local -a list_0
  IFS=$'\n' list_0=($(SHELL=zsh xx completion custom))
  _alternative \
  'custom:custom:(($list_0))'
}
_xx_upgrade() {
  _arguments -s -C \
    '1: :->null' \
    '2: :->null' \
    '*: :->null' \
    '--string[sub command option. @default is default]: :->param_0' \
    '-s[sub command option. @default is default]: :->param_0' \
    '--small[other option.]: :->param_2' \
    '--number[an number option with default value, and it is a global option. @default is 123]: :->param_3' \
    '-n[an number option with default value, and it is a global option. @default is 123]: :->param_3' \
    '--enum[an custom option with default value. @default is a2]: :->param_5' \
    '-e[an custom option with default value. @default is a2]: :->param_5' \
    '--bool[an boolean option without default value.]: :->param_2' \
    '-b[an boolean option without default value.]: :->param_2' \
    '--other[an option without specify a type will be a string.]' \
    '-o[an option without specify a type will be a string.]' \
    '--help[Print help text for command.]: :->param_2' \
    '-h[Print help text for command.]: :->param_2' &&
    ret=0
  
  case $state in
  param_0)
    _xx__type__string
    ;;
  param_2)
    _xx__type__bool
    ;;
  param_3)
    _xx__type__number
    ;;
  param_5)
    _xx__type__custom
    ;;
  esac
}
_xx_completion() {
  _arguments -s -C \
    '1: :->null' \
    '2: :->null' \
    '--install[Install autocompletion for zsh, not implement yet.]' \
    '--uninstall[Uninstall autocompletion for zsh, not implement yet.]' \
    '--string[An string option with default value. @default is cool]: :->param_2' \
    '-s[An string option with default value. @default is cool]: :->param_2' \
    '--number[an number option with default value, and it is a global option. @default is 123]: :->param_4' \
    '-n[an number option with default value, and it is a global option. @default is 123]: :->param_4' \
    '--enum[an custom option with default value. @default is a2]: :->param_6' \
    '-e[an custom option with default value. @default is a2]: :->param_6' \
    '--bool[an boolean option without default value.]: :->param_8' \
    '-b[an boolean option without default value.]: :->param_8' \
    '--other[an option without specify a type will be a string.]' \
    '-o[an option without specify a type will be a string.]' \
    '--help[Print help text for command.]: :->param_8' \
    '-h[Print help text for command.]: :->param_8' &&
    ret=0
  
  case $state in
  param_2)
    _xx__type__string
    ;;
  param_4)
    _xx__type__number
    ;;
  param_6)
    _xx__type__custom
    ;;
  param_8)
    _xx__type__bool
    ;;
  esac
}
_xx__type__test__files() {
  local -a list_0
  IFS=$'\n' list_0=($(SHELL=zsh xx completion test))
  _alternative \
  'test:test:(($list_0))' \
  'files:files:_files'
}
_xx_xx() {
  _arguments -s -C \
    '1: :->cmd_0' \
    '--string[An string option with default value. @default is cool]: :->param_0' \
    '-s[An string option with default value. @default is cool]: :->param_0' \
    '--number[an number option with default value, and it is a global option. @default is 123]: :->param_2' \
    '-n[an number option with default value, and it is a global option. @default is 123]: :->param_2' \
    '--enum[an custom option with default value. @default is a2]: :->param_4' \
    '-e[an custom option with default value. @default is a2]: :->param_4' \
    '--bool[an boolean option without default value.]: :->param_6' \
    '-b[an boolean option without default value.]: :->param_6' \
    '--other[an option without specify a type will be a string.]' \
    '-o[an option without specify a type will be a string.]' \
    '--help[Print help text for command.]: :->param_6' \
    '-h[Print help text for command.]: :->param_6' &&
    ret=0
  
  case $state in
  cmd_0)
    _xx__type__test__files
    ;;
  param_0)
    _xx__type__string
    ;;
  param_2)
    _xx__type__number
    ;;
  param_4)
    _xx__type__custom
    ;;
  param_6)
    _xx__type__bool
    ;;
  esac
}
_xx() {
  zstyle ':completion:*:*:xx:*' group-name ''
  zstyle ':completion:*:*:xx:*' descriptions 'yes'
  zstyle ':completion:*:*:xx:*' format '%F{green}-- %d --%f'
  
  local program=xx
  typeset -A opt_args
  
  case $line[1] in
  upgrade|up)
    _xx_upgrade
    ;;
  completion)
    _xx_completion
    ;;
  *)
    _xx_xx
    ;;
  esac
}

if ! command -v compinit >/dev/null; then
  autoload -U compinit && compinit
fi

compdef _xx xx