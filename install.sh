#!/bin/bash

./dependencies-install/first-installer.sh

ln -sf ~/dotfiles/.scripts ~

bash ~/dotfiles/config-data/zathura.sh
bash ~/dotfiles/config-data/alacritty.sh
bash ~/dotfiles/config-data/i3.sh
bash ~/dotfiles/config-data/polybar.sh
bash ~/dotfiles/config-data/picom.sh
bash ~/dotfiles/config-data/mpv.sh
bash ~/dotfiles/config-data/nnn.sh
bash ~/dotfiles/config-data/rofi.sh

bash ~/dotfiles/dependencies-install/zsh-installer.sh
bash ~/dotfiles/dependencies-install/tmux-installer.sh
bash ~/dotfiles/dependencies-install/neovim-installer.sh

