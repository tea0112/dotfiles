#!/bin/bash

sudo apt install -y polybar

if [ -d "~/.config/polybar" ]; then
    rm -rf ~/.config/polybar
fi

ln -sf ~/dotfiles/.config/polybar/ ~/.config/
