#!/bin/bash

./dependencies-install/first-installer.sh

ln -sf ~/dotfiles/.scripts ~
bash ~/dotfiles/config-data/zathura.sh
bash ~/dotfiles/config-data/alacritty.sh
bash ~/dotfiles/config-data/i3.sh
