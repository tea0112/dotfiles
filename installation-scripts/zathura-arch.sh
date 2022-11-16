#!/bin/bash

sudo pacman -S zathura
sudo pacman -S zathura-cb
sudo pacman -S zathura-djvu
sudo pacman -S zathura-ps
sudo pacman -S zathura-pdf-mupdf

if [[ -d "$HOME/.config/zathura " ]]; then
    rm -rf ~/.config/zathura
fi

ln -sf ~/dotfiles/.config/zathura/ ~/.config
