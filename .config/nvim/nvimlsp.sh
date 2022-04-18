#!/bin/bash

# insall lua PACKER package manager
#git clone --depth 1 https://github.com/wbthomason/packer.nvim\
# ~/.local/share/nvim/site/pack/packer/start/packer.nvim

# install ripgrep and fd
#sudo pacman -S ripgrep
#sudo pacman -S fd

# install python3
#sudo pacman -S python3

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# if nvim directory existing
if [ -d /home/$USER/.config/nvim ]
then
    rm -rf /home/$USER/.config/nvim
fi

mkdir -p /home/$USER/.config/nvim


cp -r $SCRIPT_DIR/* /home/$USER/.config/nvim/
