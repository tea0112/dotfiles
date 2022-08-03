#!/bin/bash

sudo apt install build-essential -y
curl -LO https://github.com/BurntSushi/ripgrep/releases/download/13.0.0/ripgrep_13.0.0_amd64.deb
sudo dpkg -i ripgrep_13.0.0_amd64.deb

nvim_config_dir="/home/$USER/nvim"
if [ -d "${nvim_config_dir}" ]; then
    rm -rf "${nvim_config_dir}"
fi
ln -sf /home/$USER/dotfiles/.config/nvim/ /home/$USER/.config/

Packer=/home/$USER/.local/share/nvim/site/pack/
if [ ! -d "$Packer" ]; then
    git clone --depth 1 https://github.com/wbthomason/packer.nvim\
    ~/.local/share/nvim/site/pack/packer/start/packer.nvim
fi

nvim --headless -c 'autocmd User PackerComplete quitall' -c 'PackerSync'
