#!/bin/bash

sudo pacman -S jq
get_repo_version="$HOME/dotfiles/scripts/get_repo_version.sh"
version=$($get_repo_version nvm-sh/nvm)
curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/${version}/install.sh" | bash
