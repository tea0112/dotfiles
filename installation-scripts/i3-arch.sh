#!/bin/bash

sudo pacman -S gnome-disk-utility
sudo pacman -S wmctrl
sudo pacman -S xdotool
sudo pacman -S lxqt-policykit
sudo pacman -S network-manager-applet
sudo pacman -S blueman
sudo pacman -S autorandr
sudo pacman -S feh
sudo pacman -S xfce4-notifyd
sudo pacman -S ttf-font-awesome

if [ -d "/home/thai/.config/i3" ]; then
    rm -rf ~/.config/i3
fi

ln -sf ~/dotfiles/.config/i3/ ~/.config/
