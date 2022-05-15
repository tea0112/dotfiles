#!/bin/bash
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
zsh
nvm install node
nvm use node
npm install -g npm
npm i -g bash-language-server
sudo apt-get install -y ripgrep
sudo add-apt-repository ppa:neovim-ppa/unstable
sudo apt-get update -y
sudo apt-get install -y neovim
