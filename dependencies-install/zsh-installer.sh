#!/bin/bash
sudo apt-get install -y zsh
git clone https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh
./2-autosuggestions-zsh.sh
./3-syntax-highlighting-zsh.sh
./5-powerlevel10k.sh
bash -c "~/dotfiles/install.sh"
zsh
chsh -s $(which zsh)
