#compdef xx

___xx_commands() {
  _arguments -s \
  '1: :((upgrade\:"an sub command." up\:"an sub command."))' \
  '*: :_files' \
  {-s,--string}'[An string option with default value. @default is cool]' \
  {-n,--number}'[an number option with default value, and it is a global option. @default is 123.34]' \
  {-e,--enum}'[an custom option with default value. @default is a2]' \
  {-b,--bool}'[an boolean option without default value. @default is false]' \
  {-o,--other}'[an option without specify a type will be a string.]'
}
_xx_upgrade_option() {
  _arguments -s \
  '1: :->null' \
  '*: :_files' \
  {-s,--string}'[sub command option. @default is default]' \
  {-sm,--small}'[other option. @default is false]' \
  {-n,--number}'[an number option with default value, and it is a global option. @default is 123.34]' \
  {-e,--enum}'[an custom option with default value. @default is a2]' \
  {-b,--bool}'[an boolean option without default value. @default is false]' \
  {-o,--other}'[an option without specify a type will be a string.]'
}
___xx_sub_commands() {
  case $line[1] in
  up|upgrade)
    _xx_upgrade_option
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