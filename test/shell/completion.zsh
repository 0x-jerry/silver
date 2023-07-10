#compdef xx

_get_type() {
  local scripts_list
  IFS=$'\n' scripts_list=($(SHELL=zsh xx completion "$1"))
  scripts="scripts:scripts:(($scripts_list))"
  _alternative "$scripts"
}

___xx_commands() {
  _arguments -s \
  ': :_files' \
  '*: :_files' \
  {-s,--string}'[An string option with default value. @default is cool]' \
  {-n,--number}'[an number option with default value, and it is a global option. @default is 123.34]' \
  {-e,--enum}'[an custom option with default value. @default is a2]: :{_get_type custom}' \
  {-b,--bool}'[an boolean option without default value. @default is false]' \
  {-o,--other}'[an option without specify a type will be a string.]'
  _alternative \
  'commands:commands:((upgrade\:"an sub : command." up\\:dev\:"an sub : command."))'
}
_xx_upgrade_option() {
  _arguments -s \
  '1: :->null' \
  ': :_files' \
  '*: :_files' \
  {-s,--string}'[sub command option. @default is default]' \
  {-sm,--small}'[other option. @default is false]' \
  {-n,--number}'[an number option with default value, and it is a global option. @default is 123.34]' \
  {-e,--enum}'[an custom option with default value. @default is a2]: :{_get_type custom}' \
  {-b,--bool}'[an boolean option without default value. @default is false]' \
  {-o,--other}'[an option without specify a type will be a string.]'
}
___xx_sub_commands() {
  case $line[1] in
  up:dev|upgrade)
    _xx_upgrade_option
    ;;
  *)
    ___xx_commands
    ;;
  esac
}
_xx() {
  _arguments -s \
  '1: :->cmd' \
  '*: :->args'
  
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