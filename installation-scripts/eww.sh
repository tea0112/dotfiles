#!/bin/bash

if [ -d "~/.config/eww" ]; then
    rm -rf ~/.config/eww
fi

ln -sf ~/dotfiles/.config/eww/ ~/.config/
