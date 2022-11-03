#!/bin/bash

if [ -d "$HOME/.config/picom" ]; then
    rm -rf ~/.config/picom
fi

ln -sf ~/dotfiles/.config/picom/ ~/.config/
