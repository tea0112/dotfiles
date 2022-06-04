#!/bin/bash

#yay nerd-fonts-jetbrains-mono
#yay ttf-jetbrains-mono
cd /tmp
rm -rf ttf-jetbrains-mono-git
git clone https://aur.archlinux.org/ttf-jetbrains-mono-git.git
cd ttf-jetbrains-mono-git
makepkg -si
cd ..
rm -rf ttf-jetbrains-mono-git

cd /tmp
rm -rf nerd-fonts-jetbrains-mono
git clone https://aur.archlinux.org/nerd-fonts-jetbrains-mono.git
cd nerd-fonts-jetbrains-mono
makepkg -si
cd ..
rm -rf ttf-jetbrains-mono-git

sudo pacman -S alacritty

rm -rf ~/.config/alacritty
ln -sf ~/dotfiles/.config/alacritty ~/.config/
