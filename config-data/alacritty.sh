#!/bin/bash

bash ~/.scripts/mmi.sh https://aur.archlinux.org/ttf-jetbrains-mono-git
bash ~/.scripts/mmi.sh https://aur.archlinux.org/nerd-fonts-jetbrains-mono

sudo pacman -S alacritty

rm -rf ~/.config/alacritty
ln -sf ~/dotfiles/.config/alacritty ~/.config/
