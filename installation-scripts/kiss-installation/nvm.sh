#!/bin/bash

echo "========== Install nvm =========="
get_repo_version="$HOME/dotfiles/scripts/get_repo_version.sh"
version=$($get_repo_version nvm-sh/nvm)
curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/${version}/install.sh" | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
nvm install node --lts
nvm use --lts

