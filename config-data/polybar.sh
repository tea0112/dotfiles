#!/bin/bash

bash ~/.scripts/mmi.sh https://aur.archlinux.org/font-awesome-5

rm -rf ~/.config/polybar
ln -sf ~/dotfiles/.config/polybar/ ~/.config/
