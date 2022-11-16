#!/bin/bash

if [ -d "/home/thai/.config/alacritty" ]; then
    rm -rf ~/.config/alacritty
fi

ln -sf ~/dotfiles/.config/alacritty/ ~/.config/
