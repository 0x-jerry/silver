#compdef xx

_get_type_list() {
  local scripts_list
  IFS=$'\n' scripts_list=($(SHELL=zsh xx completion "$1"))
  scripts="scripts:$1:(($scripts_list))"
  _alternative "$scripts"
}

__gen_option_type_test__files() {
  local scripts_list
  IFS=$'\n' scripts_list=($(SHELL=zsh xx completion test))
  scripts="scripts:test:(($scripts_list))"
  _alternative "$scripts" \
  ':files:_files'
}
___xx_commands_or_params() {
  _alternative \
  ':sub-commands:((upgrade\:"an sub : command. " up\:"an sub : command. " completion\:"Generate autocompletion for zsh."))' \
  :test:{__gen_option_type_test__files}
}
___xx_commands() {
  _arguments -s \
  ': :{___xx_commands_or_params}' \
  '*:files:_files' \
  {-s,--string}'[An string option with default value. @default is cool]' \
  {-n,--number}'[an number option with default value, and it is a global option. @default is 123]' \
  {-e,--enum}'[an custom option with default value. @default is a2]:custom:{_get_type_list custom}' \
  {-b,--bool}'[an boolean option without default value.]' \
  {-o,--other}'[an option without specify a type will be a string.]: :_files' \
  {-h,--help}'[Print help text for command.]'
}
_xx_upgrade_option() {
  _arguments -s \
  '1: :->null' \
  ':files:_files' \
  '*:files:_files' \
  {-s,--string}'[sub command option. @default is default]' \
  '--small[other option.]' \
  {-n,--number}'[an number option with default value, and it is a global option. @default is 123]' \
  {-e,--enum}'[an custom option with default value. @default is a2]:custom:{_get_type_list custom}' \
  {-b,--bool}'[an boolean option without default value.]' \
  {-o,--other}'[an option without specify a type will be a string.]: :_files' \
  {-h,--help}'[Print help text for command.]'
}
_xx_completion_option() {
  _arguments -s \
  '1: :->null' \
  '*:files:_files' \
  ':files:_files' \
  '--install[Install autocompletion for zsh, not implement yet.]: :_files' \
  '--uninstall[Uninstall autocompletion for zsh, not implement yet.]: :_files' \
  {-s,--string}'[An string option with default value. @default is cool]' \
  {-n,--number}'[an number option with default value, and it is a global option. @default is 123]' \
  {-e,--enum}'[an custom option with default value. @default is a2]:custom:{_get_type_list custom}' \
  {-b,--bool}'[an boolean option without default value.]' \
  {-o,--other}'[an option without specify a type will be a string.]: :_files' \
  {-h,--help}'[Print help text for command.]'
}
___xx_sub_commands() {
  case $line[1] in
  up|upgrade)
    _xx_upgrade_option
    ;;
  completion)
    _xx_completion_option
    ;;
  *)
    ___xx_commands
    ;;
  esac
}
_xx() {
  zstyle ':completion:*:*:xx:*' group-name ''
  zstyle ':completion:*:*:xx-grouped:*' group-name ''
  zstyle ':completion:*:descriptions' format '%F{green}-- %d --%f'
  zstyle ':completion:*:*:xx-grouped:*' format '%F{green}-- %d --%f'
  
  local program=xx
  typeset -A opt_args
  local curcontext="$curcontext" state line context
  
  _arguments -s \
     '1: :->cmd' \
     '*: :->args' &&
     ret=0
  
  case $state in
  cmd)
    ___xx_commands
    ;;
  args)
    ___xx_sub_commands
    ;;
  esac
}

if ! command -v compinit >/dev/null; then
  autoload -U compinit && compinit
fi

compdef _xx xx