#!/bin/bash

timedatectl set-local-rtc 1
mkdir ~/.config -p

echo ".------------------------------------------------."
echo "|                  startship                     |"
echo "'------------------------------------------------'"
read -r -p "Download and Install startship?" confirm
case $confirm in
y)
	curl -sS https://starship.rs/install.sh | sh
	;;
*)
	echo "you chose NO"
	;;
esac

echo ".------------------------------------------------."
echo "|               tmux tpm plugin                  |"
echo "'------------------------------------------------'"
read -r -p "Clone tmux tpm plugin?" confirm
case $confirm in
y)
	rm -rf ~/.tmux/plugins/tpm
	git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
	;;
*)
	echo "you chose NO"
	;;
esac

echo ".------------------------------------------------."
echo "|                 Config tmux                    |"
echo "'------------------------------------------------'"
rm -rf ~/.tmux.conf
ln -sf ~/dotfiles/.tmux.conf ~

echo ".------------------------------------------------."
echo "|               Config Starship                  |"
echo "'------------------------------------------------'"
rm -rf ~/.config/starship.toml
ln -sf ~/dotfiles/.config/startship.toml ~/.config/

echo ".------------------------------------------------."
echo "|             Clone zsh plugins                  |"
echo "'------------------------------------------------'"
read -r -p "Clone zsh ohmyzsh, autosuggestions, zsh-syntax-highlighting, powerlevel10k?" confirm
case $confirm in
y)
	rm -rf ~/.oh-my-zsh
	git clone https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh

	rm -rf ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions
	git clone https://github.com/zsh-users/zsh-autosuggestions.git ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions

	rm -rf ~/.oh-my-zsh/custom/plugins/zsh-vi-mode
	git clone https://github.com/jeffreytse/zsh-vi-mode ~/.oh-my-zsh/custom/plugins/zsh-vi-mode

	rm -rf ~/.oh-my-zsh/custom/themes/powerlevel10k
	git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ~/.oh-my-zsh/custom/themes/powerlevel10k
	;;
*)
	echo "you chose NO"
	;;
esac

echo ".------------------------------------------------."
echo "|                  Config Zsh                    |"
echo "'------------------------------------------------'"
ZSH_CUSTOM=~/.oh-my-zsh/custom
rm -rf ~/.zshrc
rm -rf ~/.zprofile
ln -sf ~/dotfiles/.zshrc ~
ln -sf ~/dotfiles/.zprofile ~

chsh -s "$(which zsh)"

echo ".------------------------------------------------."
echo "|                  Config Neovim                 |"
echo "'------------------------------------------------'"
rm -rf ~/.config/nvim
ln -sf ~/dotfiles/.config/nvim/ ~/.config/
ln -sf ~/dotfiles/.shellcheckrc ~
ln -sf ~/dotfiles/.ideavimrc ~

echo ".------------------------------------------------."
echo "|               Config Polybar                   |"
echo "'------------------------------------------------'"
rm -rf "$HOME/.config/polybar"
ln -sf "$HOME/dotfiles/.config/polybar/" "$HOME/.config/"

echo ".------------------------------------------------."
echo "|                     clangd                     |"
echo "'------------------------------------------------'"
rm -rf ~/.config/clangd
ln -sf ~/dotfiles/.config/clangd/ ~/.config/

echo ".------------------------------------------------."
echo "|                  Config Rofi                   |"
echo "'------------------------------------------------'"
rm -rf "$HOME/.config/rofi"
ln -sf ~/dotfiles/.config/rofi/ ~/.config/

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
ln -sf ~/dotfiles/.config/i3/ ~/.config/

echo ".------------------------------------------------."
echo "|               Configure Alacritty              |"
echo "'------------------------------------------------'"
rm -rf ~/.config/alacritty
ln -sf ~/dotfiles/.config/alacritty/ ~/.config/

echo ".------------------------------------------------."
echo "|                   Config Mpv                   |"
echo "'------------------------------------------------'"
rm -rf ~/.config/mpv
ln -sf ~/dotfiles/.config/mpv/ ~/.config/

echo ".------------------------------------------------."
echo "|                  Zathura                       |"
echo "'------------------------------------------------'"
rm -rf ~/.config/zathura
ln -sf ~/dotfiles/.config/zathura/ ~/.config/

echo ".------------------------------------------------."
echo "|                     font                       |"
echo "'------------------------------------------------'"
read -r -p "Install Caskaydia Cove Nerd Font?" confirm
case $confirm in
y)
	echo "******************* Install Font *******************"
	mkdir -p ~/.local/share/fonts/otf
	mkdir -p ~/.local/share/fonts/tff

	TFF_DIR=~/.local/share/fonts/tff
	#OTF_DIR=~/.local/share/fonts/otf

	FONT_FILE="CaskaydiaCoveNerdFont-Regular.ttf"

	if [ -f "${TFF_DIR}/${FONT_FILE}" ]; then
		echo "${FONT_FILE} exists!"
	else
		cp ~/dotfiles/${FONT_FILE} "$TFF_DIR"
		fc-cache -f -v
	fi
	;;
*)
	echo "you chose NO"
	;;
esac
