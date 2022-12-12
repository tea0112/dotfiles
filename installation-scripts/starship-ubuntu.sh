#!/bin/bash

curl -sS https://starship.rs/install.sh | sh

if [ -d "~/.config/starship.toml" ]; then
    rm -rf ~/.config/starship.toml
fi

ln -sf ~/dotfiles/.config/startship.toml ~/.config/
