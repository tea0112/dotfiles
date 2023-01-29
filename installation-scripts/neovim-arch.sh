#!/bin/bash

sudo pacman -S gcc
sudo pacman -S bash-language-server
sudo pacman -S autopep8
sudo pacman -S wget
sudo pacman -S ripgrep
sudo pacman -S neovim
sudo pacman -S stylua
sudo pacman -S shellcheck
sudo pacman -S flake8
sudo pacman -S shfmt

cp ~/dotfiles/.neovim-config.json ~

nvim_config_dir="/home/$USER/nvim"
if [ -d "${nvim_config_dir}" ]; then
    rm -rf "${nvim_config_dir}"
fi
ln -sf /home/$USER/dotfiles/.config/nvim/ /home/$USER/.config/

Packer_File=/home/$USER/.local/share/nvim/site/pack/packer/start/packer.nvim
if [ ! -d "$Packer_File" ]; then
    git clone --depth 1 https://github.com/wbthomason/packer.nvim\
    ~/.local/share/nvim/site/pack/packer/start/packer.nvim
fi

nvim --headless -c 'autocmd User PackerComplete quitall' -c 'PackerSync'
