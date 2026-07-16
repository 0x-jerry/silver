#compdef xx
_xx__type__string() {
  local -a list_0
  IFS=$'\n' list_0=($(SHELL=zsh xx complete string))
  _alternative \
  'string:string:(($list_0))'
}
_xx__type__bool() {
  local -a list_0
  IFS=$'\n' list_0=($(SHELL=zsh xx complete bool))
  _alternative \
  'bool:bool:(($list_0))'
}
_xx__type__number() {
  local -a list_0
  IFS=$'\n' list_0=($(SHELL=zsh xx complete number))
  _alternative \
  'number:number:(($list_0))'
}
_xx__type__custom() {
  local -a list_0
  IFS=$'\n' list_0=($(SHELL=zsh xx complete custom))
  _alternative \
  'custom:custom:(($list_0))'
}
_xx_upgrade() {
  _arguments -s -C \
    '1: :->null' \
    '2: :->null' \
    '*: :->null' \
    '--string[sub command option.]: :->param_0' \
    '-s[sub command option.]: :->param_0' \
    '--small[other option.]: :->param_2' \
    '--number[an number option with default value, and it is a global option.]: :->param_3' \
    '-n[an number option with default value, and it is a global option.]: :->param_3' \
    '--enum[an custom option with default value.]: :->param_5' \
    '-e[an custom option with default value.]: :->param_5' \
    '--bool[an boolean option without default value.]: :->param_2' \
    '-b[an boolean option without default value.]: :->param_2' \
    '--other[an option without specify a type will be a string.]' \
    '-o[an option without specify a type will be a string.]' \
    '--help[Print help text for command.]: :->param_2' \
    '-h[Print help text for command.]: :->param_2' \
    && ret=0
  
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
_xx__type__shell() {
  local -a list_0
  IFS=$'\n' list_0=($(SHELL=zsh xx complete shell))
  _alternative \
  'shell:shell:(($list_0))'
}
_xx_complete() {
  _arguments -s -C \
    '1: :->null' \
    '2: :->null' \
    '--shell[Shell script to generate, only support zsh.]: :->param_0' \
    '--string[An string option with default value.]: :->param_1' \
    '-s[An string option with default value.]: :->param_1' \
    '--number[an number option with default value, and it is a global option.]: :->param_3' \
    '-n[an number option with default value, and it is a global option.]: :->param_3' \
    '--enum[an custom option with default value.]: :->param_5' \
    '-e[an custom option with default value.]: :->param_5' \
    '--bool[an boolean option without default value.]: :->param_7' \
    '-b[an boolean option without default value.]: :->param_7' \
    '--other[an option without specify a type will be a string.]' \
    '-o[an option without specify a type will be a string.]' \
    '--help[Print help text for command.]: :->param_7' \
    '-h[Print help text for command.]: :->param_7' \
    && ret=0
  
  case $state in
  param_0)
    _xx__type__shell
    ;;
  param_1)
    _xx__type__string
    ;;
  param_3)
    _xx__type__number
    ;;
  param_5)
    _xx__type__custom
    ;;
  param_7)
    _xx__type__bool
    ;;
  esac
}
_xx__type__first_arg_xx_test__files() {
  local -a list_0
  IFS=$'\n' list_0=($(SHELL=zsh xx complete test))
  _alternative \
  'sub-commands:sub-commands:((upgrade\:"an sub : command. " up\:"an sub : command. " complete\:"Generate autocomplete for zsh."))' \
  'test:test:(($list_0))' \
  'files:files:_files'
}
_xx_xx() {
  _arguments -s -C \
    '1: :->cmd_0' \
    '--string[An string option with default value.]: :->param_0' \
    '-s[An string option with default value.]: :->param_0' \
    '--number[an number option with default value, and it is a global option.]: :->param_2' \
    '-n[an number option with default value, and it is a global option.]: :->param_2' \
    '--enum[an custom option with default value.]: :->param_4' \
    '-e[an custom option with default value.]: :->param_4' \
    '--bool[an boolean option without default value.]: :->param_6' \
    '-b[an boolean option without default value.]: :->param_6' \
    '--other[an option without specify a type will be a string.]' \
    '-o[an option without specify a type will be a string.]' \
    '--help[Print help text for command.]: :->param_6' \
    '-h[Print help text for command.]: :->param_6' \
    && ret=0
  
  case $state in
  cmd_0)
    _xx__type__first_arg_xx_test__files
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
  
  _arguments -s -C \
    '*: :->cmd_0' \
    && ret=0
  
  case $state in
  cmd_0)
    case $line[1] in
    upgrade|up)
      _xx_upgrade
      ;;
    complete)
      _xx_complete
      ;;
    *)
      _xx_xx
      ;;
    esac
    ;;
  esac
}

if ! command -v compinit >/dev/null; then
  autoload -U compinit && compinit
fi

compdef _xx xx