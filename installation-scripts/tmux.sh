#!/bin/bash

git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

if [ -d "~/.tmux.conf" ]; then
    rm -rf ~/.tmux.conf
fi

ln -sf ~/dotfiles/.tmux.conf ~/
