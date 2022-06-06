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
sudo pacman -S i3lock
sudo pacman -S picom
sudo pacman -S zathura
sudo pacman -S zathura-cb
sudo pacman -S zathura-djvu
sudo pacman -S zathura-pdf-poppler
sudo pacman -S zathura-ps

bash ~/dotfiles/.scripts/mmi.sh https://aur.archlinux.org/yay
bash ~/dotfiles/.scripts/mmi.sh https://aur.archlinux.org/google-chrome
