#!/bin/bash

if [[ -d "$HOME/.config/zathura " ]]; then
    rm -rf ~/.config/zathura
fi

ln -sf ~/dotfiles/.config/zathura/ ~/.config
