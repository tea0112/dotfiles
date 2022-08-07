#!/bin/bash

if [ -d "~/.config/alacritty" ]; then
    rm -rf ~/.config/alacritty
fi

ln -sf ~/dotfiles/.config/alacritty/ ~/.config/
