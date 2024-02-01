#!/bin/bash

# if you are using gnome, you should install "extension-manager", "AppIndicator and KStatusNotifierItem Support" in order to show Qt tray icons

if [[ ! -f "/usr/bin/zsh" ]]; then
	echo "ZSH doesn't exist"
	echo "You should run this script by ZSH!"
	exit 0
fi

echo "instal default terminal for things like ranger, neovim"
echo "export TERMINAL=/usr/bin/alacritty" >>"$HOME/.profile"

flatpak remote-add --if-not-exists --user flathub https://dl.flathub.org/repo/flathub.flatpakrepo

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

	rm -rf ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
	git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting

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
# ZSH_CUSTOM=~/.oh-my-zsh/custom
rm -rf ~/.zshrc
rm -rf ~/.zprofile
cp ~/dotfiles/.zshrc ~
cp ~/dotfiles/.zprofile ~

chsh -s "$(which zsh)"

echo ".------------------------------------------------."
echo "|                     tmuxp                      |"
echo "'------------------------------------------------'"
rm -rf ~/.config/tmuxp
cp -r ~/dotfiles/.config/tmuxp ~/.config

echo ".------------------------------------------------."
echo "|                     clangd                     |"
echo "'------------------------------------------------'"
rm -rf ~/.config/clangd
cp -r ~/dotfiles/.config/clangd ~/.config

echo ".------------------------------------------------."
echo "|                     ranger                     |"
echo "'------------------------------------------------'"
rm -rf ~/.config/ranger
cp -r ~/dotfiles/.config/ranger ~/.config

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
cp ~/dotfiles/.config/startship.toml ~/.config

echo ".------------------------------------------------."
echo "|                  mimetype                      |"
echo "'------------------------------------------------'"
# rm -rf ~/.config/mimeapps.list
# cp ~/dotfiles/.config/mimeapps.list ~/.config

echo ".------------------------------------------------."
echo "|                  Zathura                       |"
echo "'------------------------------------------------'"
rm -rf ~/.config/zathura
cp ~/dotfiles/.config/zathura ~/.config

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
rm -rf ~/.config/nnn
cp -r ~/dotfiles/.config/nnn ~/.config

echo ".------------------------------------------------."
echo "|                   Config Picom                 |"
echo "'------------------------------------------------'"
rm -rf ~/.config/picom
cp -r ~/dotfiles/.config/picom ~/.config

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
cp ~/dotfiles/.tmux.conf ~

echo ".------------------------------------------------."
echo "|               Configure Alacritty              |"
echo "'------------------------------------------------'"
rm -rf ~/.config/alacritty
cp -r ~/dotfiles/.config/alacritty ~/.config

echo ".------------------------------------------------."
echo "|                Install Go                      |"
echo "'------------------------------------------------'"
read -r -p "Install golang?" confirm
case $confirm in
y)
	./kiss-installation/go.sh
	;;
*)
	echo "you chose NO"
	;;
esac

echo ".------------------------------------------------."
echo "|                Install Rust                    |"
echo "'------------------------------------------------'"
read -r -p "Install rust?" confirm
case $confirm in
y)
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	source "/home/${USER}/.cargo/env"
	;;
*)
	echo "you chose NO"
	;;
esac
