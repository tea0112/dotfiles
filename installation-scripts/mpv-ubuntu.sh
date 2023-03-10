#!/bin/bash

sudo apt install -y mpv
rm -rf ~/.config/mpv
ln -sf ~/dotfiles/.config/mpv/ ~/.config
