#!/bin/bash
sudo pacman -S tmux
sudo pacman -S xsel

rm -rf ~/.tmux/plugins/tpm
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

rm -rf ~/.tmux.conf
ln -sf ~/dotfiles/.tmux.conf ~
