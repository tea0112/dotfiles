#!/bin/bash

sudo pacman -Syy
sudo pacman -Syu
sudo pacman -S wget git linux linux-headers
sudo pacman -S --needed base-devel
sudo pacman -S polkit-gnome
sudo pacman -S arandr
sudo pacman -S polybar
sudo pacman -S rofi
sudo pacman -S noto-fonts-emoji

bash ~/dotfiles/.scripts/mmi.sh https://aur.archlinux.org/yay
bash ~/dotfiles/.scripts/mmi.sh https://aur.archlinux.org/google-chrome
