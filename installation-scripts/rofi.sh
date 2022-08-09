#!/bin/bash

if [ -d "~/.config/rofi" ]; then
    rm -rf ~/.config/rofi
fi

ln -sf ~/dotfiles/.config/rofi/ ~/.config/
