#!/bin/bash

sudo pacman -Syy
sudo pacman -Syu
sudo pacman -S wget git linux linux-headers
sudo pacman -S --needed base-devel
sudo pacman -S noto-fonts-emoji
sudo pacman -S nnn
sudo pacman -S zathura
sudo pacman -S zathura-cb
sudo pacman -S zathura-djvu
sudo pacman -S zathura-pdf-poppler
sudo pacman -S zathura-ps
sudo pacman -S bluez
sudo pacman -S bluez-utils
sudo pacman -S pulseaudio-bluetooth

bash ~/dotfiles/.scripts/mmi.sh https://aur.archlinux.org/yay
bash ~/dotfiles/.scripts/mmi.sh https://aur.archlinux.org/google-chrome
bash ~/dotfiles/.scripts/mmi.sh https://aur.archlinux.org/nerd-fonts-hack

wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
