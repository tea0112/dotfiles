#!/bin/bash

sudo apt install curl -y
bash ./dependencies/install-rust.sh
cargo install exa
cargo install zoxide

bash ./dependencies/tmux-ubuntu.sh
bash ./dependencies/starship-ubuntu.sh

sudo apt install wmctrl -y
sudo apt install python3-pip -y
sudo apt install python3-virtualenv -y
sudo apt install python3.10-venv -y
sudo apt install xclip -y
sudo apt install aria2 -y
sudo apt install unzip -y
sudo apt install build-essential -y
sudo apt install -y zsh

pip install cmake

rm -rf ~/.oh-my-zsh
git clone https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh

rm -rf ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-autosuggestions.git ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions

rm -rf ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting

rm -rf ~/.oh-my-zsh/custom/themes/powerlevel10k
ZSH_CUSTOM=/home/$USER/.oh-my-zsh/custom
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM}/themes/powerlevel10k

rm -rf ~/.zshrc

dotfiles_dir=~/dotfiles
ln -sf ${dotfiles_dir}/.zshrc ~
ln -sf ${dotfiles_dir}/.zprofile ~

chsh -s $(which zsh)
