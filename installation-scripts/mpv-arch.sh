#!/bin/bash

sudo pacman -S mpv
rm -rf ~/.config/mpv
ln -sf ~/dotfiles/.config/mpv/ ~/.config
