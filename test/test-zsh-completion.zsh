# source this script to test zsh auto completion
# source test/xx.zsh
export PATH="$PATH:$(pwd)/test/bin"
source <(xx completion)
