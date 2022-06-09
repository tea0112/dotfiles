#!/bin/bash

./dependencies-install/first-installer.sh
git config --global user.email "ducthaidev@gmail.com"
git config --global user.name "ducthaidev"

ln -sf ~/dotfiles/.scripts ~

bash ~/dotfiles/config-data/zathura.sh
bash ~/dotfiles/config-data/mpv.sh
bash ~/dotfiles/config-data/nnn.sh

bash ~/dotfiles/dependencies-install/zsh-installer.sh
bash ~/dotfiles/dependencies-install/tmux-installer.sh
bash ~/dotfiles/dependencies-install/neovim-installer.sh

