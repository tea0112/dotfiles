#!/bin/bash

sudo apt install -y imwheel

if [ -f "~/.imwheelrc" ]; then
    rm ~/.imwheelrc
fi

ln -sf ~/dotfiles/.imwheelrc ~/
imwheel
