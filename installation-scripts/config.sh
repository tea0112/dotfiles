#!/bin/bash

echo ".------------------------------------------------."
echo "|                  Config Zsh                    |"
echo "'------------------------------------------------'"
# ZSH_CUSTOM=~/.oh-my-zsh/custom
rm -rf ~/.zshrc
rm -rf ~/.zprofile
rm -rf ~/.inputrc
cp ~/dotfiles/.zshrc ~
cp ~/dotfiles/.zprofile ~
cp ~/dotfiles/.inputrc ~

echo ".------------------------------------------------."
echo "|                     tmuxp                      |"
echo "'------------------------------------------------'"
rm -rf ~/.config/tmuxp
cp -r ~/dotfiles/.config/tmuxp ~/.config

echo ".------------------------------------------------."
echo "|                     vim                        |"
echo "'------------------------------------------------'"
rm -rf ~/.vimrc
cp ~/dotfiles/.vimrc ~

echo ".------------------------------------------------."
echo "|                     clangd                     |"
echo "'------------------------------------------------'"
rm -rf ~/.config/clangd
cp -r ~/dotfiles/.config/clangd ~/.config

echo ".------------------------------------------------."
echo "|                     ranger                     |"
echo "'------------------------------------------------'"
# rm -rf ~/.config/ranger
# cp -r ~/dotfiles/.config/ranger ~/.config

echo ".------------------------------------------------."
echo "|                   Config Mpv                   |"
echo "'------------------------------------------------'"
rm -rf ~/.config/mpv
cp -r ~/dotfiles/.config/mpv ~/.config

echo ".------------------------------------------------."
echo "|                    Config i3                   |"
echo "'------------------------------------------------'"
# rofimoji
# arandr
# gnome-disk-utility
# wmctrl
# xdotool
# lxqt-policykit
# network-manager-applet
# blueman
# autorandr
# feh
# xfce4-notifyd
# ttf-font-awesome
rm -rf ~/.config/i3
cp -r ~/dotfiles/.config/i3 ~/.config

echo ".------------------------------------------------."
echo "|                  Config Rofi                   |"
echo "'------------------------------------------------'"
rm -rf ~/.config/rofi
cp -r ~/dotfiles/.config/rofi ~/.config

echo ".------------------------------------------------."
echo "|               Config Polybar                   |"
echo "'------------------------------------------------'"
rm -rf ~/.config/polybar
cp -r ~/dotfiles/.config/polybar ~/.config

echo ".------------------------------------------------."
echo "|               Config Starship                  |"
echo "'------------------------------------------------'"
rm -rf ~/.config/starship.toml
cp ~/dotfiles/.config/starship.toml ~/.config

echo ".------------------------------------------------."
echo "|                  mimetype                      |"
echo "'------------------------------------------------'"
# rm -rf ~/.config/mimeapps.list
# cp ~/dotfiles/.config/mimeapps.list ~/.config

echo ".------------------------------------------------."
echo "|                  Zathura                       |"
echo "'------------------------------------------------'"
rm -rf ~/.config/zathura
cp -r ~/dotfiles/.config/zathura ~/.config

echo ".------------------------------------------------."
echo "|                  Config Neovim                 |"
echo "'------------------------------------------------'"
rm -rf ~/.config/nvim
cp -r ~/dotfiles/.config/nvim ~/.config
cp ~/dotfiles/.shellcheckrc ~
cp ~/dotfiles/.ideavimrc ~

echo ".------------------------------------------------."
echo "|                   Config nnn                   |"
echo "'------------------------------------------------'"
# rm -rf ~/.config/nnn
# cp -r ~/dotfiles/.config/nnn ~/.config

echo ".------------------------------------------------."
echo "|                   Config Picom                 |"
echo "'------------------------------------------------'"
rm -rf ~/.config/picom
cp -r ~/dotfiles/.config/picom ~/.config

echo ".------------------------------------------------."
echo "|                 Config tmux                    |"
echo "'------------------------------------------------'"
rm -rf ~/.tmux.conf
cp ~/dotfiles/.tmux.conf ~

echo ".------------------------------------------------."
echo "|               Configure Alacritty              |"
echo "'------------------------------------------------'"
rm -rf ~/.config/alacritty
cp -r ~/dotfiles/.config/alacritty ~/.config

echo ".------------------------------------------------."
echo "|                 Config go tools                |"
echo "'------------------------------------------------'"
rm -rf ~/go-tools
cp -r ~/dotfiles/go-tools ~

echo ".------------------------------------------------."
echo "|              Configure git hooks               |"
echo "'------------------------------------------------'"
hooks_path=$(git config --global core.hooksPath)
if [[ -z "$hooks_path" ]]; then
	hooks_path=~/.config/git/hooks
	git config --global core.hooksPath "$hooks_path"
fi
mkdir -p "$hooks_path"
if [[ ! -f "$hooks_path/pre-push" ]]; then
	cp ~/dotfiles/pre-push "$hooks_path/pre-push"
	chmod +x "$hooks_path/pre-push"
fi
