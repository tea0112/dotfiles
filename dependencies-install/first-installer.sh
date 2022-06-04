#!/bin/bash

sudo pacman -Syy
sudo pacman -Syu
sudo pacman -S wget git linux linux-headers
sudo pacman -S --needed base-devel
sudo pacman -S polkit-gnome
sudo pacman -S arandr
sudo pacman -S polybar
sudo pacman -S rofi

bash ~/.scripts/mmi.sh https://aur.archlinux.org/yay
bash ~/.scripts/mmi.sh https://aur.archlinux.org/noto-fonts-emoji-git.git
bash ~/.scripts/mmi.sh https://aur.archlinux.org/google-chrome
