#!/bin/bash

sudo pacman -Syy
sudo pacman -Syu
sudo pacman -S wget git linux linux-headers
sudo pacman -S --needed base-devel
sudo pacman -S polkit-gnome

bash ~/.scripts/mmi.sh https://aur.archlinux.org/yay
bash ~/.scripts/mmi.sh https://aur.archlinux.org/google-chrome
