#!/bin/bash

if [ -d "$HOME/.config/eww" ]; then
    rm -rf ~/.config/eww
fi

ln -sf ~/dotfiles/.config/eww/ ~/.config/
