#!/bin/bash

sudo pacman -S xdotool

if [ -d "/home/thai/.config/i3" ]; then
    rm -rf ~/.config/i3
fi

ln -sf ~/dotfiles/.config/i3/ ~/.config/
