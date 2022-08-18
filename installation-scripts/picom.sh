#!/bin/bash

if [ -d "~/.config/i3" ]; then
    rm -rf ~/.config/i3
fi

ln -sf ~/dotfiles/.config/i3/ ~/.config/
