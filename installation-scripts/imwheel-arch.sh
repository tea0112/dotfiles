#!/bin/bash

sudo pacman -S imwheel

if [ -f "~/.imwheelrc" ]; then
    rm ~/.imwheelrc
fi

ln -sf ~/dotfiles/.imwheelrc ~/
imwheel
